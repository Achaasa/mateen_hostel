import { Router } from "express";
import * as analyticsController from "../controller/analyticsController";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { validateHostelAccess } from "../utils/AccessControl";

const analyticsRouter = Router();

// Get hostel-specific analytics
analyticsRouter.get(
  "/get/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validateHostelAccess,
  analyticsController.getHostelAnalytics,
);

// Get system-wide analytics (super_admin only)
analyticsRouter.get(
  "/get/system",
  authenticateJWT,
  authorizeRole(["super_admin"]),
  analyticsController.getSystemAnalytics,
);

// Get disbursement summary (super_admin only)
analyticsRouter.get(
  "/get/disbursement-summary",
  authenticateJWT,
  authorizeRole(["super_admin"]),
  analyticsController.getHostelDisbursementSummaryController,
);

// Calendar Year Report
analyticsRouter.get(
  "/calendar-year/:hostelId/:calendarYearId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validateHostelAccess,
  analyticsController.generateCalendarYearReportController,
);

export default analyticsRouter;
