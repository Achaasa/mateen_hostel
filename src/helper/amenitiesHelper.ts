import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Amenities } from "@prisma/client";
import { ErrorResponse } from "../utils/types";
import {
  amenitiesSchema,
  updateAmenitiesSchema,
} from "../zodSchema/amenitiesSchema"; // Assuming you have Zod schemas for validation

// Add an Amenity
export const addAmenity = async (amenityData: {
  name: string;
  price: number;
}): Promise<Amenities> => {
  try {
    // Validate the amenity data using the schema
    const validateAmenity = amenitiesSchema.safeParse(amenityData);
    if (!validateAmenity.success) {
      const errors = validateAmenity.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    // Check if amenity already exists (if needed)
    const existingAmenity = await prisma.amenities.findFirst({
      where: { name: amenityData.name },
    });
    if (existingAmenity) {
      throw new HttpException(HttpStatus.CONFLICT, "Amenity already exists");
    }

    // Create a new amenity
    const createdAmenity = await prisma.amenities.create({
      data: amenityData,
    });

    return createdAmenity;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error adding amenity"
    );
  }
};

// Get All Amenities
export const getAllAmenities = async () => {
  try {
    const amenities = await prisma.amenities.findMany();
    return amenities;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error fetching amenities"
    );
  }
};

// Get Amenity by ID
export const getAmenityById = async (amenityId: string): Promise<Amenities> => {
  try {
    const amenity = await prisma.amenities.findUnique({
      where: { id: amenityId },
    });

    if (!amenity) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Amenity not found");
    }

    return amenity;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error fetching amenity"
    );
  }
};

// Update an Amenity
export const updateAmenity = async (
  amenityId: string,
  amenityData: { name: string; price: number }
): Promise<Amenities> => {
  try {
    // Validate the amenity data using the schema
    const validateAmenity = updateAmenitiesSchema.safeParse(amenityData);
    if (!validateAmenity.success) {
      const errors = validateAmenity.error.issues.map(
        ({ message, path }) => `${path}: ${message}`
      );
      throw new HttpException(HttpStatus.BAD_REQUEST, errors.join(". "));
    }

    // Check if the amenity exists in the database
    const findAmenity = await prisma.amenities.findUnique({
      where: { id: amenityId },
    });
    if (!findAmenity) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Amenity not found");
    }

    // Update the amenity
    const updatedAmenity = await prisma.amenities.update({
      where: { id: amenityId },
      data: amenityData,
    });

    return updatedAmenity;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error updating amenity"
    );
  }
};

// Delete Amenity
export const deleteAmenity = async (
  amenityId: string
): Promise<{ message: string }> => {
  try {
    const amenity = await prisma.amenities.findUnique({
      where: { id: amenityId },
    });

    if (!amenity) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Amenity not found");
    }

    // Delete the amenity
    await prisma.amenities.delete({
      where: { id: amenityId },
    });

    return { message: "Amenity deleted successfully" };
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error deleting amenity"
    );
  }
};
