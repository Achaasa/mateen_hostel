import { Router } from "express";
import * as visitorController from "../controller/visitorController"; // Assuming your controller file is named visitorController

const visitorRouter = Router();

// Add a new visitor
visitorRouter.post("/add", visitorController.addVisitorController);

// Get all visitors
visitorRouter.get("/get", visitorController.getAllVisitorsController);

// Get a visitor by ID
visitorRouter.get("/get/:id", visitorController.getVisitorByIdController);

// Update a visitor's details
visitorRouter.put("/update/:id", visitorController.updateVisitorController);

// Delete a visitor
visitorRouter.delete("/delete/:id", visitorController.deleteVisitorController);

// Checkout a visitor
visitorRouter.put(
  "/checkout/:id",
  visitorController.checkoutVisitorController
);

export default visitorRouter;
