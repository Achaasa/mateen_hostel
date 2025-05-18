import { Request, Response } from "express";
import * as analyticsHelper from "../helper/analyticsHelper";
import { HttpStatus } from "../utils/http-status";
import { formatPrismaError } from "../utils/formatPrisma";

export const getHostelAnalytics = async (req: Request, res: Response) => {
  try {
    const { hostelId } = req.params;
    const analytics = await analyticsHelper.generateHostelAnalytics(hostelId);

    res.status(HttpStatus.OK).json({
      message: "Hostel analytics generated successfully",
      data: analytics,
    });
  } catch (error) {
    const err = formatPrismaError(error);
    res.status(err.status).json({ message: err.message });
  }
};

export const getSystemAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await analyticsHelper.generateSystemAnalytics();

    res.status(HttpStatus.OK).json({
      message: "System analytics generated successfully",
      data: analytics,
    });
  } catch (error) {
    const err = formatPrismaError(error);
    res.status(err.status).json({ message: err.message });
  }
};
