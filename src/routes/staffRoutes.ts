import { Router } from "express";
import * as StaffController from "../controller/staffController"; // Adjust the path as necessary
import { validatePayload } from "../middleware/validate-payload"; // Assuming you have validation middleware
import upload from "../utils/multer";

const StaffRouter = Router();

// Add a new Staff (POST request)
StaffRouter.post(
  "/add",
  validatePayload("Staff"),upload.single('photo'), // Optional: Assuming you have a validation schema for Staff data
  StaffController.addStaffController
);

// Get all Staffs (GET request)
StaffRouter.get("/get", StaffController.getAllStaffsController);

// Get a specific Staff by ID (GET request)
StaffRouter.get("/get/:id", StaffController.getStaffByIdController);

// Update a Staff by ID (PUT request)
StaffRouter.put(
  "/update/:id",
  validatePayload("Staff"),upload.single('photo'), // Optional: Assuming you have a validation schema for updating a Staff
  StaffController.updateStaffController
);

// Delete a Staff by ID (DELETE request)
StaffRouter.delete("/delete/:id", StaffController.deleteStaffController);

export default StaffRouter;
