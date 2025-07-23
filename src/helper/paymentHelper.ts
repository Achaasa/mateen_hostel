import prisma from "../utils/prisma";
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { formatPrismaError } from "../utils/formatPrisma";
import { Room, Resident, Payment } from "@prisma/client";
import paystack from "../utils/paystack";
import { ErrorResponse } from "../utils/types";
import { generateAlphanumericCode } from "../utils/codeGenerator";
import { generateCodeEmail } from "../services/generatePaymentCode";
import { sendEmail } from "../utils/nodeMailer";
// import Decimal from "decimal.js";

interface OrphanedPaymentResolution {
  paymentId: string;
  resolution:
    | "linked_to_historical"
    | "linked_to_resident"
    | "marked_invalid"
    | "deleted";
  details: string;
}
// Payment Processing Functions

export const initializePayment = async (
  roomId: string,
  residentId: string,
  initialPayment: number,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const resident = await tx.resident.findUnique({
        where: { id: residentId, delFlag: false },
      });

      if (!resident) {
        throw new HttpException(
          HttpStatus.NOT_FOUND,
          "Active resident not found",
        );
      }

      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { hostel: true },
      });

      if (!room) {
        throw new HttpException(HttpStatus.NOT_FOUND, "Room not found");
      }

      const activeCalendar = await tx.calendarYear.findFirst({
        where: { isActive: true, hostelId: room.hostelId },
      });

      if (!activeCalendar) {
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          "No active calendar year found",
        );
      }

      const paymentResponse = await paystack.initializeTransaction(
        resident.email,
        initialPayment,
      );

      const payment = await tx.payment.create({
        data: {
          amount: initialPayment,
          residentId,
          roomId,
          status: "PENDING",
          reference: paymentResponse.data.reference,
          method: paymentResponse.data.payment_method,
          calendarYearId: activeCalendar.id,
        },
      });

      return {
        authorizationUrl: paymentResponse.data.authorization_url,
        reference: paymentResponse.data.reference,
      };
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    throw formatPrismaError(error);
  }
};

export const confirmPayment = async (reference: string) => {
  try {
    // generate alphanumeric code for access
    const code = generateAlphanumericCode();
    if (!code) {
      throw new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Failed to generate access code.",
      );
    }
    const verificationResponse = await paystack.verifyTransaction(reference);
    if (verificationResponse.data.status !== "success") {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Payment verification failed.",
      );
    }

    const paymentRecord = await prisma.payment.findUnique({
      where: { reference },
      include: { resident: true, HistoricalResident: true },
    });

    if (!paymentRecord) {
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        "Payment record not found.",
      );
    }

    const { roomId, residentId, historicalResidentId } = paymentRecord;

    if (!roomId) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Room ID is missing in the payment record.",
      );
    }

    if (!residentId && !historicalResidentId) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Payment must have either a residentId or historicalResidentId.",
      );
    }

    if (historicalResidentId) {
      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: verificationResponse.data.status,
          method: verificationResponse.data.channel,
        },
      });
      return { message: "Payment confirmed for historical resident." };
    }

    const updatedResident = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) {
        throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
      }

      const resident = await tx.resident.findUnique({
        where: { id: residentId! },
        include: { room: true },
      });
      if (!resident) {
        throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
      }

      const totalPaid = (resident.amountPaid ?? 0) + paymentRecord.amount;
      const roomPrice = resident.roomPrice ?? room.price;
      const debt = roomPrice - totalPaid;
      let balanceOwed: number | null = null;

      if (debt > 0) {
        const paymentPercentage = (totalPaid / roomPrice) * 100;
        if (paymentPercentage >= 70) {
          balanceOwed = Number(debt.toFixed(2));
        }
      }

      // Update resident WITH accessCode in the SAME operation
      const updatedResident = await tx.resident.update({
        where: { id: residentId! },
        data: {
          roomAssigned: true,
          roomId,
          amountPaid: Number(totalPaid.toFixed(2)),
          roomPrice: Number(roomPrice.toFixed(2)),
          balanceOwed,
          accessCode: code, // Set the generated access code
        },
      });

      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: verificationResponse.data.status,
          method: verificationResponse.data.channel,
        },
      });

      const currentResidentsCount = await tx.resident.count({
        where: { roomId },
      });

      const updatedRoom = await tx.room.update({
        where: { id: roomId },
        data: { currentResidentCount: currentResidentsCount },
      });

      if (updatedRoom.currentResidentCount >= updatedRoom.maxCap) {
        await tx.room.update({
          where: { id: roomId },
          data: { status: "OCCUPIED" },
        });
      }

      return updatedResident;
    });
    const htmlContent = generateCodeEmail(
      updatedResident.name,
      updatedResident.accessCode!,
    );
    await sendEmail(
      updatedResident.email,
      "🎉 Your Hostel Access Code",
      htmlContent,
    );

    return updatedResident;
  } catch (error) {
    console.error("Error confirming payment:", error);
    throw formatPrismaError(error);
  }
};

