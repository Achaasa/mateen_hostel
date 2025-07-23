import prisma from "../utils/prisma";
import HttpException from "../utils/http-error";
import { HttpStatus } from "../utils/http-status";
import { RoomStatus } from "@prisma/client";
import { formatPrismaError } from "../utils/formatPrisma";

export const startNewCalendar = async (hostelId: string, name: string) => {
  try {
    const transaction = await prisma.$transaction(async (tx) => {
      await tx.calendarYear.updateMany({
        where: { hostelId, isActive: true },
        data: { isActive: false, endDate: new Date() },
      });

      const newCalendarYear = await tx.calendarYear.create({
        data: {
          name,
          startDate: new Date(),
          endDate: null,
          isActive: true,
          hostelId,
        },
      });

      const residents = await tx.resident.findMany({
        where: {
          room: { hostelId },
          delFlag: false,
          roomAssigned: true,
        },
      });

      console.log("Fetched residents:", residents);

      for (const resident of residents) {
        if (resident.roomId) {
          const historicalResident = await tx.historicalResident.create({
            data: {
              residentId: resident.id,
              room: {
                connect: { id: resident.roomId },
              },
              CalendarYear: {
                connect: { id: newCalendarYear.id },
              },
              amountPaid: resident.amountPaid,
              roomPrice: resident.roomPrice ?? 0,
              Hostel: {
                connect: { id: hostelId },
              },
              residentName: resident.name,
              residentEmail: resident.email,
              residentPhone: resident.phone,
              residentCourse: resident.course,
            },
          });

          // Reassign Payments to HistoricalResident
          await tx.payment.updateMany({
            where: { residentId: resident.id },
            data: {
              residentId: null, // Clear the old reference (now allowed since residentId is optional)
              historicalResidentId: historicalResident.id, // Set new reference
            },
          });

          await tx.resident.delete({
            where: { id: resident.id },
          });
        }
      }

      await tx.room.updateMany({
        where: { hostelId },
        data: { status: RoomStatus.AVAILABLE },
      });
    });
  } catch (error) {
    console.error("Transaction failed with error:", error);
    throw formatPrismaError(error);
  }
};

// Get current calendar year
export const getCurrentCalendarYear = async (hostelId: string) => {
  try {
    const currentYear = await prisma.calendarYear.findFirst({
      where: {
        hostelId,
        isActive: true,
      },
      include: {
        Residents: {
          include: {
            room: true,
            payments: true,
          },
        },
      },
    });

    if (!currentYear) {
      throw new HttpException(
        HttpStatus.NOT_FOUND,
        "No active calendar year found",
      );
    }

    return currentYear;
  } catch (error) {
    console.error("Error getting current calendar year:", error);
    throw formatPrismaError(error);
  }
};

// Get historical calendar years
export const getHistoricalCalendarYears = async (hostelId: string) => {
  try {
    const historicalYears = await prisma.calendarYear.findMany({
      where: {
        hostelId,
        isActive: false,
      },
      include: {
        HistoricalResident: {
          include: {
            room: true, // Keep room relation, remove resident
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return historicalYears;
  } catch (error) {
    console.error("Error getting historical calendar year:", error);
    throw formatPrismaError(error);
  }
};

// Get calendar year financial report
export const getCalendarYearFinancialReport = async (
  calendarYearId: string,
) => {
  try {
    const report = await prisma.calendarYear.findUnique({
      where: { id: calendarYearId },
      include: {
        HistoricalResident: true, // Include HistoricalResident without resident
      },
    });

    if (!report) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Calendar year not found");
    }

    const totalRevenue = report.HistoricalResident.reduce(
      (sum, hist) => sum + hist.amountPaid,
      0,
    );

    return {
      totalRevenue,
      historicalResidents: report.HistoricalResident.length,
      averageRevenuePerResident:
        totalRevenue / report.HistoricalResident.length || 0, // Handle division by zero
    };
  } catch (error) {
    console.error("Error getting  calendar financial year report:", error);
    throw formatPrismaError(error);
  }
};
// Update calendar year
export const updateCalendarYear = async (
  id: string,
  data: {
    name?: string;
  },
) => {
  try {
    const updatedYear = await prisma.calendarYear.update({
      where: { id },
      data,
      include: {
        Residents: true,
        HistoricalResident: true,
      },
    });

    return updatedYear;
  } catch (error) {
    console.error("Error updating  calendar year:", error);
    throw formatPrismaError(error);
  }
};

export const deleteCalendarYear = async (
  calendarYearId: string,
  hostelId: string,
) => {
  try {
    // Find the calendar year to delete
    const calendarYear = await prisma.calendarYear.findUnique({
      where: { id: calendarYearId },
      include: {
        Residents: true, // Include residents if you need to update their records
      },
    });

    if (!calendarYear) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Calendar year not found");
    }

    if (calendarYear.isActive) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        "Cannot delete an active calendar year",
      );
    }

    // Begin transaction to handle the deletion
    await prisma.$transaction(async (tx) => {
      // Optionally, you can reset room statuses to AVAILABLE if needed
      await tx.room.updateMany({
        where: { hostelId },
        data: { status: RoomStatus.AVAILABLE },
      });

      // Delete the calendar year
      await tx.calendarYear.delete({
        where: { id: calendarYearId },
      });

      // Optionally, delete associated historical records (if necessary)
      await tx.historicalResident.deleteMany({
        where: { calendarYearId },
      });
    });

    return { message: "Calendar year deleted successfully" };
  } catch (error) {
    throw new HttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error deleting calendar year",
    );
  }
};
