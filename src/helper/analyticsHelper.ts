import prisma from "../utils/prisma";
import { HttpStatus } from "../utils/http-status";
import HttpException from "../utils/http-error";
import { formatPrismaError } from "../utils/formatPrisma";
import { Room, Resident, Payment } from "@prisma/client";

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
    activeRooms > 0 ? (occupiedRooms / activeRooms) * 100 : 0;
  const expectedIncome = rooms.reduce(
    (sum, room) => sum + (room.price ?? 0),
    0,
  );
  const averageRoomPrice =
    totalRooms > 0
      ? rooms.reduce((sum, room) => sum + (room.price ?? 0), 0) / totalRooms
      : 0;
  return {
    totalRooms,
    activeRooms,
    occupiedRooms,
    occupancyRate,
    expectedIncome,
    averageRoomPrice,
  };
};

// Helper: Resident metrics
const calculateResidentMetrics = (
  residents: (Resident & { payments: Payment[] })[],
) => {
  let totalRevenue = 0;
  let totalDebt = 0;
  let totalPayments = 0;
  let totalPaymentAmount = 0;

  residents.forEach((resident) => {
    const confirmedPayments = (resident.payments || []).filter((payment) =>
      VALID_PAYMENT_STATUSES.includes(
        payment.status as (typeof VALID_PAYMENT_STATUSES)[number],
      ),
    );
    totalPayments += confirmedPayments.length;
    totalPaymentAmount += confirmedPayments.reduce(
      (sum, payment) => sum + (payment.amount ?? 0),
      0,
    );
    totalRevenue += resident.amountPaid ?? 0;
    totalDebt += resident.balanceOwed ?? 0;
  });

  const totalResidents = residents.length;
  const totalDebtors = residents.filter((r) => (r.balanceOwed ?? 0) > 0).length;
  const debtorsPercentage =
    totalResidents > 0 ? (totalDebtors / totalResidents) * 100 : 0;
  const averageDebtPerResident =
    totalDebtors > 0 ? totalDebt / totalDebtors : 0;

  return {
    totalRevenue,
    totalDebt,
    totalPayments,
    totalPaymentAmount,
    totalResidents,
    totalDebtors,
    debtorsPercentage,
    averageDebtPerResident,
  };
};

// Helper: Payment metrics (for any array of payments)
const calculatePaymentMetrics = (payments: Payment[]) => {
  const confirmedPayments = payments.filter((payment) =>
    VALID_PAYMENT_STATUSES.includes(
      payment.status as (typeof VALID_PAYMENT_STATUSES)[number],
    ),
  );
  const totalPayments = confirmedPayments.length;
  const totalPaymentAmount = confirmedPayments.reduce(
    (sum, payment) => sum + (payment.amount ?? 0),
    0,
  );
  const averagePaymentAmount =
    totalPayments > 0 ? totalPaymentAmount / totalPayments : 0;
  return { totalPayments, totalPaymentAmount, averagePaymentAmount };
};

// HOSTEL ANALYTICS
export const generateHostelAnalytics = async (
  hostelId: string,
): Promise<HostelAnalytics> => {
  try {
    // Fetch hostel with all related entities
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
          select: { id: true, amountPaid: true, balanceOwed: true },
        },
        CalendarYear: { where: { isActive: true }, select: { id: true } },
      },
    });

    if (!hostel)
      throw new HttpException(HttpStatus.NOT_FOUND, "Hostel not found");

    // Get all related IDs
    const roomIds = hostel.Rooms.map((r) => r.id);
    const residentIds = hostel.resident.map((r) => r.id);
    const calendarYearIds = hostel.CalendarYear.map((cy) => cy.id);

    // Fetch all payments related to this hostel
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

    // Room and resident metrics
    const roomMetrics = calculateRoomMetrics(hostel.Rooms as Room[]);
    const totalResidents = hostel.resident.length;
    const totalDebtors = hostel.resident.filter(
      (r) => (r.balanceOwed ?? 0) > 0,
    ).length;
    const debtorsPercentage =
      totalResidents > 0 ? (totalDebtors / totalResidents) * 100 : 0;
    const totalDebt = hostel.resident.reduce(
      (sum, r) => sum + (r.balanceOwed ?? 0),
      0,
    );
    const totalRevenue = hostel.resident.reduce(
      (sum, r) => sum + (r.amountPaid ?? 0),
      0,
    );
    const averageDebtPerResident =
      totalDebtors > 0 ? totalDebt / totalDebtors : 0;

    // Payment metrics
    const paymentMetrics = calculatePaymentMetrics(payments);

    const debtPercentage =
      roomMetrics.expectedIncome > 0
        ? (totalDebt / roomMetrics.expectedIncome) * 100
        : 0;

    return {
      totalRevenue,
      totalDebt,
      debtPercentage,
      expectedIncome: roomMetrics.expectedIncome,
      totalPayments: paymentMetrics.totalPayments,
      averagePaymentAmount: paymentMetrics.averagePaymentAmount,
      occupancyRate: roomMetrics.occupancyRate,
      totalRooms: roomMetrics.totalRooms,
      activeRooms: roomMetrics.activeRooms,
      occupiedRooms: roomMetrics.occupiedRooms,
      totalResidents,
      totalDebtors,
      debtorsPercentage,
      averageDebtPerResident,
      totalStaff: hostel.Staffs.length,
      averageRoomPrice: roomMetrics.averageRoomPrice,
      currentYearStats: {
        totalPayments: paymentMetrics.totalPayments,
        expectedRevenue: roomMetrics.expectedIncome,
        collectedRevenue: totalRevenue,
        outstandingAmount: totalDebt,
      },
    };
  } catch (error) {
    throw formatPrismaError(error);
  }
};

