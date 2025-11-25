import prisma from "../utils/prisma";
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { formatPrismaError } from "../utils/formatPrisma";
import {
  HostelState,
  Payment,
  PaymentStatus,
  ResidentProfile,
  Room,
  RoomStatus,
} from "@prisma/client";
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

const VALID_PAYMENT_STATUSES: PaymentStatus[] = [PaymentStatus.confirmed];

type ResidentProfileWithPayments = ResidentProfile & {
  payments: Payment[];
};

// Helper: Room metrics
const calculateRoomMetrics = (rooms: Room[]) => {
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(
    (room) => room.status !== RoomStatus.maintenance,
  ).length;
  const occupiedRooms = rooms.filter(
    (room) => room.status === RoomStatus.occupied,
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
    expectedIncome: Number(new Decimal(expectedIncome).toFixed(2)),
    averageRoomPrice: Number(averageRoomPrice),
  };
};

// Helper: Resident metrics
const calculateResidentMetrics = (
  residents: ResidentProfileWithPayments[],
  allPayments: Payment[],
) => {
  let totalRevenue = new Decimal(0);
  let totalDebt = new Decimal(0);
  let totalPayments = 0;
  let totalPaymentAmount = new Decimal(0);
  let totalDebtors = 0;

  // Calculate metrics from residents
  residents.forEach((resident) => {
    const confirmedPayments = (resident.payments || []).filter(
      (payment) =>
        payment.status !== null &&
        VALID_PAYMENT_STATUSES.includes(payment.status),
    );
    totalPayments += confirmedPayments.length;
    confirmedPayments.forEach((payment) => {
      totalPaymentAmount = totalPaymentAmount.plus(payment.amount ?? 0);
      totalRevenue = totalRevenue.plus(payment.amount ?? 0);
      if (payment.balanceOwed && payment.balanceOwed > 0) {
        totalDebt = totalDebt.plus(payment.balanceOwed);
        totalDebtors += 1;
      }
    });
  });

  // Include payments with historicalResidentId or no residentProfileId
  const historicalOrStandalonePayments = allPayments.filter(
    (payment) =>
      !payment.residentProfileId &&
      VALID_PAYMENT_STATUSES.includes(payment.status ?? PaymentStatus.pending),
  );
  historicalOrStandalonePayments.forEach((payment) => {
    totalPayments += 1;
    totalPaymentAmount = totalPaymentAmount.plus(payment.amount ?? 0);
    totalRevenue = totalRevenue.plus(payment.amount ?? 0);
    if (payment.balanceOwed && payment.balanceOwed > 0) {
      totalDebt = totalDebt.plus(payment.balanceOwed);
    }
  });

  const totalResidents = residents.length;
  const debtorsPercentage =
    totalResidents > 0
      ? Number(
          new Decimal(totalDebtors).div(totalResidents).mul(100).toFixed(2),
        )
      : 0;
  const averageDebtPerResident =
    totalDebtors > 0 ? Number(totalDebt.div(totalDebtors).toFixed(2)) : 0;

  const averagePaymentAmount =
    totalPayments > 0
      ? Number(totalPaymentAmount.div(totalPayments).toFixed(2))
      : 0;

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalDebt: Number(totalDebt.toFixed(2)),
    totalPayments,
    totalPaymentAmount: Number(totalPaymentAmount.toFixed(2)),
    totalResidents,
    totalDebtors,
    debtorsPercentage,
    averageDebtPerResident,
    averagePaymentAmount,
  };
};

