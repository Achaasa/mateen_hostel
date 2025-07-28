import prisma from "../utils/prisma";
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { formatPrismaError } from "../utils/formatPrisma";
import { Room, Resident, Payment } from "@prisma/client";
import Decimal from "decimal.js";

interface HostelAnalytics {
  totalRevenue: number;
  totalDebt: number;
  debtPercentage: number;
  expectedIncome: number;
  totalPayments: number;
  averagePaymentAmount: number;
  occupancyRate: number;
  totalRooms: number;
  activeRooms: number;
  occupiedRooms: number;
  totalResidents: number;
  totalDebtors: number;
  debtorsPercentage: number;
  averageDebtPerResident: number;
  totalStaff: number;
  averageRoomPrice: number;
  currentYearStats: {
    totalPayments: number;
    expectedRevenue: number;
    collectedRevenue: number;
    outstandingAmount: number;
  };
}

interface SystemAnalytics extends HostelAnalytics {
  totalHostels: number;
  verifiedHostels: number;
  unverifiedHostels: number;
  publishedHostels: number;
  averageOccupancyRate: number;
  systemWideDebtPercentage: number;
  activeCalendarYears: number;
}

export interface HostelSummary {
  hostelId: string;
  name: string;
  phone: string;
  email: string;
  amountCollected: number;
}

export interface HostelSummaryResponse {
  totalCollected: number;
  disbursements: HostelSummary[];
}

interface CalendarYearReport {
  calendarYearId: string;
  calendarYearName: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  
  // Financial Metrics
  totalRevenue: number;
  totalExpectedRevenue: number;
  totalPayments: number;
  averagePaymentAmount: number;
  collectionRate: number;
  
  // Resident Metrics
  totalResidents: number;
  averageRevenuePerResident: number;
  
  // Room Metrics
  totalRooms: number;
  activeRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  averageRoomPrice: number;
  
  // Historical Data (for completed years)
  historicalResidents: number;
  historicalRevenue: number;
  
  // Payment Analysis
  paymentMethods: {
    method: string;
    count: number;
    totalAmount: number;
  }[];
  
  // Monthly Breakdown (for active years)
  monthlyStats?: {
    month: string;
    revenue: number;
    payments: number;
    newResidents: number;
  }[];
  
  // Performance Indicators
  revenueGrowth?: number; // Compared to previous year
  occupancyGrowth?: number; // Compared to previous year
}

const VALID_PAYMENT_STATUSES = ["success", "CONFIRMED"] as const;

// Helper: Room metrics
const calculateRoomMetrics = (rooms: Room[]) => {
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(
    (room) => room.status !== "MAINTENANCE",
  ).length;
  const occupiedRooms = rooms.filter(
    (room) => room.status === "OCCUPIED",
  ).length;
  const occupancyRate =
    activeRooms > 0
      ? Number(new Decimal(occupiedRooms).div(activeRooms).mul(100).toFixed(2))
      : 0;
  const expectedIncome = rooms.reduce(
    (sum, room) => new Decimal(sum).plus(room.price ?? 0).toNumber(),
    0,
  );
  const averageRoomPrice =
    totalRooms > 0
      ? new Decimal(
          rooms.reduce(
            (sum, room) => new Decimal(sum).plus(room.price ?? 0).toNumber(),
            0,
          ),
        )
          .div(totalRooms)
          .toFixed(2)
      : 0;
  return {
    totalRooms,
    activeRooms,
    occupiedRooms,
    occupancyRate,
    expectedIncome: new Decimal(expectedIncome).toFixed(2),
    averageRoomPrice: Number(averageRoomPrice),
  };
};

