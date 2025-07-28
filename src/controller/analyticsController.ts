import { Request, Response } from "express";
import * as analyticsHelper from "../helper/analyticsHelper";
import { HttpStatus } from "../utils/http-status";
import { formatPrismaError } from "../utils/formatPrisma";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "decimal.js";





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

export const getHostelDisbursementSummaryController = async (
  req: Request,
  res: Response,
) => {
  try {
    const summary = await analyticsHelper.getHostelDisbursementSummary();
    res.status(HttpStatus.OK).json({
      message: "Hostel disbursement summary generated successfully",
      data: summary,
    });
  } catch (error) {
    const err = formatPrismaError(error);
    res.status(err.status).json({ message: err.message });
  }
};

// Generate Calendar Year Report
export const generateCalendarYearReportController = async (
  req: Request,
  res: Response,
) => {
  const { hostelId, calendarYearId } = req.params;

  try {
    const report = await analyticsHelper.generateCalendarYearReport(
      hostelId,
      calendarYearId,
    );

    res.status(HttpStatus.OK).json({
      message: "Calendar year report generated successfully",
      data: report,
    });
  } catch (error) {
    const err = formatPrismaError(error);
    res.status(err.status).json({ message: err.message });
  }
};
