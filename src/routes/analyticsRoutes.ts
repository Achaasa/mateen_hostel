import { Router } from "express";
import * as analyticsController from "../controller/analyticsController";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { validateHostelAccess } from "../utils/AccessControl";

const analyticsRouter = Router();

// Get hostel-specific analytics
analyticsRouter.get(
  "/get/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  analyticsController.getHostelAnalytics,
);

// Get system-wide analytics (SUPER_ADMIN only)
analyticsRouter.get(
  "/get/system",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  analyticsController.getSystemAnalytics,
);

// Get disbursement summary (SUPER_ADMIN only)
analyticsRouter.get(
  "/get/disbursement-summary",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  analyticsController.getHostelDisbursementSummaryController,
);

export default analyticsRouter;
