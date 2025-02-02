import { Router } from "express";
import * as amenitiesController from "../controller/amenitiesController";
import { validatePayload } from "../middleware/validate-payload"; // Optional: for payload validation
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";

const amenitiesRoute = Router();

// Add an amenity (POST request)
amenitiesRoute.post(
  "/add",
  validatePayload("Amenities"), // Optional: Assuming you have a validation schema for adding amenities
  authenticateJWT,
  amenitiesController.addAmenityController
);

// Get all amenities (GET request)
amenitiesRoute.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  amenitiesController.getAllAmenitiesController
);

// Get a specific amenity by ID (GET request)
amenitiesRoute.get(
  "/get/:amenityId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  amenitiesController.getAmenityByIdController
);

// Update an amenity by ID (PUT request)
amenitiesRoute.put(
  "/update/:amenityId",
  validatePayload("Amenities"), // Optional: Assuming you have a validation schema for updating amenities
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  amenitiesController.updateAmenityController
);

// Delete an amenity by ID (DELETE request)
amenitiesRoute.delete(
  "/delete/:amenityId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN","ADMIN"]),
  amenitiesController.deleteAmenityController
);

amenitiesRoute.get(
  "/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN","ADMIN"]),
  amenitiesController.getAmenitiesForHostel
);

export default amenitiesRoute;
