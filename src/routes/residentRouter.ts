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
  addResidentFromHostelController,
  assignRoomToResidentController,
  verifyResidentCodeController,
} from "../controller/residentController"; // Assuming your controller file is named residentController
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { validatePayload } from "../middleware/validate-payload";
import { validateHostelAccess } from "../utils/AccessControl";

const residentRouter = Router();

// Define your specific routes first
residentRouter.get(
  "/debtors",
  authenticateJWT,
  authorizeRole(["super_admin"]),
  getAlldebtors,
);

residentRouter.post("/register", registerResidentController);
residentRouter.post(
  "/add",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validatePayload("Resident"),
  validateHostelAccess,
  addResidentFromHostelController,
);
residentRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["super_admin"]),
  validateHostelAccess,
  getAllResidentsController,
);

residentRouter.get(
  "/get/:residentId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  getResidentByIdController,
);

residentRouter.get(
  "/email/:email",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validateHostelAccess,
  getResidentByEmailController,
);

residentRouter.put(
  "/update/:residentId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validateHostelAccess,
  updateResidentController,
);

residentRouter.delete(
  "/delete/:residentId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validateHostelAccess,
  deleteResidentController,
);

residentRouter.get(
  "/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validateHostelAccess,
  getAllresidentsForHostel,
);

residentRouter.get(
  "/debtors/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  validateHostelAccess,
  getDebtorsForHostel,
);

residentRouter.put(
  "/assign/:residentId",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  assignRoomToResidentController,
);

residentRouter.get(
  "/verify",
  authenticateJWT,
  authorizeRole(["super_admin", "admin"]),
  verifyResidentCodeController,
);
export default residentRouter;
