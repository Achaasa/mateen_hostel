import { Router } from "express";
import { clearDatabase } from "../controller/adminPanel";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
const adminRouter = Router();
adminRouter.use(authenticateJWT);
adminRouter.use(authorizeRole(["SUPER_ADMIN"]));
adminRouter.post(
  "/clear-database",

  clearDatabase,
);

export default adminRouter;
