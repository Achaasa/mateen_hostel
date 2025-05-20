import { Router } from "express";
import { authenticateJWT, authorizeRole } from "../utils/jsonwebtoken";
import { validateHostelAccess } from "../utils/AccessControl";

import {
  initiatePayment,
  handlePaymentConfirmation,
  initializeTopUpPaymentControler,
  TopUpPaymentController,
  getAllPaymentController,
  getPaymentByIdController,
  getPaymentByReferenceController,
  getPaymentsForHostelController,
} from "../controller/paymentController";
import { handlePaystackWebhook } from "../utils/payStackWebhook";

const paymentRouter = Router();
paymentRouter.post("/webhook", handlePaystackWebhook);

paymentRouter.post("/init/", initiatePayment);
paymentRouter.get("/confirm", handlePaymentConfirmation);

paymentRouter.post("/topup", initializeTopUpPaymentControler);
paymentRouter.post("/topup/confirm", TopUpPaymentController);
paymentRouter.get(
  "/get",
  authenticateJWT,
  authorizeRole(["SUPER_ADMIN"]),
  getAllPaymentController,
);

paymentRouter.get(
  "/get/:paymentId",
  authenticateJWT,
  authorizeRole(["ADMIN", "SUPER_ADMIN"]),
  validateHostelAccess,
  getPaymentByIdController,
);
paymentRouter.get(
  "/get/ref/:reference",
  authenticateJWT,
  authorizeRole(["ADMIN", "SUPER_ADMIN"]),
  validateHostelAccess,
  getPaymentByReferenceController,
);
paymentRouter.get(
  "/get/hostel/:hostelId",
  authenticateJWT,
  authorizeRole(["ADMIN", "SUPER_ADMIN"]),
  validateHostelAccess,
  getPaymentsForHostelController,
);
export default paymentRouter;
