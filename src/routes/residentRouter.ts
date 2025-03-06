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
import { validatePayload } from "../middleware/validate-payload";
import { validateHostelAccess } from "../utils/AccessControl";

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
  validatePayload("Resident"),
  validateHostelAccess,
  registerResidentController
);
residentRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  validateHostelAccess,
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
  validateHostelAccess,
  getResidentByEmailController
);

residentRouter.put(
  "/update/:residentId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  updateResidentController
);

residentRouter.delete(
  "/delete/:residentId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  deleteResidentController
);

residentRouter.get(
  "/residents/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  getAllresidentsForHostel
);

residentRouter.get(
  "/debtors/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]),
  validateHostelAccess,
  getDebtorsForHostel
)

residentRouter.put("/assign/:residentId",authenticateJWT,
  authorizeRole(["SUPER_ADMIN", "ADMIN"]), updateResidentController);
export default residentRouter;