// Helper: Resident metrics
const calculateResidentMetrics = (
  residents: (Resident & { payments: Payment[] })[],
  allPayments: Payment[],
) => {
  let totalRevenue = new Decimal(0);
  let totalDebt = new Decimal(0);
  let totalPayments = 0;
  let totalPaymentAmount = new Decimal(0);
  let totalDebtors = 0;

  // Calculate metrics from residents
  residents.forEach((resident) => {
    const confirmedPayments = (resident.payments || []).filter((payment) =>
      VALID_PAYMENT_STATUSES.includes(
        payment.status as (typeof VALID_PAYMENT_STATUSES)[number],
      ),
    );
    totalPayments += confirmedPayments.length;
    totalPaymentAmount = totalPaymentAmount.plus(
      confirmedPayments.reduce(
        (sum, payment) => new Decimal(sum).plus(payment.amount ?? 0).toNumber(),
        0,
      ),
    );
    totalRevenue = totalRevenue.plus(resident.amountPaid ?? 0);

    // Debt calculation: include balanceOwed if resident paid >= 70% but < 100% of roomPrice
    if (
      resident.roomPrice &&
      resident.amountPaid &&
      resident.balanceOwed &&
      resident.balanceOwed > 0
    ) {
      const paymentPercentage = new Decimal(resident.amountPaid)
        .div(resident.roomPrice)
        .mul(100);
      if (paymentPercentage.gte(70) && paymentPercentage.lt(100)) {
        totalDebt = totalDebt.plus(resident.balanceOwed);
        totalDebtors += 1;
      }
    }
  });

  // Include payments with historicalResidentId or null residentId
  const historicalOrNullPayments = allPayments.filter(
    (payment) =>
      (payment.historicalResidentId || payment.residentId === null) &&
      VALID_PAYMENT_STATUSES.includes(
        payment.status as (typeof VALID_PAYMENT_STATUSES)[number],
      ),
  );
  totalPayments += historicalOrNullPayments.length;
  totalPaymentAmount = totalPaymentAmount.plus(
    historicalOrNullPayments.reduce(
      (sum, payment) => new Decimal(sum).plus(payment.amount ?? 0).toNumber(),
      0,
    ),
  );
  totalRevenue = totalRevenue.plus(
    historicalOrNullPayments.reduce(
      (sum, payment) => new Decimal(sum).plus(payment.amount ?? 0).toNumber(),
      0,
    ),
  );

  const totalResidents = residents.length;
  const debtorsPercentage =
    totalResidents > 0
      ? Number(
          new Decimal(totalDebtors).div(totalResidents).mul(100).toFixed(2),
        )
      : 0;
  const averageDebtPerResident =
    totalDebtors > 0 ? totalDebt.div(totalDebtors).toFixed(2) : 0;

  const averagePaymentAmount =
    totalPayments > 0
      ? Number(new Decimal(totalPaymentAmount).div(totalPayments).toFixed(2))
      : 0;

  return {
    totalRevenue: totalRevenue.toFixed(2),
    totalDebt: totalDebt.toFixed(2),
    totalPayments,
    totalPaymentAmount: totalPaymentAmount.toFixed(2),
    totalResidents,
    totalDebtors,
    debtorsPercentage,
    averageDebtPerResident: Number(averageDebtPerResident),
    averagePaymentAmount,
  };
};

// Helper: Payment metrics
const calculatePaymentMetrics = (payments: Payment[]) => {
  const confirmedPayments = payments.filter((payment) =>
    VALID_PAYMENT_STATUSES.includes(
      payment.status as (typeof VALID_PAYMENT_STATUSES)[number],
    ),
  );
  const totalPayments = confirmedPayments.length;
  const totalPaymentAmount = confirmedPayments.reduce(
    (sum, payment) => new Decimal(sum).plus(payment.amount ?? 0).toNumber(),
    0,
  );
  const averagePaymentAmount =
    totalPayments > 0
      ? new Decimal(totalPaymentAmount).div(totalPayments).toFixed(2)
      : 0;
  return {
    totalPayments,
    totalPaymentAmount: new Decimal(totalPaymentAmount).toFixed(2),
    averagePaymentAmount: Number(averagePaymentAmount),
  };
};