export const initializeTopUpPayment = async (
  roomId: string,
  residentId: string,
  initialPayment: number,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { hostel: true },
      });

      if (!room) {
        throw new HttpException(HttpStatus.NOT_FOUND, "Room not found.");
      }

      const activeCalendar = await tx.calendarYear.findFirst({
        where: { isActive: true, hostelId: room.hostelId },
      });

      if (!activeCalendar) {
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          "No active calendar year found.",
        );
      }

      const resident = await tx.resident.findUnique({
        where: { id: residentId },
      });

      if (!resident) {
        throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
      }

      const { roomPrice } = resident;

      if (!roomPrice) {
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          "Room price not set for the resident.",
        );
      }

      const debtbal = roomPrice - (resident.amountPaid ?? 0);

      if (initialPayment > debtbal) {
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          "Amount you want to pay must be less than or equal to what you owe.",
        );
      }

      const paymentResponse = await paystack.initializeTransaction(
        resident.email,
        initialPayment,
      );

      await tx.payment.create({
        data: {
          amount: initialPayment,
          residentId,
          roomId,
          status: "PENDING",
          reference: paymentResponse.data.reference,
          method: paymentResponse.data.channel,
          calendarYearId: activeCalendar.id,
        },
      });

      return paymentResponse.data.authorization_url;
    });
  } catch (error) {
    console.error("error initializing top up payment:", error);
    throw formatPrismaError(error);
  }
};

export const TopUpPayment = async (reference: string) => {
  try {
    // Generate alphanumeric access code
    const code = generateAlphanumericCode();
    if (!code) {
      throw new HttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Failed to generate access code.",
      );
    }

    // Verify transaction with Paystack
    const verificationResponse = await paystack.verifyTransaction(reference);
    if (verificationResponse.data.status !== "success") {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Payment verification failed.",
      );
    }

    // Fetch payment record
    const paymentRecord = await prisma.payment.findUnique({
      where: { reference },
      include: { resident: true, HistoricalResident: true },
    });

    if (!paymentRecord) {
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        "Payment record not found.",
      );
    }

    const { roomId, residentId, historicalResidentId } = paymentRecord;

    if (!roomId) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Room ID is missing in the payment record.",
      );
    }

    if (!residentId && !historicalResidentId) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Payment must have either a residentId or historicalResidentId.",
      );
    }

    // Handle historical resident separately
    if (historicalResidentId) {
      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: verificationResponse.data.status,
          method: verificationResponse.data.channel,
        },
      });
      return { message: "Top-up payment confirmed for historical resident." };
    }

    // Transaction for current resident update
    const updatedResident = await prisma.$transaction(async (tx) => {
      const resident = await tx.resident.findUnique({
        where: { id: residentId! },
      });

      if (!resident) {
        throw new HttpException(HttpStatus.NOT_FOUND, "Resident not found.");
      }

      if (resident.roomPrice === null) {
        throw new HttpException(
          HttpStatus.BAD_REQUEST,
          "Room price is missing for this resident.",
        );
      }

      const roomPrice = resident.roomPrice;
      const totalPaid = (resident.amountPaid ?? 0) + paymentRecord.amount;
      const debt = roomPrice - totalPaid;
      let balanceOwed: number | null = null;

      if (debt > 0) {
        const paymentPercentage = (totalPaid / roomPrice) * 100;
        if (paymentPercentage >= 70) {
          balanceOwed = Number(debt.toFixed(2));
        }
      }

      // Update resident with new payment info
      const updatedResident = await tx.resident.update({
        where: { id: residentId! },
        data: {
          roomAssigned: true,
          amountPaid: Number(totalPaid.toFixed(2)),
          balanceOwed,
        },
      });

      // Update payment record
      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: verificationResponse.data.status,
          method: verificationResponse.data.channel,
        },
      });

      return updatedResident;
    });

    // Send access code via email
    const htmlContent = generateCodeEmail(
      updatedResident.name,
      updatedResident.accessCode!,
    );
    await sendEmail(
      updatedResident.email,
      "🎉 Your Hostel Payments",
      htmlContent,
    );

    return updatedResident;
  } catch (error) {
    console.error("Update Hostel Error:", error);
    throw formatPrismaError(error);
  }
};

