// src/helpers/residentHelpers.ts

import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { Payment, Resident } from "@prisma/client";
import { ErrorResponse } from "../utils/types";
import paystack from "../utils/paystack";
import { formatPrismaError } from "../utils/formatPrisma";

export const initializePayment = async (
  roomId: string,
  residentId: string,
  initialPayment: number
) => {
   // check for active calendar
   const activeCalendar = await prisma.calendarYear.findFirst({
    where: { isActive: true },
  });
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
        status: "PENDING",
        reference: paymentResponse.data.reference,
        method: paymentResponse.data.payment_method,
        calendarYearId:activeCalendar?.id as string

      },
    });

    return paymentResponse.data.authorization_url;
  } catch (error) {
    throw formatPrismaError(error);
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
        balanceOwed: debt, // update balance owed
      },
    });
    const currentResidentsCount = await prisma.resident.count({where:{id:roomId}})
    
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        status: verificationResponse.data.status,
        method: verificationResponse.data.channel,
      },
    });
 
    await prisma.room.update({
      where: { id: roomId },
      data: { currentResidentCount: currentResidentsCount + 1 },
    });
    return resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const initializeTopUpPayment = async (
  roomId: string,
  residentId: string,
  initialPayment: number
) => {
  try {
    // check for active calendar
    const activeCalendar = await prisma.calendarYear.findFirst({
      where: { isActive: true },
    });
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
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }

    const { roomPrice } = resident;

    if (!roomPrice) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Room price not set for the resident."
      );
    }

    const debtbal = roomPrice - resident.amountPaid;

    if (initialPayment > debtbal) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Amount you want to pay must be less than or equal to what you owe."
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
        status: "PENDING",
        reference: paymentResponse.data.reference,
        method: paymentResponse.data.channel, // Adjust method to use 'channel'
        calendarYearId:activeCalendar?.id as string
      },
    });

    return paymentResponse.data.authorization_url;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const TopUpPayment = async (reference: string) => {
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

    const findResident = await prisma.resident.findUnique({
      where: { id: paymentRecord.residentId },
    });
    if (!findResident) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
    }
    if (findResident.roomPrice === null) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Room price is missing for this resident."
      );
    }
    // Use the resident's original room price for calculations
    const roomPrice = findResident.roomPrice;
    const totalPaid = findResident.amountPaid + paymentRecord.amount;

    // Calculate the remaining debt based on the original room price
    const debt = roomPrice - totalPaid;

    const resident = await prisma.resident.update({
      where: { id: paymentRecord.residentId },
      data: {
        roomAssigned: true,
        amountPaid: totalPaid, // Update the total amount paid
        balanceOwed: debt > 0 ? debt : 0, // Ensure balance owed doesn't go below 0
      },
    });

    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: { status: "CONFIRMED", method: verificationResponse.data.channel },
    });

    return resident;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getAllPayments = async () => {
  try {
    const payments = await prisma.payment.findMany();
    return payments as Payment[];
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getPaymentsForHostel = async (hostelId: string) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { resident: { room: { hostelId } } },
    });
    return payments;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getPaymentsById = async (paymentId: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Payment not found");
    }
    return payment as Payment;
  } catch (error) {
    throw formatPrismaError(error);
  }
};

export const getPaymentsByReference = async (reference: string) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });
    if (!payment) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Payment not found");
    }
    return payment as Payment;
  } catch (error) {
    throw formatPrismaError(error);
  }
};