// Helper: Payment metrics
const calculatePaymentMetrics = (payments: Payment[]) => {
  const confirmedPayments = payments.filter(
    (payment) =>
      payment.status !== null &&
      VALID_PAYMENT_STATUSES.includes(payment.status),
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
      where: { id: hostelId, deletedAt: null },
      include: {
        rooms: {
          where: { deletedAt: null },
        },
        staffProfiles: true,
        residentProfiles: {
          include: {
            payments: {
              where: {
                deletedAt: null,
                status: { in: VALID_PAYMENT_STATUSES },
              },
            },
          },
        },
        calendarYears: { where: { isActive: true }, select: { id: true } },
      },
    });

    if (!hostel)
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");

    const roomIds = hostel.rooms.map((r) => r.id);
    const residentIds = hostel.residentProfiles.map((r) => r.id);
    const calendarYearIds = hostel.calendarYears.map((cy) => cy.id);

    const paymentFilters = [] as {
      residentProfileId?: { in: string[] };
      roomId?: { in: string[] };
      calendarYearId?: { in: string[] };
    }[];
    if (residentIds.length > 0) {
      paymentFilters.push({ residentProfileId: { in: residentIds } });
    }
    if (roomIds.length > 0) {
      paymentFilters.push({ roomId: { in: roomIds } });
    }
    if (calendarYearIds.length > 0) {
      paymentFilters.push({ calendarYearId: { in: calendarYearIds } });
    }

    const payments = await prisma.payment.findMany({
      where: {
        deletedAt: null,
        status: { in: VALID_PAYMENT_STATUSES },
        ...(paymentFilters.length > 0 ? { OR: paymentFilters } : {}),
      },
    });

    const roomMetrics = calculateRoomMetrics(hostel.rooms as Room[]);
    const residentMetrics = calculateResidentMetrics(
      hostel.residentProfiles as ResidentProfileWithPayments[],
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
      totalStaff: hostel.staffProfiles.length,
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
        where: { deletedAt: null },
        include: {
          rooms: { where: { deletedAt: null } },
          staffProfiles: true,
          residentProfiles: {
            include: {
              payments: {
                where: {
                  deletedAt: null,
                  status: { in: VALID_PAYMENT_STATUSES },
                },
              },
            },
          },
        },
      }),
      prisma.payment.findMany({
        where: {
          deletedAt: null,
          status: { in: VALID_PAYMENT_STATUSES },
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
      (hostel) =>
        hostel.residentProfiles as ResidentProfileWithPayments[],
    );
    const residentMetrics = calculateResidentMetrics(allResidents, allPayments);

    hostels.forEach((hostel) => {
      const roomMetrics = calculateRoomMetrics(hostel.rooms as Room[]);
      systemMetrics.totalRooms += roomMetrics.totalRooms;
      systemMetrics.activeRooms += roomMetrics.activeRooms;
      systemMetrics.occupiedRooms += roomMetrics.occupiedRooms;
      systemMetrics.expectedIncome = systemMetrics.expectedIncome.plus(
        roomMetrics.expectedIncome,
      );
      systemMetrics.totalStaff += hostel.staffProfiles.length;
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
      publishedHostels: hostels.filter(
        (h) => h.state === HostelState.published,
      ).length,
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
        where: { deletedAt: null },
        select: { id: true, name: true, phone: true, email: true },
      });

      const rooms = await prisma.room.findMany({
        where: { deletedAt: null },
        select: { id: true, hostelId: true },
      });
      const roomHostelMap = new Map(rooms.map((room) => [room.id, room.hostelId]));

      const residentProfiles = await prisma.residentProfile.findMany({
        select: { id: true, hostelId: true },
      });
      const residentHostelMap = new Map(
        residentProfiles.map((resident) => [resident.id, resident.hostelId ?? ""]),
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
          deletedAt: null,
          status: { in: VALID_PAYMENT_STATUSES },
        },
        select: {
          amount: true,
          calendarYearId: true,
          roomId: true,
          residentProfileId: true,
          historicalResidentId: true,
        },
      });

      const historicalIds = Array.from(
        new Set(
          payments
            .map((payment) => payment.historicalResidentId)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const historicalResidents = historicalIds.length
        ? await prisma.historicalResident.findMany({
            where: { id: { in: historicalIds } },
            select: { id: true, roomId: true, residentId: true },
          })
        : [];

      const historicalHostelMap = new Map<string, string>();
      historicalResidents.forEach((hist) => {
        if (hist.roomId && roomHostelMap.has(hist.roomId)) {
          historicalHostelMap.set(hist.id, roomHostelMap.get(hist.roomId)!);
        } else if (hist.residentId && residentHostelMap.has(hist.residentId)) {
          historicalHostelMap.set(hist.id, residentHostelMap.get(hist.residentId)!);
        }
      });

      const hostelAmountMap = new Map<string, Decimal>();
      for (const payment of payments) {
        let hostelId: string | undefined;

        if (!hostelId && payment.calendarYearId) {
          hostelId = calendarYearHostelMap.get(payment.calendarYearId);
        }
        if (!hostelId && payment.roomId) {
          hostelId = roomHostelMap.get(payment.roomId);
        }
        if (!hostelId && payment.residentProfileId) {
          hostelId = residentHostelMap.get(payment.residentProfileId);
        }
        if (!hostelId && payment.historicalResidentId) {
          hostelId = historicalHostelMap.get(payment.historicalResidentId);
        }

        if (!hostelId) continue;

        hostelAmountMap.set(
          hostelId,
          (hostelAmountMap.get(hostelId) ?? new Decimal(0)).plus(
            payment.amount ?? 0,
          ),
        );
      }

      const disbursements: HostelSummary[] = hostels.map((hostel) => ({
        hostelId: hostel.id,
        name: hostel.name,
        phone: hostel.phone,
        email: hostel.email,
        amountCollected: Number(
          (hostelAmountMap.get(hostel.id) ?? new Decimal(0)).toFixed(2),
        ),
      }));

      const totalCollected = disbursements.reduce(
        (sum, entry) => new Decimal(sum).plus(entry.amountCollected).toNumber(),
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
      where: { id: calendarYearId, hostelId },
      include: {
        residents: {
          include: {
            room: true,
            payments: {
              where: {
                deletedAt: null,
                status: { in: VALID_PAYMENT_STATUSES },
                calendarYearId,
              },
            },
          },
        },
        historicalResidents: {
          include: {
            room: true,
            payments: {
              where: {
                deletedAt: null,
                status: { in: VALID_PAYMENT_STATUSES },
                calendarYearId,
              },
            },
          },
        },
        payments: {
          where: {
            deletedAt: null,
            status: { in: VALID_PAYMENT_STATUSES },
          },
          select: {
            amount: true,
            method: true,
            residentProfileId: true,
            historicalResidentId: true,
          },
        },
      },
    });

    if (!calendarYear) {
      throw new HttpException(HttpStatus.NOT_FOUND, "Calendar year not found");
    }

    const rooms = await prisma.room.findMany({
      where: {
        hostelId,
        deletedAt: null,
      },
    });

    const currentResidents = calendarYear.residents;
    const historicalResidents = calendarYear.historicalResidents;
    const standalonePayments = calendarYear.payments.filter(
      (payment) => !payment.residentProfileId && !payment.historicalResidentId,
    );

    let totalRevenue = new Decimal(0);
    let totalExpectedRevenue = new Decimal(0);
    let totalPayments = 0;
    let totalPaymentAmount = new Decimal(0);

    currentResidents.forEach((resident) => {
      const confirmedPayments = resident.payments;
      totalPayments += confirmedPayments.length;
      confirmedPayments.forEach((payment) => {
        totalPaymentAmount = totalPaymentAmount.plus(payment.amount ?? 0);
        totalRevenue = totalRevenue.plus(payment.amount ?? 0);
      });
      totalExpectedRevenue = totalExpectedRevenue.plus(resident.room?.price ?? 0);
    });

    const historicalRevenueTotals: number[] = [];
    historicalResidents.forEach((histResident) => {
      const confirmedPayments = histResident.payments;
      totalPayments += confirmedPayments.length;
      const histRevenue = confirmedPayments.reduce(
        (sum, payment) => new Decimal(sum).plus(payment.amount ?? 0),
        new Decimal(0),
      );
      totalPaymentAmount = totalPaymentAmount.plus(histRevenue);
      totalRevenue = totalRevenue.plus(histRevenue);
      totalExpectedRevenue = totalExpectedRevenue.plus(
        histResident.roomPrice ?? histResident.room?.price ?? 0,
      );
      historicalRevenueTotals.push(Number(histRevenue.toFixed(2)));
    });

    standalonePayments.forEach((payment) => {
      totalPayments += 1;
      totalPaymentAmount = totalPaymentAmount.plus(payment.amount ?? 0);
      totalRevenue = totalRevenue.plus(payment.amount ?? 0);
    });

    const totalResidents = currentResidents.length + historicalResidents.length;
    const collectionRate = Number(totalExpectedRevenue) > 0
      ? Number(
          totalRevenue
            .div(totalExpectedRevenue)
            .mul(100)
            .toFixed(2),
        )
      : 0;
    const averagePaymentAmount = totalPayments > 0
      ? Number(totalPaymentAmount.div(totalPayments).toFixed(2))
      : 0;
    const averageRevenuePerResident = totalResidents > 0
      ? Number(totalRevenue.div(totalResidents).toFixed(2))
      : 0;

    const roomMetrics = calculateRoomMetrics(rooms);

    const paymentMethodsMap = new Map<string, { count: number; totalAmount: Decimal }>();
    [...currentResidents, ...historicalResidents].forEach((entity) => {
      entity.payments.forEach((payment) => {
        const method = payment.method ?? "Unknown";
        const existing =
          paymentMethodsMap.get(method) ??
          { count: 0, totalAmount: new Decimal(0) };
        paymentMethodsMap.set(method, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount.plus(payment.amount ?? 0),
        });
      });
    });
    standalonePayments.forEach((payment) => {
      const method = payment.method ?? "Unknown";
      const existing =
        paymentMethodsMap.get(method) ?? { count: 0, totalAmount: new Decimal(0) };
      paymentMethodsMap.set(method, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount.plus(payment.amount ?? 0),
      });
    });

    const paymentMethods = Array.from(paymentMethodsMap.entries()).map(
      ([method, data]) => ({
        method,
        count: data.count,
        totalAmount: Number(data.totalAmount.toFixed(2)),
      }),
    );

    let monthlyStats: CalendarYearReport["monthlyStats"] = undefined;
    if (calendarYear.isActive) {
      monthlyStats = await generateMonthlyBreakdown(calendarYearId, hostelId);
    }

    const previousYear = await prisma.calendarYear.findFirst({
      where: {
        hostelId,
        isActive: false,
        endDate: { lt: calendarYear.startDate },
      },
      orderBy: { endDate: "desc" },
    });

    let revenueGrowth: number | undefined;
    let occupancyGrowth: number | undefined;

    if (previousYear) {
      const previousYearReport = await generateCalendarYearReport(
        hostelId,
        previousYear.id,
      );
      if (previousYearReport.totalRevenue > 0) {
        revenueGrowth = Number(
          totalRevenue
            .div(previousYearReport.totalRevenue)
            .minus(1)
            .mul(100)
            .toFixed(2),
        );
      }
      if (previousYearReport.occupancyRate > 0) {
        occupancyGrowth = Number(
          new Decimal(roomMetrics.occupancyRate)
            .div(previousYearReport.occupancyRate)
            .minus(1)
            .mul(100)
            .toFixed(2),
        );
      }
    }

    const historicalRevenue = historicalRevenueTotals.reduce(
      (sum, value) => new Decimal(sum).plus(value).toNumber(),
      0,
    );

    return {
      calendarYearId: calendarYear.id,
      calendarYearName: calendarYear.name,
      startDate: calendarYear.startDate,
      endDate: calendarYear.endDate,
      isActive: calendarYear.isActive,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpectedRevenue: Number(totalExpectedRevenue.toFixed(2)),
      totalPayments,
      averagePaymentAmount,
      collectionRate,
      totalResidents,
      averageRevenuePerResident,
      totalRooms: roomMetrics.totalRooms,
      activeRooms: roomMetrics.activeRooms,
      occupiedRooms: roomMetrics.occupiedRooms,
      occupancyRate: roomMetrics.occupancyRate,
      averageRoomPrice: roomMetrics.averageRoomPrice,
      historicalResidents: historicalResidents.length,
      historicalRevenue,
      paymentMethods,
      monthlyStats,
      revenueGrowth,
      occupancyGrowth,
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
        calendarYearId,
        deletedAt: null,
        status: { in: VALID_PAYMENT_STATUSES },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const monthlyMap = new Map<
      string,
      { revenue: Decimal; payments: number; newResidents: number }
    >();

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

    payments.forEach((payment) => {
      const month = payment.createdAt.toLocaleString("en-US", { month: "long" });
      const existing = monthlyMap.get(month) || {
        revenue: new Decimal(0),
        payments: 0,
        newResidents: 0,
      };
      monthlyMap.set(month, {
        revenue: existing.revenue.plus(payment.amount ?? 0),
        payments: existing.payments + 1,
        newResidents: existing.newResidents,
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