// HOSTEL ANALYTICS
export const generateHostelAnalytics = async (
  hostelId: string,
): Promise<HostelAnalytics> => {
  try {
    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId, delFlag: false },
      include: {
        Rooms: {
          where: { delFlag: false },
          select: { id: true, status: true, price: true },
        },
        Staffs: { where: { delFlag: false } },
        resident: {
          where: { delFlag: false },
          select: {
            id: true,
            amountPaid: true,
            balanceOwed: true,
            roomPrice: true,
            payments: true,
          },
        },
        CalendarYear: { where: { isActive: true }, select: { id: true } },
      },
    });

    if (!hostel)
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");

    const roomIds = hostel.Rooms.map((r) => r.id);
    const residentIds = hostel.resident.map((r) => r.id);
    const calendarYearIds = hostel.CalendarYear.map((cy) => cy.id);

    const payments = await prisma.payment.findMany({
      where: {
        delFlag: false,
        status: { in: Array.from(VALID_PAYMENT_STATUSES) },
        OR: [
          { residentId: { in: residentIds.length ? residentIds : [""] } },
          { roomId: { in: roomIds.length ? roomIds : [""] } },
          {
            calendarYearId: {
              in: calendarYearIds.length ? calendarYearIds : [""],
            },
          },
        ],
      },
    });

    const roomMetrics = calculateRoomMetrics(hostel.Rooms as Room[]);
    const residentMetrics = calculateResidentMetrics(
      hostel.resident as (Resident & { payments: Payment[] })[],
      payments,
    );

    const debtPercentage =
      Number(roomMetrics.expectedIncome) > 0
        ? Number(
            new Decimal(residentMetrics.totalDebt)
              .div(roomMetrics.expectedIncome)
              .mul(100)
              .toFixed(2),
          )
        : 0;

    return {
      totalRevenue: Number(residentMetrics.totalRevenue),
      totalDebt: Number(residentMetrics.totalDebt),
      debtPercentage,
      expectedIncome: Number(roomMetrics.expectedIncome),
      totalPayments: residentMetrics.totalPayments,
      averagePaymentAmount: Number(residentMetrics.averagePaymentAmount),
      occupancyRate: Number(roomMetrics.occupancyRate),
      totalRooms: roomMetrics.totalRooms,
      activeRooms: roomMetrics.activeRooms,
      occupiedRooms: roomMetrics.occupiedRooms,
      totalResidents: residentMetrics.totalResidents,
      totalDebtors: residentMetrics.totalDebtors,
      debtorsPercentage: residentMetrics.debtorsPercentage,
      averageDebtPerResident: residentMetrics.averageDebtPerResident,
      totalStaff: hostel.Staffs.length,
      averageRoomPrice: Number(roomMetrics.averageRoomPrice),
      currentYearStats: {
        totalPayments: residentMetrics.totalPayments,
        expectedRevenue: Number(roomMetrics.expectedIncome),
        collectedRevenue: Number(residentMetrics.totalRevenue),
        outstandingAmount: Number(residentMetrics.totalDebt),
      },
    };
  } catch (error) {
    console.error("Error getting Hostel analytics:", error);
    throw formatPrismaError(error);
  }
};

