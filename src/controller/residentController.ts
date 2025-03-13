import { NextFunction, Request, Response } from "express";
import * as residentHelper from "../helper/residentHelper"; // Assuming your helper functions are in this file
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { Resident } from "@prisma/client";
import {
  ResidentRequestDto,
  UpdateResidentRequestDto,
} from "../zodSchema/residentSchema";
import prisma from "../utils/prisma";
import { formatPrismaError } from "../utils/formatPrisma";

// Register a Resident
export const registerResidentController = async (
  req: Request,
  res: Response
) => {
  const residentData: Resident = req.body satisfies ResidentRequestDto; // Get resident data from the request body

  try {
    const newResident = await residentHelper.register(residentData);
    res.status(HttpStatus.CREATED).json({
      message: "Resident registered successfully",
      data: newResident,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Get All Residents
export const getAllResidentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const residents = await residentHelper.getAllResident();
    res.status(HttpStatus.OK).json({
      message: "Residents fetched successfully",
      data: residents,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Get Resident by ID
export const getResidentByIdController = async (
  req: Request,
  res: Response
) => {
  const { residentId } = req.params;

  try {
    const resident = await residentHelper.getResidentById(residentId);
    res.status(HttpStatus.OK).json({
      message: "Resident fetched successfully ID",
      data: resident,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Get Resident by Email
export const getResidentByEmailController = async (
  req: Request,
  res: Response
) => {
  const { email } = req.params;

  try {
    const resident = await residentHelper.getResidentByEmail(email);
    res.status(HttpStatus.OK).json({
      message: "Resident fetched successfully email",
      data: resident,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Update a Resident
export const updateResidentController = async (req: Request, res: Response) => {
  const { residentId } = req.params;
  const residentData: Resident = req.body satisfies UpdateResidentRequestDto;

  try {
    const updatedResident = await residentHelper.updateResident(
      residentId,
      residentData
    );
    res.status(HttpStatus.OK).json({
      message: "Resident updated successfully",
      data: updatedResident,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

// Delete a Resident
export const deleteResidentController = async (req: Request, res: Response) => {
  const { residentId } = req.params;

  try {
    await residentHelper.deleteResident(residentId);
    res.status(HttpStatus.OK).json({
      message: "Resident deleted successfully",
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const getAlldebtors = async (req: Request, res: Response) => {
  try {
    const debtors = await residentHelper.getDebtors();
    if (debtors.length === 0) {
      console.log("No debtors found with balance owed greater than 0");
    }

    res
      .status(HttpStatus.OK)
      .json({ message: "debtors fetched successfully", data: debtors });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const getDebtorsForHostel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hostelId } = req.params;
  try {
    const debtors = await residentHelper.getDebtorsForHostel(hostelId);
    res
      .status(HttpStatus.OK)
      .json({ message: "debors fected successfully", data: debtors });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};

export const getAllresidentsForHostel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hostelId } = req.params;
  try {
    const residents = await residentHelper.getAllresidentsForHostel(hostelId);
    res
      .status(HttpStatus.OK)
      .json({ message: "residents fecthed successfully", data: residents });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};
export const addResidentFromHostelController = async (
  req: Request,
  res: Response
) => {
  const residentData: Resident = req.body satisfies ResidentRequestDto; // Get resident data from the request body

  try {
    const newResident = await residentHelper.addResidentFromHostel(residentData);
    res.status(HttpStatus.CREATED).json({
      message: "Resident registered successfully",
      data: newResident,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
};


export const assignRoomToResidentController = async (
  req: Request,res: Response
) => {
  const { residentId } = req.params;
  const { roomId } = req.body;

  try {
    const updatedResident = await residentHelper.assignRoomToResident(
      residentId,
      roomId
    );
    res.status(HttpStatus.OK).json({
      message: "Room assigned to resident successfully",
      data: updatedResident,
    });
  }  catch (error) {
    const err = formatPrismaError(error); // Ensure this function is used
    res.status(err.status).json({ message: err.message });
  }
}