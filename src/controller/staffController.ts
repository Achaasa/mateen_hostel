import { NextFunction, Request, Response } from "express";
import * as StaffHelper from "../helper/staffHelper"; // Assuming you have your service functions in this file
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { Staff } from "@prisma/client";
import cloudinary from "../utils/cloudinary";
import {
  StaffRequestDto,
  UpdateStaffRequestDto,
} from "../zodSchema/staffSchema";
import { formatPrismaError } from "../utils/formatPrisma";

// Add a Staff
export const addStaffController = async (req: Request, res: Response) => {
  const photo = req.file ? req.file.path : undefined;
  const StaffData: Staff = req.body satisfies StaffRequestDto;
  const picture = {
    passportUrl: "",
    passportKey: "",
  };

  if (photo) {
    const uploaded = await cloudinary.uploader.upload(photo, {
      folder: "Staff/",
    });
    if (uploaded) {
      picture.passportUrl = uploaded.secure_url;
      picture.passportKey = uploaded.public_id;
    }
  }
  try {
    const newStaff = await StaffHelper.addStaff(StaffData, picture);

    res.status(HttpStatus.CREATED).json({
      message: "Staff created successfully",
      data: newStaff,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Get All Staffs
export const getAllStaffsController = async (req: Request, res: Response) => {
  try {
    const Staffs = await StaffHelper.getAllStaffs();

    res.status(HttpStatus.OK).json({
      message: "Staffs fetched successfully",
      data: Staffs,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Get Staff by ID
export const getStaffByIdController = async (req: Request, res: Response) => {
  const { staffId } = req.params;

  try {
    const Staff = await StaffHelper.getStaffById(staffId);

    res.status(HttpStatus.OK).json({
      message: "Staff fetched successfully",
      data: Staff,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Update a Staff
export const updateStaffController = async (req: Request, res: Response) => {
  const { staffId } = req.params;
  const StaffData: Staff = req.body satisfies UpdateStaffRequestDto; // Again, assuming you're handling file uploads
  const photo = req.file ? req.file.path : undefined;
  const picture = {
    passportUrl: "",
    passportKey: "",
  };
  console.log(StaffData);
  try {
    if (photo) {
      const uploaded = await cloudinary.uploader.upload(photo, {
        folder: "Staff/",
      });
      if (uploaded) {
        picture.passportUrl = uploaded.secure_url;
        picture.passportKey = uploaded.public_id;
      }
    }

    const updatedStaff = await StaffHelper.updateStaff(
      staffId,
      StaffData,
      picture
    );

    res.status(HttpStatus.OK).json({
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Delete Staff
export const deleteStaffController = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await StaffHelper.deleteStaff(id);

    res.status(HttpStatus.OK).json({
      message: "Staff deleted successfully",
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const staffForHostel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hostelId } = req.params;
  try {
    const staffs = await StaffHelper.getAllStaffForHostel(hostelId);
    res
      .status(HttpStatus.OK)
      .json({ message: "staff fecthed successfully", data: staffs });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};