// SYSTEM ANALYTICS
export const generateSystemAnalytics = async (): Promise<SystemAnalytics> => {
  try {
    const [hostels, allPayments, activeCalendarYears] = await Promise.all([
      prisma.hostel.findMany({
        where: { delFlag: false },
        include: {
          Rooms: {
            where: { delFlag: false },
            select: { id: true, status: true, price: true },
          },
          Staffs: { where: { delFlag: false } },
          resident: {
            where: { delFlag: false },
            select: {
              id: true,
              amountPaid: true,
              balanceOwed: true,
              roomPrice: true,
              payments: true,
            },
          },
        },
      }),
      prisma.payment.findMany({
        where: {
          delFlag: false,
          status: { in: Array.from(VALID_PAYMENT_STATUSES) },
        },
      }),
      prisma.calendarYear.count({
        where: { isActive: true },
      }),
    ]);

    let systemMetrics = {
      totalRooms: 0,
      activeRooms: 0,
      occupiedRooms: 0,
      totalRevenue: new Decimal(0),
      totalDebt: new Decimal(0),
      totalResidents: 0,
      totalDebtors: 0,
      totalStaff: 0,
      expectedIncome: new Decimal(0),
    };

    const allResidents = hostels.flatMap(
      (hostel) => hostel.resident as (Resident & { payments: Payment[] })[],
    );
    const residentMetrics = calculateResidentMetrics(allResidents, allPayments);

    hostels.forEach((hostel) => {
      const roomMetrics = calculateRoomMetrics(hostel.Rooms as Room[]);
      systemMetrics.totalRooms += roomMetrics.totalRooms;
      systemMetrics.activeRooms += roomMetrics.activeRooms;
      systemMetrics.occupiedRooms += roomMetrics.occupiedRooms;
      systemMetrics.expectedIncome = systemMetrics.expectedIncome.plus(
        roomMetrics.expectedIncome,
      );
      systemMetrics.totalStaff += hostel.Staffs.length;
    });

    const paymentMetrics = calculatePaymentMetrics(allPayments);

    const debtPercentage =
      Number(systemMetrics.expectedIncome) > 0
        ? Number(
            new Decimal(residentMetrics.totalDebt)
              .div(systemMetrics.expectedIncome)
              .mul(100)
              .toFixed(2),
          )
        : 0;
    const occupancyRate =
      systemMetrics.activeRooms > 0
        ? Number(
            new Decimal(systemMetrics.occupiedRooms)
              .div(systemMetrics.activeRooms)
              .mul(100)
              .toFixed(2),
          )
        : 0;
    const averageRoomPrice =
      systemMetrics.totalRooms > 0
        ? systemMetrics.expectedIncome.div(systemMetrics.totalRooms).toFixed(2)
        : 0;
    const debtorsPercentage =
      residentMetrics.totalResidents > 0
        ? Number(
            new Decimal(residentMetrics.totalDebtors)
              .div(residentMetrics.totalResidents)
              .mul(100)
              .toFixed(2),
          )
        : 0;

    return {
      totalRevenue: Number(residentMetrics.totalRevenue),
      totalDebt: Number(residentMetrics.totalDebt),
      debtPercentage,
      expectedIncome: Number(systemMetrics.expectedIncome),
      totalPayments: paymentMetrics.totalPayments,
      averagePaymentAmount: paymentMetrics.averagePaymentAmount,
      occupancyRate,
      totalRooms: systemMetrics.totalRooms,
      activeRooms: systemMetrics.activeRooms,
      occupiedRooms: systemMetrics.occupiedRooms,
      totalResidents: residentMetrics.totalResidents,
      totalDebtors: residentMetrics.totalDebtors,
      debtorsPercentage,
      averageDebtPerResident: residentMetrics.averageDebtPerResident,
      totalStaff: systemMetrics.totalStaff,
      averageRoomPrice: Number(averageRoomPrice),
      currentYearStats: {
        totalPayments: paymentMetrics.totalPayments,
        expectedRevenue: Number(systemMetrics.expectedIncome),
        collectedRevenue: Number(residentMetrics.totalRevenue),
        outstandingAmount: Number(residentMetrics.totalDebt),
      },
      totalHostels: hostels.length,
      verifiedHostels: hostels.filter((h) => h.isVerified).length,
      unverifiedHostels: hostels.filter((h) => !h.isVerified).length,
      publishedHostels: hostels.filter((h) => h.state === "PUBLISHED").length,
      averageOccupancyRate: occupancyRate,
      systemWideDebtPercentage: debtPercentage,
      activeCalendarYears,
    };
  } catch (error) {
    console.error("Error getting system analytics:", error);
    throw formatPrismaError(error);
  }
};

