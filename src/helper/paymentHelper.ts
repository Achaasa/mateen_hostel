// src/helpers/residentHelpers.ts

import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Resident } from "@prisma/client";
import { ErrorResponse } from "../utils/types";
import paystack from "../utils/paystack";

export const initializePayment = async (
  roomId: string,
  residentId: string,
  initialPayment: number
) => {
  try {
    // Check if the resident and room exist
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
    });
    console.log({
      room: `${roomId}, resident: ${residentId} payment:${initialPayment}`,
    });

    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
    }

    if (!resident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "resident not found.");
    }
    const roomPrice = room.price;

    if (initialPayment < roomPrice * 0.7) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Initial payment must be at least 70% of the room price."
      );
    }

    // Create a Paystack transaction
    const paymentResponse = await paystack.initializeTransaction(
      resident.email,
      initialPayment
    );

    // Save payment as "PENDING"
    await prisma.payment.create({
      data: {
        amount: initialPayment,
        residentId,
        roomId,
        status: paymentResponse.data.status,
        reference: paymentResponse.data.reference,
        method: paymentResponse.data.payment_method,
      },
    });
    console.log(
      `${paymentResponse.data.payment_method}`,
      `${paymentResponse.data.status}`,
      `${paymentResponse.data.reference}`
    );
    return paymentResponse.data.authorization_url;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error initializing payment "
    );
  }
};

export const confirmPayment = async (reference: string) => {
  try {
    const verificationResponse = await paystack.verifyTransaction(reference);

    if (verificationResponse.data.status !== "success") {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Payment verification failed."
      );
    }

    const paymentRecord = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!paymentRecord) {
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        "Payment record not found."
      );
    }
    const { roomId } = paymentRecord;
    if (!roomId) {
      throw new Error("Room ID is not in the payment record");
    }
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
    }
    const debt = room.price - paymentRecord.amount;
    const resident = await prisma.resident.update({
      where: { id: paymentRecord.residentId },
      data: {
        roomAssigned: true,

        amountPaid: paymentRecord.amount,
        balanceOwed: debt,// update balance owed
      },
    });

    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: { status: "CONFIRMED" },
    });

    return resident;
  } catch (error) {
    const err = error as ErrorResponse;
    throw new HttpException(
      err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      err.message || "Error confirming payment  "
    );
  }
};
