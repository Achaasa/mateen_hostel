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
paymentRouter.use(authenticateJWT);
paymentRouter.get(
  "/get",
  authorizeRole(["SUPER_ADMIN"]),
  getAllPaymentController,
);
paymentRouter.use(authorizeRole(["ADMIN", "SUPER_ADMIN"]));
paymentRouter.use(validateHostelAccess);
paymentRouter.get("/get/:paymentId", getPaymentByIdController);
paymentRouter.get("/get/ref/:reference", getPaymentByReferenceController);
paymentRouter.get("/get/hostel/:hostelId", getPaymentsForHostelController);
export default paymentRouter;
