import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Hostel, HostelState } from "@prisma/client";
import { hostelSchema, updateHostelSchema } from "../zodSchema/hostelSchema";
import cloudinary from "../utils/cloudinary";
import { formatPrismaError } from "../utils/formatPrisma";

export const addHostel = async (
  hostelData: Hostel,
  picture: { imageUrl: string; imageKey: string }
) => {
  try {
    const validateHostel = hostelSchema.safeParse(hostelData);
    if (!validateHostel.success) {
      const errors = validateHostel.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const findHostel = await prisma.hostel.findUnique({
      where: { email: hostelData.email },
    });
    if (findHostel) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Hostel already registered with this email"
      );
    }

    const createdHostel = await prisma.hostel.create({
      data: {
        ...hostelData,
        imageKey: picture.imageKey,
        imageUrl: picture.imageUrl,
      },
    });
    return createdHostel as Hostel; // Return the created hostel
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllHostels = async () => {
  try {
    const hostels = await prisma.hostel.findMany({
      include: { Rooms: true, Staffs: true, User: true },
    });
    return hostels as Hostel[];
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getHostelById = async (hostelId: string) => {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: { Rooms: true, Staffs: true, User: true },
    });
    if (!hostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }
    return hostel as Hostel;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const deleteHostel = async (hostelId: string) => {
  try {
    const findHostel = await getHostelById(hostelId);
    if (!findHostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }

    if (findHostel.imageKey) {
      await cloudinary.uploader.destroy(findHostel.imageKey); // Delete the existing image from cloudinary
    }
    await prisma.hostel.delete({ where: { id: hostelId } });
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const updateHostel = async (
  hostelId: string,
  hostelData: Partial<Hostel>,
  picture?: { imageUrl: string; imageKey: string }
) => {
  try {
    // Validate the hostel data using the schema
    const validateHostel = updateHostelSchema.safeParse(hostelData);
    if (!validateHostel.success) {
      const errors = validateHostel.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    // Find the hostel from the database
    const findHostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });
    if (!findHostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }

    // Prepare the hostel data for update
    let updatedHostelData = { ...hostelData }; // Make a copy of hostelData

    // If a picture is provided, update image URL and key
    if (picture && picture.imageUrl && picture.imageKey) {
      if (findHostel.imageKey) {
        // Remove old image from cloud storage
        await cloudinary.uploader.destroy(findHostel.imageKey);
      }
      // Update the hostel data with new image details
      updatedHostelData = {
        ...updatedHostelData,
        imageUrl: picture.imageUrl,
        imageKey: picture.imageKey,
      };
    }

    // Update hostel in the database with the new data
    const updatedHostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: updatedHostelData,
    });
    console.log("Updated Hostel: ", updatedHostel);
    // Return the updated hostel object
    return updatedHostel;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getUnverifiedHostel = async () => {
  try {
    const unverifiedHostel = await prisma.hostel.findMany({
      where: { isVerifeid: false },
    });
    return unverifiedHostel;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const publishHostel = async (hostelId: string) => {
  try {
    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
    if (!hostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }
    await prisma.hostel.update({
      where: { id: hostelId },
      data: { state: HostelState.PUBLISHED },
    });
  } catch (error) {
    throw formatPrismaError(error);
  }
};
