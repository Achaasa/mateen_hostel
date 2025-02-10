import { Router } from "express";
import * as StaffController from "../controller/staffController"; // Adjust the path as necessary
import { validatePayload } from "../middleware/validate-payload"; // Assuming you have validation middleware
import upload from "../utils/multer";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { validateHostelAccess } from "../utils/AccessControl";

const StaffRouter = Router();

// Add a new Staff (POST request)
StaffRouter.post(
  "/add",
  validatePayload("Staff"),
  upload.single("photo"), // Optional: Assuming you have a validation schema for Staff data
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),

  StaffController.addStaffController
);

// Get all Staffs (GET request)
StaffRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  validateHostelAccess,

  StaffController.getAllStaffsController
);

// Get a specific Staff by ID (GET request)
StaffRouter.get(
  "/get/:staffId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  StaffController.getStaffByIdController
);

// Update a Staff by ID (PUT request)
StaffRouter.put(
  "/update/:staffId",
  validatePayload("Staff"),
  upload.single("photo"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
   // Optional: Assuming you have a validation schema for updating a Staff
  StaffController.updateStaffController
);

// Delete a Staff by ID (DELETE request)
StaffRouter.delete(
  "/delete/:staffId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  StaffController.deleteStaffController
);

StaffRouter.get(
  "/get/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,

  StaffController.staffForHostel
);

export default StaffRouter;
