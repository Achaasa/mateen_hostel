import { Router } from "express";
import * as residentController from "../controller/residentController"; // Assuming your controller file is named residentController

const residentRouter = Router();

// Register a new resident
residentRouter.post("/register", residentController.registerResidentController);

// Get all residents
residentRouter.get("/", residentController.getAllResidentsController);

// Get a resident by ID
residentRouter.get("/:id", residentController.getResidentByIdController);

// Get a resident by email
residentRouter.get("/:email", residentController.getResidentByEmailController);

// Update a resident's details
residentRouter.put("/:id", residentController.updateResidentController);

// Delete a resident
residentRouter.delete("/:id", residentController.deleteResidentController);
residentRouter.get("/debtors", residentController.debtors);

export default residentRouter;
