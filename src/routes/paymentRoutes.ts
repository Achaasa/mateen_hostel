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
paymentRouter.get("/get", getAllPaymentController);
paymentRouter.post("/topup", initializeTopUpPaymentControler);
paymentRouter.post("/topup/confirm", TopUpPaymentController);
paymentRouter.use(authenticateJWT);
paymentRouter.use(authorizeRole(["ADMIN"]));
paymentRouter.use(validateHostelAccess);
paymentRouter.get("/get/:paymentId", getPaymentByIdController);
paymentRouter.get("/get/ref/:reference", getPaymentByReferenceController);
paymentRouter.get("/hostel/:hostelId", getPaymentsForHostelController);
export default paymentRouter;