// HOSTEL DISBURSEMENT SUMMARY
export const getHostelDisbursementSummary =
  async (): Promise<HostelSummaryResponse> => {
    try {
      const hostels = await prisma.hostel.findMany({
        where: { delFlag: false },
        select: { id: true, name: true, phone: true, email: true },
      });

      const rooms = await prisma.room.findMany({
        where: { delFlag: false },
        select: { id: true, hostelId: true },
      });
      const roomHostelMap = new Map(rooms.map((r) => [r.id, r.hostelId]));

      const residents = await prisma.resident.findMany({
        where: { delFlag: false },
        select: { id: true, hostelId: true },
      });
      const residentHostelMap = new Map(
        residents.map((r) => [r.id, r.hostelId]),
      );

      const calendarYears = await prisma.calendarYear.findMany({
        where: { isActive: true },
        select: { id: true, hostelId: true },
      });
      const calendarYearHostelMap = new Map(
        calendarYears.map((cy) => [cy.id, cy.hostelId]),
      );

      const payments = await prisma.payment.findMany({
        where: {
          delFlag: false,
          status: { in: ["success", "CONFIRMED"] },
        },
        select: {
          amount: true,
          calendarYearId: true,
          roomId: true,
          residentId: true,
          historicalResidentId: true,
        },
      });

      const hostelAmountMap = new Map<string, Decimal>();
      for (const payment of payments) {
        let hostelId: string | undefined = undefined;
        if (
          payment.calendarYearId &&
          calendarYearHostelMap.has(payment.calendarYearId)
        ) {
          const id = calendarYearHostelMap.get(payment.calendarYearId);
          if (id !== null && id !== undefined) hostelId = id;
        } else if (payment.roomId && roomHostelMap.has(payment.roomId)) {
          const id = roomHostelMap.get(payment.roomId);
          if (id !== null && id !== undefined) hostelId = id;
        } else if (
          payment.residentId &&
          residentHostelMap.has(payment.residentId)
        ) {
          const id = residentHostelMap.get(payment.residentId);
          if (id !== null && id !== undefined) hostelId = id;
        }
        if (hostelId) {
          hostelAmountMap.set(
            hostelId,
            (hostelAmountMap.get(hostelId) ?? new Decimal(0)).plus(
              payment.amount ?? 0,
            ),
          );
        }
      }

      const disbursements: HostelSummary[] = hostels.map((h) => ({
        hostelId: h.id,
        name: h.name,
        phone: h.phone,
        email: h.email,
        amountCollected: Number(
          (hostelAmountMap.get(h.id) ?? new Decimal(0)).toFixed(2),
        ),
      }));

      const totalCollected = disbursements.reduce(
        (sum, h) => new Decimal(sum).plus(h.amountCollected).toNumber(),
        0,
      );

      return {
        totalCollected: Number(new Decimal(totalCollected).toFixed(2)),
        disbursements,
      };
    } catch (error) {
      console.error("Update Hostel Error:", error);
      throw formatPrismaError(error);
    }
  };

