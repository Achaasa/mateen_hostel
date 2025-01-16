import { Router } from "express";
import * as hostelController from "../controller/hostelController"; // Adjust the path as necessary
import { validatePayload } from "../middleware/validate-payload"; // Assuming you have validation middleware
import upload from "../utils/multer";

const hostelRoute = Router();

// Add a new hostel (POST request)
hostelRoute.post(
  "/add",
  validatePayload("hostel"),upload.single('photo'), // Optional: Assuming you have a validation schema for hostel data
  hostelController.addHostelController
);

// Get all hostels (GET request)
hostelRoute.get("/", hostelController.getAllHostelsController);

// Get a specific hostel by ID (GET request)
hostelRoute.get("/:id", hostelController.getHostelByIdController);

// Update a hostel by ID (PUT request)
hostelRoute.put(
  "/update/:id",
  validatePayload("Hostel"),upload.single('photo'), // Optional: Assuming you have a validation schema for updating a hostel
  hostelController.updateHostelController
);

// Delete a hostel by ID (DELETE request)
hostelRoute.delete("/:id", hostelController.deleteHostelController);

export default hostelRoute;