// SYSTEM ANALYTICS
export const generateSystemAnalytics = async (): Promise<SystemAnalytics> => {
  try {
    // Fetch all hostels and all payments in the system
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
            select: { id: true, amountPaid: true, balanceOwed: true },
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

    // Aggregate system-wide metrics
    let systemMetrics = {
      totalRooms: 0,
      activeRooms: 0,
      occupiedRooms: 0,
      totalRevenue: 0,
      totalDebt: 0,
      totalResidents: 0,
      totalDebtors: 0,
      totalStaff: 0,
      expectedIncome: 0,
    };

    hostels.forEach((hostel) => {
      const roomMetrics = calculateRoomMetrics(hostel.Rooms as Room[]);
      systemMetrics.totalRooms += roomMetrics.totalRooms;
      systemMetrics.activeRooms += roomMetrics.activeRooms;
      systemMetrics.occupiedRooms += roomMetrics.occupiedRooms;
      systemMetrics.expectedIncome += roomMetrics.expectedIncome;
      systemMetrics.totalRevenue += hostel.resident.reduce(
        (sum, r) => sum + (r.amountPaid ?? 0),
        0,
      );
      systemMetrics.totalDebt += hostel.resident.reduce(
        (sum, r) => sum + (r.balanceOwed ?? 0),
        0,
      );
      systemMetrics.totalResidents += hostel.resident.length;
      systemMetrics.totalDebtors += hostel.resident.filter(
        (r) => (r.balanceOwed ?? 0) > 0,
      ).length;
      systemMetrics.totalStaff += hostel.Staffs.length;
    });

    // Payment metrics (system-wide)
    const paymentMetrics = calculatePaymentMetrics(allPayments);

    const debtPercentage =
      systemMetrics.expectedIncome > 0
        ? (systemMetrics.totalDebt / systemMetrics.expectedIncome) * 100
        : 0;
    const occupancyRate =
      systemMetrics.activeRooms > 0
        ? (systemMetrics.occupiedRooms / systemMetrics.activeRooms) * 100
        : 0;
    const averageRoomPrice =
      systemMetrics.totalRooms > 0
        ? systemMetrics.expectedIncome / systemMetrics.totalRooms
        : 0;
    const debtorsPercentage =
      systemMetrics.totalResidents > 0
        ? (systemMetrics.totalDebtors / systemMetrics.totalResidents) * 100
        : 0;
    const averageDebtPerResident =
      systemMetrics.totalDebtors > 0
        ? systemMetrics.totalDebt / systemMetrics.totalDebtors
        : 0;

    return {
      totalRevenue: systemMetrics.totalRevenue,
      totalDebt: systemMetrics.totalDebt,
      debtPercentage,
      expectedIncome: systemMetrics.expectedIncome,
      totalPayments: paymentMetrics.totalPayments,
      averagePaymentAmount: paymentMetrics.averagePaymentAmount,
      occupancyRate,
      totalRooms: systemMetrics.totalRooms,
      activeRooms: systemMetrics.activeRooms,
      occupiedRooms: systemMetrics.occupiedRooms,
      totalResidents: systemMetrics.totalResidents,
      totalDebtors: systemMetrics.totalDebtors,
      debtorsPercentage,
      averageDebtPerResident,
      totalStaff: systemMetrics.totalStaff,
      averageRoomPrice,
      currentYearStats: {
        totalPayments: paymentMetrics.totalPayments,
        expectedRevenue: systemMetrics.expectedIncome,
        collectedRevenue: systemMetrics.totalRevenue,
        outstandingAmount: systemMetrics.totalDebt,
      },
      totalHostels: hostels.length,
      verifiedHostels: hostels.filter((h) => h.isVerifeid).length,
      unverifiedHostels: hostels.filter((h) => !h.isVerifeid).length,
      publishedHostels: hostels.filter((h) => h.state === "PUBLISHED").length,
      averageOccupancyRate: occupancyRate,
      systemWideDebtPercentage: debtPercentage,
      activeCalendarYears,
    };
  } catch (error) {
    throw formatPrismaError(error);
  }
};
