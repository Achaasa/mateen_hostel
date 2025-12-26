import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { ErrorResponse } from "../utils/types";
import { ResidentRequestDto, UpdateResidentRequestDto } from "../zodSchema/residentSchema";
import { hashPassword } from "../utils/bcrypt";
import {
  residentSchema,
  updateResidentSchema,
} from "../zodSchema/residentSchema";
import { CreateMaintenanceRequestDto, createMaintenanceRequestSchema } from "../zodSchema/requestSchema";
import { formatPrismaError } from "../utils/formatPrisma";
import { CreateFeedbackDto, createFeedbackSchema } from "../zodSchema/feedbackSchema";

export const register = async (residentData: ResidentRequestDto) => {
  try {
    const validateResident = residentSchema.safeParse(residentData);
    if (!validateResident.success) {
      const errors = validateResident.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const { roomId } = residentData as { roomId?: string };
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
      existingRoom.gender !== "mix" &&
      existingRoom.gender !== residentData.gender
    ) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `Room gender does not match resident's gender.`,
      );
    }

    const currentResidentsCount = await prisma.residentProfile.count({
      where: { roomId: residentData.roomId as string },
    });

    if (currentResidentsCount >= existingRoom.maxCap) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Room has reached its maximum capacity.",
      );
    }

    const hashed = await hashPassword(residentData.password);
    const user = await prisma.user.create({
      data: {
        email: residentData.email,
        password: hashed,
        name: `${residentData.firstName} ${residentData.lastName}`,  // Combine first and last name
        gender: residentData.gender,
        phone: residentData.phone ?? null,
        role: "resident",
      },
    });

    const newProfile = await prisma.residentProfile.create({
      data: {
        userId: user.id,
        hostelId: residentData.hostelId ?? null,
        roomId,
        studentId: residentData.studentId ?? null,
        course: residentData.course ?? null,
        status: "active",
        checkInDate: residentData.checkInDate ?? null,
        checkOutDate: residentData.checkOutDate ?? null,
      },
      include: { room: true, user: true },
    });

    return newProfile;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllResident = async () => {
  try {
    const residents = await prisma.residentProfile.findMany({
      include: { room: { include: { hostel: true } }, user: true },
    });
    return residents;
  } catch (error) {
    throw formatPrismaError(error);
  }
};


