import { NextFunction, Request, Response } from "express";
import * as amenitiesHelper from "../helper/amenitiesHelper"; // Assuming your service functions are in this file
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { Amenities } from "@prisma/client";
import { amenitiesDto } from "../zodSchema/amenitiesSchema";

// Add an Amenity
export const addAmenityController = async (req: Request, res: Response) => {
  try {
    const amenitiesData: Amenities = req.body satisfies amenitiesDto;

    // Call the service to add the amenity
    const newAmenity = await amenitiesHelper.addAmenity(amenitiesData);

    // Send response back to the client
    res.status(HttpStatus.CREATED).json({
      message: "Amenity created successfully",
      data: newAmenity,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error adding amenity",
    });
  }
};

// Get All Amenities
export const getAllAmenitiesController = async (
  req: Request,
  res: Response
) => {
  try {
    const amenities = await amenitiesHelper.getAllAmenities();

    res.status(HttpStatus.OK).json({
      message: "Amenities fetched successfully",
      data: amenities,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fetching amenities",
    });
  }
};

// Get Amenity by ID
export const getAmenityByIdController = async (req: Request, res: Response) => {
  const { amenityId } = req.params;

  try {
    const amenity = await amenitiesHelper.getAmenityById(amenityId);

    res.status(HttpStatus.OK).json({
      message: "Amenity fetched successfully",
      data: amenity,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fetching amenity",
    });
  }
};

// Update an Amenity
export const updateAmenityController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const amenitiesData: Amenities = req.body satisfies amenitiesDto;

  try {
    const updatedAmenity = await amenitiesHelper.updateAmenity(
      id,
      amenitiesData
    );

    res.status(HttpStatus.OK).json({
      message: "Amenity updated successfully",
      data: updatedAmenity,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error updating amenity",
    });
  }
};

// Delete Amenity
export const deleteAmenityController = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await amenitiesHelper.deleteAmenity(id);

    res.status(HttpStatus.OK).json({
      message: result.message,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error deleting amenity",
    });
  }
};

export const getAmenitiesForHostel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hostelId } = req.params;
  try {
    const amenities = await amenitiesHelper.getAllAmenitiesForHostel(hostelId);
    res
      .status(HttpStatus.OK)
      .json({ message: "amenities fetched successfully", data: amenities });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fecthing amenity",
    });
  }
};
