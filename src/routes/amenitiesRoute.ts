import { Router } from "express";
import * as amenitiesController from "../controller/amenitiesController"; 
import { validatePayload } from "../middleware/validate-payload"; // Optional: for payload validation

const amenitiesRoute = Router();

// Add an amenity (POST request)
amenitiesRoute.post(
  "/add",
  validatePayload("Amenities"), // Optional: Assuming you have a validation schema for adding amenities
  amenitiesController.addAmenityController
);

// Get all amenities (GET request)
amenitiesRoute.get("/", amenitiesController.getAllAmenitiesController);

// Get a specific amenity by ID (GET request)
amenitiesRoute.get("/:id", amenitiesController.getAmenityByIdController);

// Update an amenity by ID (PUT request)
amenitiesRoute.put(
  "/update/:id",
  validatePayload("Amenities"), // Optional: Assuming you have a validation schema for updating amenities
  amenitiesController.updateAmenityController
);

// Delete an amenity by ID (DELETE request)
amenitiesRoute.delete("/:id", amenitiesController.deleteAmenityController);

export default amenitiesRoute;
