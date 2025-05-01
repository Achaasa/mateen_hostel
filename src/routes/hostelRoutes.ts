import { Router } from "express";
import * as hostelController from "../controller/hostelController"; // Adjust the path as necessary
import { validatePayload } from "../middleware/validate-payload"; // Assuming you have validation middleware
import upload from "../utils/multer";
import { verifyAndCreateHostelUser } from "../controller/userController";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { validateHostelAccess } from "../utils/AccessControl";

const hostelRoute = Router();

// Add a new hostel (POST request)
hostelRoute.post(
  "/add",
  validatePayload("Hostel"),
  upload.array("photo"), // Optional: Assuming you have a validation schema for hostel data
  hostelController.addHostelController,
);

// Get all hostels (GET request)
hostelRoute.get(
  "/get",
  
  

  hostelController.getAllHostelsController,
);
// get unverified hostels
hostelRoute.get(
  "/unverified",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  hostelController.unverifiedHostel,
);

// Get a specific hostel by ID (GET request)
hostelRoute.get(
  "/get/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  hostelController.getHostelByIdController,
);

// Update a hostel by ID (PUT request)
hostelRoute.put(
  "/update/:hostelId",
  validatePayload("Hostel"),
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  upload.array("photos"), // Changed from single to array
  hostelController.updateHostelController,
);
// publish hostel
hostelRoute.put(
  "/publish/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  hostelController.publishHostel,
);

// unpublish hostel
hostelRoute.put(
  "/unpublish/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  hostelController.unPublishHostel,
);
// Delete a hostel by ID (DELETE request)
hostelRoute.delete(
  "/delete/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  hostelController.deleteHostelController,
);
hostelRoute.post(
  "/verify/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),

  verifyAndCreateHostelUser,
);

export default hostelRoute;