// CALENDAR YEAR REPORT
export const generateCalendarYearReport = async (
  hostelId: string,
  calendarYearId: string,
): Promise<CalendarYearReport> => {
  try {
    const calendarYear = await prisma.calendarYear.findUnique({
      where: { 
        id: calendarYearId,
        hostelId: hostelId 
      },
      include: {
        Residents: {
          where: { delFlag: false },
          include: {
            room: true,
            payments: {
              where: {
                delFlag: false,
                status: { in: Array.from(VALID_PAYMENT_STATUSES) }
              }
            }
          }
        },
        HistoricalResident: {
          include: {
            room: true,
            payments: {
              where: {
                delFlag: false,
                status: { in: Array.from(VALID_PAYMENT_STATUSES) }
              }
            }
          }
        },
        Payments: {
          where: {
            delFlag: false,
            status: { in: Array.from(VALID_PAYMENT_STATUSES) }
          }
        }
      }
    });

    if (!calendarYear) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Calendar year not found");
    }

    // Get all rooms for this hostel
    const rooms = await prisma.room.findMany({
      where: { 
        hostelId: hostelId,
        delFlag: false 
      }
    });

    // Calculate financial metrics
    const currentResidents = calendarYear.Residents;
    const historicalResidents = calendarYear.HistoricalResident;
    const allPayments = calendarYear.Payments;

    // Current year financial calculations
    let totalRevenue = new Decimal(0);
    let totalExpectedRevenue = new Decimal(0);
    let totalPayments = 0;
    let totalPaymentAmount = new Decimal(0);

    // Process current residents
    currentResidents.forEach((resident) => {
      const confirmedPayments = resident.payments.filter((payment) =>
        VALID_PAYMENT_STATUSES.includes(
          payment.status as (typeof VALID_PAYMENT_STATUSES)[number]
        )
      );
      
      totalPayments += confirmedPayments.length;
      totalPaymentAmount = totalPaymentAmount.plus(
        confirmedPayments.reduce(
          (sum, payment) => new Decimal(sum).plus(payment.amount ?? 0).toNumber(),
          0
        )
      );
      
      totalRevenue = totalRevenue.plus(resident.amountPaid ?? 0);
      totalExpectedRevenue = totalExpectedRevenue.plus(resident.roomPrice ?? 0);
    });

    // Process historical residents
    historicalResidents.forEach((histResident) => {
      const confirmedPayments = histResident.payments.filter((payment) =>
        VALID_PAYMENT_STATUSES.includes(
          payment.status as (typeof VALID_PAYMENT_STATUSES)[number]
        )
      );
      
      totalPayments += confirmedPayments.length;
      totalPaymentAmount = totalPaymentAmount.plus(
        confirmedPayments.reduce(
          (sum, payment) => new Decimal(sum).plus(payment.amount ?? 0).toNumber(),
          0
        )
      );
      
      totalRevenue = totalRevenue.plus(histResident.amountPaid);
      totalExpectedRevenue = totalExpectedRevenue.plus(histResident.roomPrice);
    });

    // Process standalone payments
    allPayments.forEach((payment) => {
      if (!payment.residentId && !payment.historicalResidentId) {
        totalPayments += 1;
        totalPaymentAmount = totalPaymentAmount.plus(payment.amount ?? 0);
        totalRevenue = totalRevenue.plus(payment.amount ?? 0);
      }
    });

    // Calculate derived metrics
    const totalResidents = currentResidents.length + historicalResidents.length;
    const collectionRate = Number(totalExpectedRevenue) > 0
      ? Number(new Decimal(totalRevenue).div(totalExpectedRevenue).mul(100).toFixed(2))
      : 0;
    const averagePaymentAmount = totalPayments > 0
      ? Number(new Decimal(totalPaymentAmount).div(totalPayments).toFixed(2))
      : 0;
    const averageRevenuePerResident = totalResidents > 0
      ? Number(totalRevenue.div(totalResidents).toFixed(2))
      : 0;

    // Calculate room metrics
    const roomMetrics = calculateRoomMetrics(rooms);

    // Calculate payment methods breakdown
    const paymentMethodsMap = new Map<string, { count: number; totalAmount: Decimal }>();
    allPayments.forEach((payment) => {
      const method = payment.method || 'Unknown';
      const existing = paymentMethodsMap.get(method) || { count: 0, totalAmount: new Decimal(0) };
      paymentMethodsMap.set(method, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount.plus(payment.amount ?? 0)
      });
    });

    const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      totalAmount: Number(data.totalAmount.toFixed(2))
    }));

    // Generate monthly breakdown for active calendar years
    let monthlyStats: CalendarYearReport['monthlyStats'] = undefined;
    if (calendarYear.isActive) {
      monthlyStats = await generateMonthlyBreakdown(calendarYearId, hostelId);
    }

    // Calculate growth metrics (compare with previous year if available)
    const previousYear = await prisma.calendarYear.findFirst({
      where: {
        hostelId: hostelId,
        isActive: false,
        endDate: { lt: calendarYear.startDate }
      },
      orderBy: { endDate: 'desc' }
    });

    let revenueGrowth: number | undefined = undefined;
    let occupancyGrowth: number | undefined = undefined;

    if (previousYear) {
      const previousYearReport = await generateCalendarYearReport(hostelId, previousYear.id);
      revenueGrowth = previousYearReport.totalRevenue > 0
        ? Number(new Decimal(totalRevenue).div(previousYearReport.totalRevenue).minus(1).mul(100).toFixed(2))
        : undefined;
      occupancyGrowth = previousYearReport.occupancyRate > 0
        ? Number(new Decimal(roomMetrics.occupancyRate).div(previousYearReport.occupancyRate).minus(1).mul(100).toFixed(2))
        : undefined;
    }

    return {
      calendarYearId: calendarYear.id,
      calendarYearName: calendarYear.name,
      startDate: calendarYear.startDate,
      endDate: calendarYear.endDate,
      isActive: calendarYear.isActive,
      
      // Financial Metrics
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpectedRevenue: Number(totalExpectedRevenue.toFixed(2)),
      totalPayments,
      averagePaymentAmount,
      collectionRate,
      
      // Resident Metrics
      totalResidents,
      averageRevenuePerResident,
      
      // Room Metrics
      totalRooms: roomMetrics.totalRooms,
      activeRooms: roomMetrics.activeRooms,
      occupiedRooms: roomMetrics.occupiedRooms,
      occupancyRate: roomMetrics.occupancyRate,
      averageRoomPrice: roomMetrics.averageRoomPrice,
      
      // Historical Data
      historicalResidents: historicalResidents.length,
      historicalRevenue: historicalResidents.reduce((sum, hist) => sum + hist.amountPaid, 0),
      
      // Payment Analysis
      paymentMethods,
      
      // Monthly Breakdown
      monthlyStats,
      
      // Performance Indicators
      revenueGrowth,
      occupancyGrowth
    };

  } catch (error) {
    console.error("Error generating calendar year report:", error);
    throw formatPrismaError(error);
  }
};

