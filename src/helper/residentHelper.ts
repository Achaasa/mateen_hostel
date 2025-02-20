import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Resident } from "@prisma/client";
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
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.resident.findUnique({
      where: { email: residentData.email },
    });
    if (resident) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "resident with the same Email already exists"
      );
    }
    const { roomId } = residentData;
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
    }
    if (existingRoom.gender !== 'MIX' && existingRoom.gender !== residentData.gender) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        `Room gender does not match resident's gender.`
      );
    }

    const currentResidentsCount = await prisma.resident.count({
      where: { roomId: residentData.roomId },
    });

    if (currentResidentsCount >= existingRoom.maxCap) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Room has reached its maximum capacity."
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
      include: { room: true },
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
  residentData: Resident
) => {
  try {
    const validateResident = updateResidentSchema.safeParse(residentData);
    if (!validateResident.success) {
      const errors = validateResident.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
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
    });
    if (!findResident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found");
    }
    await prisma.resident.delete({ where: { id: residentId } });
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
      err.message || "Error fetching debtors"
    );
  }
};

export const getAllresidentsForHostel = async (hostelId: string) => {
  try {
    const residents = await prisma.resident.findMany({
      where: { room: { hostelId } },
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
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const resident = await prisma.resident.findUnique({
      where: { email: residentData.email },
    });
    if (resident) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "resident with the same Email already exists"
      );
    }
    const { roomId } = residentData;
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
    }
    const currentResidentsCount = await prisma.resident.count({
      where: { roomId: residentData.roomId },
    });

    if (currentResidentsCount >= existingRoom.maxCap) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Room has reached its maximum capacity."
      );
    }
    const newResident = await prisma.resident.create({
      data: { ...residentData, roomPrice: existingRoom.price },
    });
    await prisma.room.update({
      where: { id: roomId },
      data: { currentResidentCount: currentResidentsCount + 1 },
    });
    return newResident as Resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};