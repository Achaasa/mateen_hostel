import { Request, Response } from "express";
import * as hostelHelper from "../helper/hostelHelper"; // Assuming you have your service functions in this file
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { Hostel } from "@prisma/client";
import cloudinary from "../utils/cloudinary";
import {
  HostelRequestDto,
  UpdateHostelRequestDto,
} from "../zodSchema/hostelSchema";
import { formatPrismaError } from "../utils/formatPrisma";

// Add a Hostel
export const addHostelController = async (req: Request, res: Response) => {
  const photo = req.file ? req.file.path : undefined;
  const hostelData: Hostel = req.body satisfies HostelRequestDto;
  const picture = {
    imageUrl: "",
    imageKey: "",
  };

  if (photo) {
    const uploaded = await cloudinary.uploader.upload(photo, {
      folder: "hostel/",
    });
    if (uploaded) {
      picture.imageUrl = uploaded.secure_url;
      picture.imageKey = uploaded.public_id;
    }
  }
  try {
    const newHostel = await hostelHelper.addHostel(hostelData, picture);

    res.status(HttpStatus.CREATED).json({
      message: "Hostel created successfully",
      data: newHostel,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Get All Hostels
export const getAllHostelsController = async (req: Request, res: Response) => {
  try {
    const hostels = await hostelHelper.getAllHostels();

    res.status(HttpStatus.OK).json({
      message: "Hostels fetched successfully",
      data: hostels,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Get Hostel by ID
export const getHostelByIdController = async (req: Request, res: Response) => {
  const { hostelId } = req.params;

  try {
    const hostel = await hostelHelper.getHostelById(hostelId);

    res.status(HttpStatus.OK).json({
      message: "Hostel fetched successfully",
      data: hostel,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Update a Hostel
export const updateHostelController = async (req: Request, res: Response) => {
  const { hostelId } = req.params;
  const hostelData: Hostel = req.body satisfies UpdateHostelRequestDto; // Again, assuming you're handling file uploads
  const photo = req.file ? req.file.path : undefined;
  const picture = {
    imageUrl: "",
    imageKey: "",
  };
  console.log(hostelData);
  try {
    if (photo) {
      const uploaded = await cloudinary.uploader.upload(photo, {
        folder: "hostel/",
      });
      if (uploaded) {
        picture.imageUrl = uploaded.secure_url;
        picture.imageKey = uploaded.public_id;
      }
    }

    const updatedHostel = await hostelHelper.updateHostel(
      hostelId,
      hostelData,
      picture
    );

    res.status(HttpStatus.OK).json({
      message: "Hostel updated successfully",
      data: updatedHostel,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Delete Hostel
export const deleteHostelController = async (req: Request, res: Response) => {
  const { hostelId } = req.params;

  try {
    await hostelHelper.deleteHostel(hostelId);

    res.status(HttpStatus.OK).json({
      message: "Hostel deleted successfully",
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const unverifiedHostel = async (req: Request, res: Response) => {
  try {
    const hostels = await hostelHelper.getUnverifiedHostel();
    res.status(HttpStatus.OK).json({
      message: "Hostels fetched successfully",
      data: hostels,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const publishHostel=async(req: Request, res: Response)=>{
try {
  const { hostelId } = req.params;
  await hostelHelper.publishHostel(hostelId);

  res.status(HttpStatus.OK).json({
    message: "Hostel published successfully",
  });
  
}  catch (error) {
  const err = formatPrismaError(error); // Ensure this function is used
  res.status(err.status).json({ message: err.message });
}
};