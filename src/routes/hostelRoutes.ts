import { Router } from "express";
import * as hostelController from "../controller/hostelController"; // Adjust the path as necessary
import { validatePayload } from "../middleware/validate-payload"; // Assuming you have validation middleware
import upload from "../utils/multer";
import { verifyAndCreateHostelUser } from "../controller/userController";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";

const hostelRoute = Router();

// Add a new hostel (POST request)
hostelRoute.post(
  "/add",
  validatePayload("hostel"),
  upload.single("photo"), // Optional: Assuming you have a validation schema for hostel data
  hostelController.addHostelController
);

// Get all hostels (GET request)
hostelRoute.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  hostelController.getAllHostelsController
);
// get unverified hostels
hostelRoute.get(
  "/unverified",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  hostelController.unverifiedHostel
);

// Get a specific hostel by ID (GET request)
hostelRoute.get("/get/:id", hostelController.getHostelByIdController);

// Update a hostel by ID (PUT request)
hostelRoute.put(
  "/update/:id",
  validatePayload("Hostel"),
  authenticateJWT,
  authorizeRole(["ADMIN"]),
  upload.single("photo"), // Optional: Assuming you have a validation schema for updating a hostel
  hostelController.updateHostelController
);

// Delete a hostel by ID (DELETE request)
hostelRoute.delete(
  "/delete/:id",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  hostelController.deleteHostelController
);
hostelRoute.post(
  "/verify/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),

  verifyAndCreateHostelUser
);

export default hostelRoute;