export const getAllPayments = async () => {
  try {
    const payments = await prisma.payment.findMany();
    return payments as Payment[];
  } catch (error) {
    console.error("error getting payments:", error);
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
    console.error("error getting payments for hostel:", error);
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
    console.error("error getting payment:", error);
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
    console.error("error getting payment:", error);
    throw formatPrismaError(error);
  }
};

export const fixOrphanedPayments = async (): Promise<
  OrphanedPaymentResolution[]
> => {
  try {
    const orphanedPayments = await prisma.payment.findMany({
      where: {
        residentId: null,
        historicalResidentId: null,
        delFlag: false,
      },
      include: {
        room: {
          include: {
            Resident: true,
            hostel: true,
          },
        },
        CalendarYear: true,
      },
    });

    const resolutions: OrphanedPaymentResolution[] = [];

    for (const payment of orphanedPayments) {
      try {
        await prisma.$transaction(async (tx) => {
          // Case 1: Payment has a room with a current resident
          if (payment.room?.Resident?.[0]?.id) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { residentId: payment.room.Resident[0].id },
            });
            resolutions.push({
              paymentId: payment.id,
              resolution: "linked_to_resident",
              details: `Linked to current resident ${payment.room.Resident[0].id}`,
            });
            return;
          }

          // Case 2: Payment has a room and calendar year - try to find historical resident
          if (payment.roomId && payment.calendarYearId) {
            const historicalResident = await tx.historicalResident.findFirst({
              where: {
                roomId: payment.roomId,
                calendarYearId: payment.calendarYearId,
              },
            });

            if (historicalResident) {
              await tx.payment.update({
                where: { id: payment.id },
                data: { historicalResidentId: historicalResident.id },
              });
              resolutions.push({
                paymentId: payment.id,
                resolution: "linked_to_historical",
                details: `Linked to historical resident ${historicalResident.id}`,
              });
              return;
            }
          }

          // Case 3: Payment is older than 6 months and unverified
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

          if (payment.date < sixMonthsAgo && payment.status === "PENDING") {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: "INVALID" },
            });
            resolutions.push({
              paymentId: payment.id,
              resolution: "marked_invalid",
              details: "Old unverified payment marked as invalid",
            });
            return;
          }

          // Case 4: Payment is a duplicate (same amount, room, calendar year, within 5 minutes)
          const possibleDuplicates = await tx.payment.findMany({
            where: {
              id: { not: payment.id },
              amount: payment.amount,
              roomId: payment.roomId,
              calendarYearId: payment.calendarYearId,
              date: {
                gte: new Date(payment.date.getTime() - 5 * 60000),
                lte: new Date(payment.date.getTime() + 5 * 60000),
              },
            },
          });

          if (possibleDuplicates.length > 0) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { delFlag: true },
            });
            resolutions.push({
              paymentId: payment.id,
              resolution: "deleted",
              details: "Identified as duplicate payment and marked as deleted",
            });
            return;
          }

          // Case 5: Cannot resolve - mark as invalid
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "INVALID" },
          });
          resolutions.push({
            paymentId: payment.id,
            resolution: "marked_invalid",
            details: "Could not resolve orphaned payment",
          });
        });
      } catch (error: any) {
        resolutions.push({
          paymentId: payment.id,
          resolution: "marked_invalid",
          details: `Failed to fix: ${error.message}`,
        });
      }
    }

    return resolutions;
  } catch (error) {
    console.error("error fixing  orphaned payment record:", error);
    throw formatPrismaError(error);
  }
};
