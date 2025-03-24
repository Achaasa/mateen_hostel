import { RequestHandler } from "express";
import { confirmPayment } from "../helper/paymentHelper";
import paystack from "./paystack";

export const handlePaystackWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["x-paystack-signature"] as string;
  const rawBody = (req as any).rawBody;

  if (!paystack.verifyWebhookSignature(rawBody, signature)) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const body = JSON.parse(rawBody);

    if (body.event === "charge.success") {
      await confirmPayment(body.data.reference);
      res.sendStatus(200);
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send("Confirmation failed");
  }
};