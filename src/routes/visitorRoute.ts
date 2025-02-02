import { Router } from "express";
import * as visitorController from "../controller/visitorController"; // Assuming your controller file is named visitorController
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";

const visitorRouter = Router();

// Add a new visitor
visitorRouter.post(
  "/add",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  visitorController.addVisitorController
);

// Get all visitors
visitorRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  visitorController.getAllVisitorsController
);

// Get a visitor by ID
visitorRouter.get(
  "/get/:visitorId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  visitorController.getVisitorByIdController
);

// Update a visitor's details
visitorRouter.put(
  "/update/:visitorId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  visitorController.updateVisitorController
);

// Delete a visitor
visitorRouter.delete(
  "/delete/:visitorId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  visitorController.deleteVisitorController
);

// Checkout a visitor
visitorRouter.put(
  "/checkout/:visitorId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  visitorController.checkoutVisitorController
);

export default visitorRouter;
