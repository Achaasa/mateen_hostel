import { Router } from "express";


import {
  initiatePayment,
  handlePaymentConfirmation,
} from "../controller/paymentController";

const paymentRouter = Router();

paymentRouter.post("/init/", initiatePayment);
paymentRouter.get("/confirm", handlePaymentConfirmation);

export default paymentRouter;
