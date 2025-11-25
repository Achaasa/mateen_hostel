"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCalendarYearReport = exports.getHostelDisbursementSummary = exports.generateSystemAnalytics = exports.generateHostelAnalytics = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const http_status_1 = require("../utils/http-status");
const http_error_1 = __importDefault(require("../utils/http-error"));
const formatPrisma_1 = require("../utils/formatPrisma");
const client_1 = require("@prisma/client");
const decimal_js_1 = __importDefault(require("decimal.js"));
const VALID_PAYMENT_STATUSES = [client_1.PaymentStatus.confirmed];
// Helper: Room metrics
const calculateRoomMetrics = (rooms) => {
    const totalRooms = rooms.length;
    const activeRooms = rooms.filter((room) => room.status !== client_1.RoomStatus.maintenance).length;
    const occupiedRooms = rooms.filter((room) => room.status === client_1.RoomStatus.occupied).length;
    const occupancyRate = activeRooms > 0
        ? Number(new decimal_js_1.default(occupiedRooms).div(activeRooms).mul(100).toFixed(2))
        : 0;
    const expectedIncome = rooms.reduce((sum, room) => { var _a; return new decimal_js_1.default(sum).plus((_a = room.price) !== null && _a !== void 0 ? _a : 0).toNumber(); }, 0);
    const averageRoomPrice = totalRooms > 0
        ? new decimal_js_1.default(rooms.reduce((sum, room) => { var _a; return new decimal_js_1.default(sum).plus((_a = room.price) !== null && _a !== void 0 ? _a : 0).toNumber(); }, 0))
            .div(totalRooms)
            .toFixed(2)
        : 0;
    return {
        totalRooms,
        activeRooms,
        occupiedRooms,
        occupancyRate,
        expectedIncome: Number(new decimal_js_1.default(expectedIncome).toFixed(2)),
        averageRoomPrice: Number(averageRoomPrice),
    };
};
// Helper: Resident metrics
const calculateResidentMetrics = (residents, allPayments) => {
    let totalRevenue = new decimal_js_1.default(0);
    let totalDebt = new decimal_js_1.default(0);
    let totalPayments = 0;
    let totalPaymentAmount = new decimal_js_1.default(0);
    let totalDebtors = 0;
    // Calculate metrics from residents
    residents.forEach((resident) => {
        const confirmedPayments = (resident.payments || []).filter((payment) => payment.status !== null &&
            VALID_PAYMENT_STATUSES.includes(payment.status));
        totalPayments += confirmedPayments.length;
        confirmedPayments.forEach((payment) => {
            var _a, _b;
            totalPaymentAmount = totalPaymentAmount.plus((_a = payment.amount) !== null && _a !== void 0 ? _a : 0);
            totalRevenue = totalRevenue.plus((_b = payment.amount) !== null && _b !== void 0 ? _b : 0);
            if (payment.balanceOwed && payment.balanceOwed > 0) {
                totalDebt = totalDebt.plus(payment.balanceOwed);
                totalDebtors += 1;
            }
        });
    });
    // Include payments with historicalResidentId or no residentProfileId
    const historicalOrStandalonePayments = allPayments.filter((payment) => {
        var _a;
        return !payment.residentProfileId &&
            VALID_PAYMENT_STATUSES.includes((_a = payment.status) !== null && _a !== void 0 ? _a : client_1.PaymentStatus.pending);
    });
    historicalOrStandalonePayments.forEach((payment) => {
        var _a, _b;
        totalPayments += 1;
        totalPaymentAmount = totalPaymentAmount.plus((_a = payment.amount) !== null && _a !== void 0 ? _a : 0);
        totalRevenue = totalRevenue.plus((_b = payment.amount) !== null && _b !== void 0 ? _b : 0);
        if (payment.balanceOwed && payment.balanceOwed > 0) {
            totalDebt = totalDebt.plus(payment.balanceOwed);
        }
    });
    const totalResidents = residents.length;
    const debtorsPercentage = totalResidents > 0
        ? Number(new decimal_js_1.default(totalDebtors).div(totalResidents).mul(100).toFixed(2))
        : 0;
    const averageDebtPerResident = totalDebtors > 0 ? Number(totalDebt.div(totalDebtors).toFixed(2)) : 0;
    const averagePaymentAmount = totalPayments > 0
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
const calculatePaymentMetrics = (payments) => {
    const confirmedPayments = payments.filter((payment) => payment.status !== null &&
        VALID_PAYMENT_STATUSES.includes(payment.status));
    const totalPayments = confirmedPayments.length;
    const totalPaymentAmount = confirmedPayments.reduce((sum, payment) => { var _a; return new decimal_js_1.default(sum).plus((_a = payment.amount) !== null && _a !== void 0 ? _a : 0).toNumber(); }, 0);
    const averagePaymentAmount = totalPayments > 0
        ? new decimal_js_1.default(totalPaymentAmount).div(totalPayments).toFixed(2)
        : 0;
    return {
        totalPayments,
        totalPaymentAmount: new decimal_js_1.default(totalPaymentAmount).toFixed(2),
        averagePaymentAmount: Number(averagePaymentAmount),
    };
};
// HOSTEL ANALYTICS
const generateHostelAnalytics = (hostelId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hostel = yield prisma_1.default.hostel.findUnique({
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
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Hostel not found");
        const roomIds = hostel.rooms.map((r) => r.id);
        const residentIds = hostel.residentProfiles.map((r) => r.id);
        const calendarYearIds = hostel.calendarYears.map((cy) => cy.id);
        const paymentFilters = [];
        if (residentIds.length > 0) {
            paymentFilters.push({ residentProfileId: { in: residentIds } });
        }
        if (roomIds.length > 0) {
            paymentFilters.push({ roomId: { in: roomIds } });
        }
        if (calendarYearIds.length > 0) {
            paymentFilters.push({ calendarYearId: { in: calendarYearIds } });
        }
        const payments = yield prisma_1.default.payment.findMany({
            where: Object.assign({ deletedAt: null, status: { in: VALID_PAYMENT_STATUSES } }, (paymentFilters.length > 0 ? { OR: paymentFilters } : {})),
        });
        const roomMetrics = calculateRoomMetrics(hostel.rooms);
        const residentMetrics = calculateResidentMetrics(hostel.residentProfiles, payments);
        const debtPercentage = Number(roomMetrics.expectedIncome) > 0
            ? Number(new decimal_js_1.default(residentMetrics.totalDebt)
                .div(roomMetrics.expectedIncome)
                .mul(100)
                .toFixed(2))
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
    }
    catch (error) {
        console.error("Error getting Hostel analytics:", error);
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.generateHostelAnalytics = generateHostelAnalytics;
// SYSTEM ANALYTICS
const generateSystemAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [hostels, allPayments, activeCalendarYears] = yield Promise.all([
            prisma_1.default.hostel.findMany({
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
            prisma_1.default.payment.findMany({
                where: {
                    deletedAt: null,
                    status: { in: VALID_PAYMENT_STATUSES },
                },
            }),
            prisma_1.default.calendarYear.count({
                where: { isActive: true },
            }),
        ]);
        let systemMetrics = {
            totalRooms: 0,
            activeRooms: 0,
            occupiedRooms: 0,
            totalRevenue: new decimal_js_1.default(0),
            totalDebt: new decimal_js_1.default(0),
            totalResidents: 0,
            totalDebtors: 0,
            totalStaff: 0,
            expectedIncome: new decimal_js_1.default(0),
        };
        const allResidents = hostels.flatMap((hostel) => hostel.residentProfiles);
        const residentMetrics = calculateResidentMetrics(allResidents, allPayments);
        hostels.forEach((hostel) => {
            const roomMetrics = calculateRoomMetrics(hostel.rooms);
            systemMetrics.totalRooms += roomMetrics.totalRooms;
            systemMetrics.activeRooms += roomMetrics.activeRooms;
            systemMetrics.occupiedRooms += roomMetrics.occupiedRooms;
            systemMetrics.expectedIncome = systemMetrics.expectedIncome.plus(roomMetrics.expectedIncome);
            systemMetrics.totalStaff += hostel.staffProfiles.length;
        });
        const paymentMetrics = calculatePaymentMetrics(allPayments);
        const debtPercentage = Number(systemMetrics.expectedIncome) > 0
            ? Number(new decimal_js_1.default(residentMetrics.totalDebt)
                .div(systemMetrics.expectedIncome)
                .mul(100)
                .toFixed(2))
            : 0;
        const occupancyRate = systemMetrics.activeRooms > 0
            ? Number(new decimal_js_1.default(systemMetrics.occupiedRooms)
                .div(systemMetrics.activeRooms)
                .mul(100)
                .toFixed(2))
            : 0;
        const averageRoomPrice = systemMetrics.totalRooms > 0
            ? systemMetrics.expectedIncome.div(systemMetrics.totalRooms).toFixed(2)
            : 0;
        const debtorsPercentage = residentMetrics.totalResidents > 0
            ? Number(new decimal_js_1.default(residentMetrics.totalDebtors)
                .div(residentMetrics.totalResidents)
                .mul(100)
                .toFixed(2))
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
            publishedHostels: hostels.filter((h) => h.state === client_1.HostelState.published).length,
            averageOccupancyRate: occupancyRate,
            systemWideDebtPercentage: debtPercentage,
            activeCalendarYears,
        };
    }
    catch (error) {
        console.error("Error getting system analytics:", error);
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.generateSystemAnalytics = generateSystemAnalytics;
// HOSTEL DISBURSEMENT SUMMARY
const getHostelDisbursementSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const hostels = yield prisma_1.default.hostel.findMany({
            where: { deletedAt: null },
            select: { id: true, name: true, phone: true, email: true },
        });
        const rooms = yield prisma_1.default.room.findMany({
            where: { deletedAt: null },
            select: { id: true, hostelId: true },
        });
        const roomHostelMap = new Map(rooms.map((room) => [room.id, room.hostelId]));
        const residentProfiles = yield prisma_1.default.residentProfile.findMany({
            select: { id: true, hostelId: true },
        });
        const residentHostelMap = new Map(residentProfiles.map((resident) => { var _a; return [resident.id, (_a = resident.hostelId) !== null && _a !== void 0 ? _a : ""]; }));
        const calendarYears = yield prisma_1.default.calendarYear.findMany({
            where: { isActive: true },
            select: { id: true, hostelId: true },
        });
        const calendarYearHostelMap = new Map(calendarYears.map((cy) => [cy.id, cy.hostelId]));
        const payments = yield prisma_1.default.payment.findMany({
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
        const historicalIds = Array.from(new Set(payments
            .map((payment) => payment.historicalResidentId)
            .filter((id) => Boolean(id))));
        const historicalResidents = historicalIds.length
            ? yield prisma_1.default.historicalResident.findMany({
                where: { id: { in: historicalIds } },
                select: { id: true, roomId: true, residentId: true },
            })
            : [];
        const historicalHostelMap = new Map();
        historicalResidents.forEach((hist) => {
            if (hist.roomId && roomHostelMap.has(hist.roomId)) {
                historicalHostelMap.set(hist.id, roomHostelMap.get(hist.roomId));
            }
            else if (hist.residentId && residentHostelMap.has(hist.residentId)) {
                historicalHostelMap.set(hist.id, residentHostelMap.get(hist.residentId));
            }
        });
        const hostelAmountMap = new Map();
        for (const payment of payments) {
            let hostelId;
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
            if (!hostelId)
                continue;
            hostelAmountMap.set(hostelId, ((_a = hostelAmountMap.get(hostelId)) !== null && _a !== void 0 ? _a : new decimal_js_1.default(0)).plus((_b = payment.amount) !== null && _b !== void 0 ? _b : 0));
        }
        const disbursements = hostels.map((hostel) => {
            var _a;
            return ({
                hostelId: hostel.id,
                name: hostel.name,
                phone: hostel.phone,
                email: hostel.email,
                amountCollected: Number(((_a = hostelAmountMap.get(hostel.id)) !== null && _a !== void 0 ? _a : new decimal_js_1.default(0)).toFixed(2)),
            });
        });
        const totalCollected = disbursements.reduce((sum, entry) => new decimal_js_1.default(sum).plus(entry.amountCollected).toNumber(), 0);
        return {
            totalCollected: Number(new decimal_js_1.default(totalCollected).toFixed(2)),
            disbursements,
        };
    }
    catch (error) {
        console.error("Update Hostel Error:", error);
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.getHostelDisbursementSummary = getHostelDisbursementSummary;
// CALENDAR YEAR REPORT
const generateCalendarYearReport = (hostelId, calendarYearId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const calendarYear = yield prisma_1.default.calendarYear.findUnique({
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
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Calendar year not found");
        }
        const rooms = yield prisma_1.default.room.findMany({
            where: {
                hostelId,
                deletedAt: null,
            },
        });
        const currentResidents = calendarYear.residents;
        const historicalResidents = calendarYear.historicalResidents;
        const standalonePayments = calendarYear.payments.filter((payment) => !payment.residentProfileId && !payment.historicalResidentId);
        let totalRevenue = new decimal_js_1.default(0);
        let totalExpectedRevenue = new decimal_js_1.default(0);
        let totalPayments = 0;
        let totalPaymentAmount = new decimal_js_1.default(0);
        currentResidents.forEach((resident) => {
            var _a, _b;
            const confirmedPayments = resident.payments;
            totalPayments += confirmedPayments.length;
            confirmedPayments.forEach((payment) => {
                var _a, _b;
                totalPaymentAmount = totalPaymentAmount.plus((_a = payment.amount) !== null && _a !== void 0 ? _a : 0);
                totalRevenue = totalRevenue.plus((_b = payment.amount) !== null && _b !== void 0 ? _b : 0);
            });
            totalExpectedRevenue = totalExpectedRevenue.plus((_b = (_a = resident.room) === null || _a === void 0 ? void 0 : _a.price) !== null && _b !== void 0 ? _b : 0);
        });
        const historicalRevenueTotals = [];
        historicalResidents.forEach((histResident) => {
            var _a, _b, _c;
            const confirmedPayments = histResident.payments;
            totalPayments += confirmedPayments.length;
            const histRevenue = confirmedPayments.reduce((sum, payment) => { var _a; return new decimal_js_1.default(sum).plus((_a = payment.amount) !== null && _a !== void 0 ? _a : 0); }, new decimal_js_1.default(0));
            totalPaymentAmount = totalPaymentAmount.plus(histRevenue);
            totalRevenue = totalRevenue.plus(histRevenue);
            totalExpectedRevenue = totalExpectedRevenue.plus((_c = (_a = histResident.roomPrice) !== null && _a !== void 0 ? _a : (_b = histResident.room) === null || _b === void 0 ? void 0 : _b.price) !== null && _c !== void 0 ? _c : 0);
            historicalRevenueTotals.push(Number(histRevenue.toFixed(2)));
        });
        standalonePayments.forEach((payment) => {
            var _a, _b;
            totalPayments += 1;
            totalPaymentAmount = totalPaymentAmount.plus((_a = payment.amount) !== null && _a !== void 0 ? _a : 0);
            totalRevenue = totalRevenue.plus((_b = payment.amount) !== null && _b !== void 0 ? _b : 0);
        });
        const totalResidents = currentResidents.length + historicalResidents.length;
        const collectionRate = Number(totalExpectedRevenue) > 0
            ? Number(totalRevenue
                .div(totalExpectedRevenue)
                .mul(100)
                .toFixed(2))
            : 0;
        const averagePaymentAmount = totalPayments > 0
            ? Number(totalPaymentAmount.div(totalPayments).toFixed(2))
            : 0;
        const averageRevenuePerResident = totalResidents > 0
            ? Number(totalRevenue.div(totalResidents).toFixed(2))
            : 0;
        const roomMetrics = calculateRoomMetrics(rooms);
        const paymentMethodsMap = new Map();
        [...currentResidents, ...historicalResidents].forEach((entity) => {
            entity.payments.forEach((payment) => {
                var _a, _b, _c;
                const method = (_a = payment.method) !== null && _a !== void 0 ? _a : "Unknown";
                const existing = (_b = paymentMethodsMap.get(method)) !== null && _b !== void 0 ? _b : { count: 0, totalAmount: new decimal_js_1.default(0) };
                paymentMethodsMap.set(method, {
                    count: existing.count + 1,
                    totalAmount: existing.totalAmount.plus((_c = payment.amount) !== null && _c !== void 0 ? _c : 0),
                });
            });
        });
        standalonePayments.forEach((payment) => {
            var _a, _b, _c;
            const method = (_a = payment.method) !== null && _a !== void 0 ? _a : "Unknown";
            const existing = (_b = paymentMethodsMap.get(method)) !== null && _b !== void 0 ? _b : { count: 0, totalAmount: new decimal_js_1.default(0) };
            paymentMethodsMap.set(method, {
                count: existing.count + 1,
                totalAmount: existing.totalAmount.plus((_c = payment.amount) !== null && _c !== void 0 ? _c : 0),
            });
        });
        const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, data]) => ({
            method,
            count: data.count,
            totalAmount: Number(data.totalAmount.toFixed(2)),
        }));
        let monthlyStats = undefined;
        if (calendarYear.isActive) {
            monthlyStats = yield generateMonthlyBreakdown(calendarYearId, hostelId);
        }
        const previousYear = yield prisma_1.default.calendarYear.findFirst({
            where: {
                hostelId,
                isActive: false,
                endDate: { lt: calendarYear.startDate },
            },
            orderBy: { endDate: "desc" },
        });
        let revenueGrowth;
        let occupancyGrowth;
        if (previousYear) {
            const previousYearReport = yield (0, exports.generateCalendarYearReport)(hostelId, previousYear.id);
            if (previousYearReport.totalRevenue > 0) {
                revenueGrowth = Number(totalRevenue
                    .div(previousYearReport.totalRevenue)
                    .minus(1)
                    .mul(100)
                    .toFixed(2));
            }
            if (previousYearReport.occupancyRate > 0) {
                occupancyGrowth = Number(new decimal_js_1.default(roomMetrics.occupancyRate)
                    .div(previousYearReport.occupancyRate)
                    .minus(1)
                    .mul(100)
                    .toFixed(2));
            }
        }
        const historicalRevenue = historicalRevenueTotals.reduce((sum, value) => new decimal_js_1.default(sum).plus(value).toNumber(), 0);
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
    }
    catch (error) {
        console.error("Error generating calendar year report:", error);
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.generateCalendarYearReport = generateCalendarYearReport;
// Helper function to generate monthly breakdown
const generateMonthlyBreakdown = (calendarYearId, hostelId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield prisma_1.default.payment.findMany({
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
        const monthlyMap = new Map();
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
                revenue: new decimal_js_1.default(0),
                payments: 0,
                newResidents: 0,
            });
        });
        payments.forEach((payment) => {
            var _a;
            const month = payment.createdAt.toLocaleString("en-US", { month: "long" });
            const existing = monthlyMap.get(month) || {
                revenue: new decimal_js_1.default(0),
                payments: 0,
                newResidents: 0,
            };
            monthlyMap.set(month, {
                revenue: existing.revenue.plus((_a = payment.amount) !== null && _a !== void 0 ? _a : 0),
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
    }
    catch (error) {
        console.error("Error generating monthly breakdown:", error);
        return [];
    }
});
