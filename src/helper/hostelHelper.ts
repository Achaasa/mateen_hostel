import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Hostel, HostelState } from "@prisma/client";
import { hostelSchema, updateHostelSchema } from "../zodSchema/hostelSchema";
import cloudinary from "../utils/cloudinary";
import { formatPrismaError } from "../utils/formatPrisma";

export const addHostel = async (
  hostelData: Hostel,
  pictures: { imageUrl: string; imageKey: string }[],
) => {
  try {
    const validateHostel = hostelSchema.safeParse(hostelData);
    if (!validateHostel.success) {
      const errors = validateHostel.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    // Check for existing hostel including soft-deleted ones
    const findHostel = await prisma.hostel.findFirst({
      where: {
        email: hostelData.email,
        delFlag: false, // Only check against non-deleted hostels
      },
    });
    if (findHostel) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Hostel already registered with this email",
      );
    }

    const createdHostel = await prisma.hostel.create({
      data: {
        ...hostelData,
        delFlag: false, // Explicitly set delFlag to false for new hostels
      },
    });
    if (!createdHostel) {
      throw new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "error creating hostel",
      );
    }
    const hostelImage = pictures.map((picture) => ({
      imageUrl: picture.imageUrl,
      imageKey: picture.imageKey,
      hostelId: createdHostel.id,
    }));
    // insert the images into db
    if (hostelImage.length > 0) {
      await prisma.hostelImages.createMany({ data: hostelImage });
    }
    return createdHostel as Hostel;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllHostels = async () => {
  try {
    const hostels = await prisma.hostel.findMany({
      where: {
        delFlag: false, // Only get non-deleted hostels
      },
      include: {
        Rooms: {
          include: { Amenities: true, RoomImage: true },
        },
        Staffs: true,
        User: true,
        Amenities: true,
        HostelImages: true,
        CalendarYear: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
    return hostels;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getHostelById = async (hostelId: string) => {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: {
        id: hostelId,
        delFlag: false, // Only get non-deleted hostels
      },
      include: {
        Rooms: true,
        Staffs: true,
        User: true,
        HostelImages: true,
        CalendarYear: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
            startDate: true,
            endDate: true,
          },
        },
      },
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
    const findHostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: { HostelImages: true },
    });

    if (!findHostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }

    //  update the delFlag to true
    await prisma.hostel.update({
      where: { id: hostelId },
      data: { delFlag: true },
    });

    return { message: "Hostel soft deleted successfully" };
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const updateHostel = async (
  hostelId: string,
  hostelData: Partial<Hostel>,
  pictures: { imageUrl: string; imageKey: string }[],
) => {
  try {
    // Validate the hostel data using the schema
    const validateHostel = updateHostelSchema.safeParse(hostelData);
    if (!validateHostel.success) {
      const errors = validateHostel.error.issues.map(
        ({ message, path }) => `${path}: ${message}`,
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    // Find the hostel from the database
    const findHostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: { HostelImages: true },
    });

    if (!findHostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }

    // Delete old images from Cloudinary
    if (findHostel.HostelImages && findHostel.HostelImages.length > 0) {
      for (const image of findHostel.HostelImages) {
        await cloudinary.uploader.destroy(image.imageKey);
      }
    }

    // Remove old images from the database
    await prisma.hostelImages.deleteMany({
      where: { hostelId: hostelId },
    });

    // Update hostel in the database with the new data
    const updatedHostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: hostelData,
    });

    // Add new images to database if provided
    if (pictures.length > 0) {
      const hostelImages = pictures.map((picture) => ({
        imageUrl: picture.imageUrl,
        imageKey: picture.imageKey,
        hostelId: hostelId,
      }));
      await prisma.hostelImages.createMany({ data: hostelImages });
    }

    return updatedHostel;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getUnverifiedHostel = async () => {
  try {
    const unverifiedHostel = await prisma.hostel.findMany({
      where: {
        isVerifeid: false,
        delFlag: false, // Only get non-deleted hostels
      },
    });
    return unverifiedHostel;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const publishHostel = async (hostelId: string) => {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: {
        id: hostelId,
        delFlag: false, // Only get non-deleted hostels
      },
    });
    if (!hostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }
    const isActive = await prisma.calendarYear.findFirst({
      where: {
        hostelId: hostelId,
        isActive: true,
      },
    });
    if (!isActive) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Calendar year must be active before publishing hostel",
      );
    }
    await prisma.hostel.update({
      where: { id: hostelId },
      data: { state: HostelState.PUBLISHED },
    });
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const unPublishHostel = async (hostelId: string) => {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: {
        id: hostelId,
        delFlag: false, // Only get non-deleted hostels
      },
    });
    if (!hostel) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");
    }
    await prisma.hostel.update({
      where: { id: hostelId },
      data: { state: HostelState.UNPUBLISHED },
    });
  } catch (error) {
    throw formatPrismaError(error);
  }
};