export const getResidentById = async (residentId: string) => {
  try {
    const resident = await prisma.residentProfile.findUnique({
      where: { id: residentId },
      include: { room: true, user: true },
    });
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }
    return resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getResidentByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { residentProfile: { include: { room: true } } },
    });
    const resident = user?.residentProfile;
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }
    return resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const updateResident = async (
  residentId: string,
  residentData: UpdateResidentRequestDto,
) => {
  try {
    const validateResident = updateResidentSchema.safeParse(residentData);
    if (!validateResident.success) {
      const errors = validateResident.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.residentProfile.findUnique({
      where: { id: residentId },
    });
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "resident not found");
    }
    const updatedResident = await prisma.residentProfile.update({
      where: { id: residentId },
      data: {
        hostelId: residentData.hostelId ?? resident.hostelId,
        roomId: residentData.roomId ?? resident.roomId,
        studentId: residentData.studentId ?? resident.studentId,
        course: residentData.course ?? resident.course,
        roomNumber: residentData.roomNumber ?? resident.roomNumber,
        status: residentData.status ?? resident.status,
        checkInDate: residentData.checkInDate ?? resident.checkInDate,
        checkOutDate: residentData.checkOutDate ?? resident.checkOutDate,
      },
    });
    return updatedResident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const deleteResident = async (residentId: string) => {
  try {
    const findResident = await prisma.residentProfile.findUnique({
      where: { id: residentId },
      include: { room: true },
    });
    if (!findResident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found");
    }
    const result = await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { residentProfileId: residentId },
        data: { residentProfileId: null },
      });

      await tx.residentProfile.delete({ where: { id: residentId } });

      if (findResident.roomId) {
        const currentCount = await tx.residentProfile.count({ where: { roomId: findResident.roomId } });
        await tx.room.update({
          where: { id: findResident.roomId },
          data: {
            currentResidentCount: currentCount,
            status: currentCount >= 1 ? "occupied" : "available",
          },
        });
      }

      return { archived: false };
    });

    return result;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getDebtors = async () => {
  try {
    const debtorRefs: Array<{ residentProfileId: string | null }> = await prisma.payment.findMany({
      where: { status: "confirmed", balanceOwed: { gt: 0 } },
      select: { residentProfileId: true },
      distinct: ["residentProfileId"],
    });
    const ids = debtorRefs
      .map((d: { residentProfileId: string | null }) => d.residentProfileId)
      .filter((x: string | null): x is string => !!x);
    if (ids.length === 0) return [];
    const debtors = await prisma.residentProfile.findMany({ where: { id: { in: ids } }, include: { room: true, user: true } });
    return debtors;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getDebtorsForHostel = async (hostelId: string) => {
  try {
    const debtorRefs: Array<{ residentProfileId: string | null }> = await prisma.payment.findMany({
      where: { status: "confirmed", balanceOwed: { gt: 0 }, residentProfile: { room: { hostelId } } },
      select: { residentProfileId: true },
      distinct: ["residentProfileId"],
    });
    const ids = debtorRefs
      .map((d: { residentProfileId: string | null }) => d.residentProfileId)
      .filter((x: string | null): x is string => !!x);
    if (ids.length === 0) return [];
    const debtors = await prisma.residentProfile.findMany({ where: { id: { in: ids } }, include: { room: true, user: true } });
    return debtors;
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
    const residents = await prisma.residentProfile.findMany({
      where: {
        OR: [
          { room: { hostelId } },
          { hostelId },
        ],
      },
      include: { room: true, user: true },
    });
    return residents;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const addResidentFromHostel = async (residentData: ResidentRequestDto) => {
  try {
    const validateResident = residentSchema.safeParse(residentData);
    if (!validateResident.success) {
      const errors = validateResident.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }
    return await register(residentData);
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const assignRoomToResident = async (
  residentId: string,
  roomId: string,
) => {
  try {
    const resident = await prisma.residentProfile.findUnique({
      where: { id: residentId },
      include: { user: true },
    });
    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
    }
    if (room.gender !== "mix" && room.gender !== resident.user?.gender) {
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

    const currentResidentsCount = await prisma.residentProfile.count({
      where: { roomId: resident.roomId ?? undefined },
    });

    if (currentResidentsCount >= room.maxCap) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Room has reached its maximum capacity.",
      );
    }

    const assignResident = await prisma.residentProfile.update({
      where: { id: residentId },
      data: { roomId },
      include: { room: true, user: true },
    });

    return assignResident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const verifyResidentCode = async (_code: string) => {
  throw new HttpException(HttpStatus.BAD_REQUEST, "Verification code is not supported");
};

export const getResidentRoomDetails = async (userId: string) => {
  try {
    const resident = await prisma.residentProfile.findUnique({
      where: { userId },
      include: {
        room: {
          include: {
            amenities: true,
            hostel: true,
          },
        },
      },
    });

    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident profile not found");
    }

    if (!resident.roomId) {
      return { resident, room: null, roommates: [] };
    }

    const roommates = await prisma.residentProfile.findMany({
      where: {
        roomId: resident.roomId,
        id: { not: resident.id }, // Exclude the resident themselves
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            imageUrl: true,
          },
        },
      },
    });

    return {
      resident,
      room: resident.room,
      roommates,
    };
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const createMaintenanceRequest = async (
  userId: string,
  requestData: CreateMaintenanceRequestDto,
) => {
  try {
    const validateRequest = createMaintenanceRequestSchema.safeParse(requestData);
    if (!validateRequest.success) {
      const errors = validateRequest.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.residentProfile.findUnique({
      where: { userId },
    });

    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident profile not found");
    }

    if (!resident.hostelId) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Resident is not assigned to any hostel",
      );
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        residentId: resident.id,
        hostelId: resident.hostelId,
        type: requestData.type,
        subject: requestData.subject,
        description: requestData.description,
        priority: requestData.priority,
        images: requestData.images || [],
      },
    });

    return request;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getResidentRequests = async (userId: string) => {
  try {
    const resident = await prisma.residentProfile.findUnique({
      where: { userId },
    });

    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident profile not found");
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where: { residentId: resident.id },
      orderBy: { createdAt: "desc" },
    });

    return requests;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getResidentBilling = async (userId: string) => {
  try {
    const resident = await prisma.residentProfile.findUnique({
      where: { userId },
      include: {
        hostel: {
          select: {
            allowPartialPayment: true,
            id: true,
            name: true,
          }
        }
      }
    });

    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident profile not found");
    }

    const payments = await prisma.payment.findMany({
      where: { residentProfileId: resident.id },
      orderBy: { createdAt: "desc" },
      include: {
        calendarYear: {
          select: { name: true }
        }
      }
    });

    // Calculate total balance owed
    const totalBalance = payments.reduce((acc, curr) => acc + (curr.balanceOwed || 0), 0);

    return {
      payments,
      summary: {
        totalBalance,
        allowPartialPayment: resident.hostel?.allowPartialPayment ?? false,
      }
    };

  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getResidentAnnouncements = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        residentProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      throw new HttpException(HttpStatus.NOT_FOUND, "User not found");
    }

    const hostelId = user.residentProfile?.hostelId || user.adminProfile?.hostelId;

    if (!hostelId) {
      return []; // Return empty if not assigned to a hostel yet
    }

    const announcements = await prisma.announcement.findMany({
      where: { hostelId },
      orderBy: { createdAt: "desc" },
    });

    return announcements;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const createFeedback = async (userId: string, data: CreateFeedbackDto) => {
  try {
    const validate = createFeedbackSchema.safeParse(data);
    if (!validate.success) {
      const errors = validate.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.residentProfile.findUnique({
      where: { userId },
    });

    if (!resident || !resident.hostelId) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident profile or hostel not found");
    }

    const feedback = await prisma.feedback.create({
      data: {
        residentId: resident.id,
        hostelId: resident.hostelId,
        rating: data.rating,
        comment: data.comment,
        category: data.category,
      },
    });

    return feedback;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