// Helper function to generate monthly breakdown
const generateMonthlyBreakdown = async (
  calendarYearId: string,
  hostelId: string,
): Promise<CalendarYearReport["monthlyStats"]> => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        calendarYearId: calendarYearId,
        delFlag: false,
        status: { in: Array.from(VALID_PAYMENT_STATUSES) },
      },
      select: {
        amount: true,
        date: true,
      },
    });

    const monthlyMap = new Map<
      string,
      { revenue: Decimal; payments: number; newResidents: number }
    >();

    // Initialize all months
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    months.forEach((month) => {
      monthlyMap.set(month, {
        revenue: new Decimal(0),
        payments: 0,
        newResidents: 0,
      });
    });

    // Aggregate payment data by month
    payments.forEach((payment) => {
      const month = new Date(payment.date).toLocaleString("en-US", {
        month: "long",
      });
      const existing = monthlyMap.get(month) || {
        revenue: new Decimal(0),
        payments: 0,
        newResidents: 0,
      };
      monthlyMap.set(month, {
        revenue: existing.revenue.plus(payment.amount ?? 0),
        payments: existing.payments + 1,
        newResidents: existing.newResidents, // This would need additional logic to track new residents
      });
    });

    return Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      revenue: Number(data.revenue.toFixed(2)),
      payments: data.payments,
      newResidents: data.newResidents,
    }));
  } catch (error) {
    console.error("Error generating monthly breakdown:", error);
    return [];
  }
};
