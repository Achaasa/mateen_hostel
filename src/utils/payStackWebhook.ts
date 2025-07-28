import { RequestHandler } from "express";
import { confirmPayment } from "../helper/paymentHelper";
import paystack from "./paystack";
import prisma from "./prisma";

export const handlePaystackWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["x-paystack-signature"] as string;
  const rawBody = (req as any).rawBody;

  // Verify signature first
  if (!paystack.verifyWebhookSignature(rawBody, signature)) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const body = JSON.parse(rawBody);

    if (body.event === "charge.success") {
      const reference = body.data.reference;

      const payment = await prisma.payment.findUnique({
        where: { reference },
        include: { resident: true },
      });

      if (!payment) {
        res.status(404).send("Payment not found");
        return;
      }

      // All payments are now full payments - no more top-ups
      await confirmPayment(reference);

      res.sendStatus(200);
      return;
    }

    // Handle other events
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).send("Payment confirmation failed");
  }
};
