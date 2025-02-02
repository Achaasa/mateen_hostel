import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Staff } from "@prisma/client";
import { StaffSchema, updateStaffSchema } from "../zodSchema/staffSchema";
import cloudinary from "../utils/cloudinary";
import { formatPrismaError } from "../utils/formatPrisma";

export const addStaff = async (
  StaffData: Staff,
  picture: { passportUrl: string; passportKey: string }
) => {
  try {
    const validateStaff = StaffSchema.safeParse(StaffData);
    if (!validateStaff.success) {
      const errors = validateStaff.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    const findStaff = await prisma.staff.findUnique({
      where: { email: StaffData.email },
    });
    if (findStaff) {
      throw new HttpException(
        HttpStatus.CONFLICT,
        "Staff already registered with this email"
      );
    }

    const createdStaff = await prisma.staff.create({
      data: {
        ...StaffData,
        passportKey: picture.passportKey,
        passportUrl: picture.passportUrl,
      },
    });
    return createdStaff as Staff; // Return the created Staff
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllStaffs = async () => {
  try {
    const Staffs = await prisma.staff.findMany({ include: { hostel: true } });
    return Staffs as Staff[];
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getStaffById = async (StaffId: string) => {
  try {
    const Staff = await prisma.staff.findUnique({
      where: { id: StaffId },
      include: { hostel: true },
    });
    if (!Staff) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Staff not found");
    }
    return Staff as Staff;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const deleteStaff = async (StaffId: string) => {
  try {
    const findStaff = await getStaffById(StaffId);
    if (!findStaff) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Staff not found");
    }
    await cloudinary.uploader.destroy(findStaff.passportKey);
    await prisma.staff.delete({ where: { id: StaffId } });
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const updateStaff = async (
  StaffId: string,
  StaffData: Partial<Staff>,
  picture?: { passportUrl: string; passportKey: string }
) => {
  try {
    // Validate the Staff data using the schema
    const validateStaff = updateStaffSchema.safeParse(StaffData);
    if (!validateStaff.success) {
      const errors = validateStaff.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    // Find the Staff from the database
    const findStaff = await prisma.staff.findUnique({
      where: { id: StaffId },
    });
    if (!findStaff) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Staff not found");
    }

    // Prepare the Staff data for update
    let updatedStaffData = { ...StaffData }; // Make a copy of StaffData

    // If a picture is provided, update image URL and key
    if (picture && picture.passportUrl && picture.passportKey) {
      if (findStaff.passportKey) {
        // Remove old image from cloud storage
        await cloudinary.uploader.destroy(findStaff.passportKey);
      }
      // Update the Staff data with new image details
      updatedStaffData = {
        ...updatedStaffData,
        passportUrl: picture.passportUrl,
        passportKey: picture.passportKey,
      };
    }

    // Update Staff in the database with the new data
    const updatedStaff = await prisma.staff.update({
      where: { id: StaffId },
      data: updatedStaffData,
    });
    console.log("Updated Staff: ", updatedStaff);
    // Return the updated Staff object
    return updatedStaff;
  } catch (error) {
    throw formatPrismaError(error);
  }
};


export const getAllStaffForHostel = async (hostelId: string) => {
  try {
    const staffs = await prisma.staff.findMany({
      where:  { hostelId } ,
    });
    return staffs;
  } catch (error) {
    throw formatPrismaError(error);
  }
};