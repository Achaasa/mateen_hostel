import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Prisma, Resident, RoomStatus } from "@prisma/client";
import { ErrorResponse } from "../utils/types";
import {
  residentSchema,
  updateResidentSchema,
} from "../zodSchema/residentSchema";
import { formatPrismaError } from "../utils/formatPrisma";

export const register = async (residentData: Resident) => {
  try {
    const validateResident = residentSchema.safeParse(residentData);
    if (!validateResident.success) {
      const errors = validateResident.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.resident.findUnique({
      where: { email: residentData.email },
    });
    if (resident) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "resident with the same Email already exists",
      );
    }
    const { roomId } = residentData;
    if (!roomId) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Room was not is provided.",
      );
    }
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
    }
    if (
      existingRoom.gender !== "MIX" &&
      existingRoom.gender !== residentData.gender
    ) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `Room gender does not match resident's gender.`,
      );
    }

    const currentResidentsCount = await prisma.resident.count({
      where: { roomId: residentData.roomId },
    });

    if (currentResidentsCount >= existingRoom.maxCap) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Room has reached its maximum capacity.",
      );
    }

    const newResident = await prisma.resident.create({
      data: { ...residentData, roomPrice: existingRoom.price },
    });

    return newResident as Resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllResident = async () => {
  try {
    const residents = await prisma.resident.findMany({
      where: {
        OR: [
          {
            room: null, // Include residents without a room
          },
          {
            room: {
              is: {
                hostel: {
                  is: {
                    delFlag: false, // Only include residents whose room's hostel is not deleted
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        room: {
          include: {
            hostel: true, // Optional: include hostel info
          },
        },
      },
    });

    return residents as Resident[];
  } catch (error) {
    throw formatPrismaError(error);
  }
};


export const getResidentById = async (residentId: string) => {
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: { room: true },
    });
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }
    return resident as Resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getResidentByEmail = async (email: string) => {
  try {
    const resident = await prisma.resident.findUnique({
      where: { email },
      include: { room: true },
    });
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }
    return resident as Resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const updateResident = async (
  residentId: string,
  residentData: Resident,
) => {
  try {
    const validateResident = updateResidentSchema.safeParse(residentData);
    if (!validateResident.success) {
      const errors = validateResident.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    });
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "resident not found");
    }
    const { balanceOwed, amountPaid, ...restOfresident } = residentData;
    const updatedResident = await prisma.resident.update({
      where: { id: residentId },
      data: { ...restOfresident },
    });
    return updatedResident as Resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const deleteResident = async (residentId: string) => {
  try {
    const findResident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: { room: true, CalendarYear: true, Hostel: true },
    });
    if (!findResident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found");
    }

    const paymentCount = await prisma.payment.count({
      where: { residentId: residentId },
    });

    const result = await prisma.$transaction(async (tx) => {
      if (paymentCount > 0 && findResident.roomId) {
        // Archive to HistoricalResident if payments and roomId exist
        const historicalResident = await tx.historicalResident.create({
          data: {
            residentId: findResident.id,
            room: { connect: { id: findResident.roomId } }, // roomId is guaranteed to exist here
            CalendarYear: { connect: { id: findResident.calendarYearId } },
            amountPaid: findResident.amountPaid,
            roomPrice: findResident.roomPrice ?? 0,
            Hostel: findResident.hostelId
              ? { connect: { id: findResident.hostelId } }
              : undefined,
            residentName: findResident.name,
            residentEmail: findResident.email,
            residentPhone: findResident.phone,
            residentCourse: findResident.course,
          },
        });

        // Reassign Payments to HistoricalResident
        await tx.payment.updateMany({
          where: { residentId: residentId },
          data: {
            residentId: null,
            historicalResidentId: historicalResident.id,
          },
        });

        // Delete the Resident
        await tx.resident.delete({
          where: { id: residentId },
        });

        // Free up the room
        await tx.room.update({
          where: { id: findResident.roomId },
          data: { status: RoomStatus.AVAILABLE },
        });

        return { archived: true, historicalResident };
      } else {
        // Hard delete Resident and Payments if no roomId or no payments
        if (paymentCount > 0) {
          await tx.payment.deleteMany({
            where: { residentId: residentId },
          });
        }

        await tx.resident.delete({
          where: { id: residentId },
        });

        if (findResident.roomId) {
          await tx.room.update({
            where: { id: findResident.roomId },
            data: { status: RoomStatus.AVAILABLE },
          });
        }

        return { archived: false };
      }
    });

    return result;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getDebtors = async () => {
  try {
    const debtors = await prisma.resident.findMany({
      where: { balanceOwed: { gt: 0 } },
    });
    return debtors as Resident[];
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getDebtorsForHostel = async (hostelId: string) => {
  try {
    const debtors = await prisma.resident.findMany({
      where: { balanceOwed: { gt: 0 }, room: { hostelId } },
    });
    return debtors as Resident[];
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error fetching debtors",
    );
  }
};

export const getAllresidentsForHostel = async (hostelId: string) => {
  try {
    const residents = await prisma.resident.findMany({
      where: {
        delFlag: false, // Only get non-deleted residents
        OR: [
          {
            room: {
              hostelId,
              hostel: {
                delFlag: false, // Only get residents from non-deleted hostels
              },
            },
          },
          { hostelId: hostelId },
        ],
      },
      include: {
        room: {
          where: {
            delFlag: false, // Only include non-deleted rooms
          },
        },
      },
    });
    return residents;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const addResidentFromHostel = async (residentData: Resident) => {
  try {
    const validateResident = residentSchema.safeParse(residentData);
    if (!validateResident.success) {
      const errors = validateResident.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.resident.findUnique({
      where: { email: residentData.email },
    });
    if (resident) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "resident with the same Email already exists",
      );
    }

    const newResident = await prisma.resident.create({
      data: { ...residentData },
    });

    return newResident as Resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const assignRoomToResident = async (
  residentId: string,
  roomId: string,
) => {
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    });
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
    }
    if (room.gender !== "MIX" && room.gender !== resident.gender) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `Room gender does not match resident's gender.`,
      );
    }
    if (resident.hostelId !== room.hostelId) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `Resident and room do not belong to the same hostel.`,
      );
    }

    const currentResidentsCount = await prisma.resident.count({
      where: { roomId: resident.roomId },
    });

    if (currentResidentsCount >= room.maxCap) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Room has reached its maximum capacity.",
      );
    }

    const assignResident = await prisma.resident.update({
      where: { id: residentId },
      data: { roomId },
    });

    return assignResident as Resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
