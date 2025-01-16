import { Router } from "express";


import {
  initiatePayment,
  handlePaymentConfirmation,
} from "../controller/paymentController";

const paymentRouter = Router();

paymentRouter.post("/register/payment", initiatePayment);
paymentRouter.get("/payment/confirm", handlePaymentConfirmation);

export default paymentRouter;
