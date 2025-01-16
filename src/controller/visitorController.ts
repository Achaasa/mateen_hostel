import { Request, Response } from "express";
import * as visitorHelper from "../helper/visitorHelper"; // Assuming your helper functions are in this file
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { Visitor } from "@prisma/client";
import { VisitorRequestDto } from "../zodSchema/visitorSchema";

// Add a Visitor
export const addVisitorController = async (req: Request, res: Response) => {
  const visitorData:Visitor = req.body satisfies VisitorRequestDto// Get visitor data from the request body
  try {
    const createdVisitor = await visitorHelper.addVisitor(visitorData);
    res.status(HttpStatus.CREATED).json({
      message: "Visitor added successfully",
      data: createdVisitor,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error adding visitor",
    });
  }
};

// Get All Visitors
export const getAllVisitorsController = async (req: Request, res: Response) => {
  try {
    const visitors = await visitorHelper.getAllVisitors();
    res.status(HttpStatus.OK).json({
      message: "Visitors fetched successfully",
      data: visitors,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fetching visitors",
    });
  }
};

// Get Visitor by ID
export const getVisitorByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const visitor = await visitorHelper.getVisitorById(id);
    res.status(HttpStatus.OK).json({
      message: "Visitor fetched successfully",
      data: visitor,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error fetching visitor",
    });
  }
};

// Update a Visitor
export const updateVisitorController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const visitorData = req.body; // Get visitor data from the request body
  try {
    const updatedVisitor = await visitorHelper.updateVisitor(id, visitorData);
    res.status(HttpStatus.OK).json({
      message: "Visitor updated successfully",
      data: updatedVisitor,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error updating visitor",
    });
  }
};

// Delete a Visitor
export const deleteVisitorController = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await visitorHelper.deleteVisitor(id);
    res.status(HttpStatus.OK).json({
      message: result.message,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error deleting visitor",
    });
  }
};

// Checkout a Visitor
export const checkoutVisitorController = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const checkedOutVisitor = await visitorHelper.checkoutVisitor(id);
    res.status(HttpStatus.OK).json({
      message: "Visitor checked out successfully",
      data: checkedOutVisitor,
    });
  } catch (error) {
    const err = error as HttpException;
    res.status(err.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: err.message || "Error checking out visitor",
    });
  }
};
