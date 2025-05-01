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
  const photos = req.files ? req.files : [];
  const hostelData: Hostel = req.body satisfies HostelRequestDto;
  const pictures = [];

  try {
    if (photos && Array.isArray(photos) && photos.length) {
      for (const photo of photos) {
        const uploaded = await cloudinary.uploader.upload(photo.path, {
          folder: "hostel/",
        });

        if (uploaded) {
          pictures.push({
            imageUrl: uploaded.secure_url,
            imageKey: uploaded.public_id,
          });
        }
      }
    }
    const newHostel = await hostelHelper.addHostel(hostelData, pictures);

    res.status(HttpStatus.CREATED).json({
      message: "Hostel created successfully",
      data: newHostel,
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Update a Hostel
export const updateHostelController = async (req: Request, res: Response) => {
  const { hostelId } = req.params;
  const hostelData: Partial<Hostel> = req.body;
  const photos = req.files as Express.Multer.File[] | undefined;
  const pictures = [];

  try {
    if (photos && photos.length > 0) {
      // Loop over the photos and upload each one to Cloudinary
      for (const photo of photos) {
        const uploaded = await cloudinary.uploader.upload(photo.path, {
          folder: "hostels/",
        });

        if (uploaded) {
          pictures.push({
            imageUrl: uploaded.secure_url,
            imageKey: uploaded.public_id,
          });
        }
      }
    }

    const updatedHostel = await hostelHelper.updateHostel(
      hostelId,
      hostelData,
      pictures,
    );

    res.status(HttpStatus.OK).json({
      message: "Hostel updated successfully",
      data: updatedHostel,
    });
  } catch (error) {
    const err = formatPrismaError(error);
    res.status(err.status).json({ message: err.message });
  }
};

// Delete Hostel
export const deleteHostelController = async (req: Request, res: Response) => {
  const { hostelId } = req.params;

  try {
    const result = await hostelHelper.deleteHostel(hostelId);

    res.status(HttpStatus.OK).json({
      message: result.message,
    });
  } catch (error) {
    const err = formatPrismaError(error);
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
  } catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const publishHostel = async (req: Request, res: Response) => {
  try {
    const { hostelId } = req.params;
    await hostelHelper.publishHostel(hostelId);

    res.status(HttpStatus.OK).json({
      message: "Hostel published successfully",
    });
  } catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const unPublishHostel = async (req: Request, res: Response) => {
  try {
    const { hostelId } = req.params;
    await hostelHelper.unPublishHostel(hostelId);

    res.status(HttpStatus.OK).json({
      message: "Hostel unpublished successfully",
    });
  } catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};
