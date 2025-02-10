import { Router } from "express";
import {
  getAllResidentsController,
  getAlldebtors,
  getResidentByEmailController,
  getResidentByIdController,
  updateResidentController,
  registerResidentController,
  deleteResidentController,
  getAllresidentsForHostel,
  getDebtorsForHostel,
} from "../controller/residentController"; // Assuming your controller file is named residentController
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";

const residentRouter = Router();

// Define your specific routes first
residentRouter.get(
  "/debtors",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  getAlldebtors
);

residentRouter.post("/register", registerResidentController);
residentRouter.post(
  "/add",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  registerResidentController
);
residentRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  getAllResidentsController
);

residentRouter.get(
  "/get/:residentId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  getResidentByIdController
);

residentRouter.get(
  "/email/:email",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  getResidentByEmailController
);

residentRouter.put(
  "/update/:residentId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  updateResidentController
);

residentRouter.delete(
  "/delete/:residentId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  deleteResidentController
);

residentRouter.get(
  "/residents/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  getAllresidentsForHostel
);

residentRouter.get(
  "/debtors/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"])
)

export default residentRouter;
