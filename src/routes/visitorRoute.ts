import { Router } from "express";
import * as visitorController from "../controller/visitorController"; // Assuming your controller file is named visitorController

const visitorRouter = Router();

// Add a new visitor
visitorRouter.post("/", visitorController.addVisitorController);

// Get all visitors
visitorRouter.get("/", visitorController.getAllVisitorsController);

// Get a visitor by ID
visitorRouter.get("/:id", visitorController.getVisitorByIdController);

// Update a visitor's details
visitorRouter.put("/:id", visitorController.updateVisitorController);

// Delete a visitor
visitorRouter.delete("/:id", visitorController.deleteVisitorController);

// Checkout a visitor
visitorRouter.post(
  "/:id/checkout",
  visitorController.checkoutVisitorController
);

export default visitorRouter;
