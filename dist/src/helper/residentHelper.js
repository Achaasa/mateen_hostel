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
exports.verifyResidentCode = exports.assignRoomToResident = exports.addResidentFromHostel = exports.getAllresidentsForHostel = exports.getDebtorsForHostel = exports.getDebtors = exports.deleteResident = exports.updateResident = exports.getResidentByEmail = exports.getResidentById = exports.getAllResident = exports.register = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const http_error_1 = __importDefault(require("../utils/http-error"));
const http_status_1 = require("../utils/http-status");
const bcrypt_1 = require("../utils/bcrypt");
const residentSchema_1 = require("../zodSchema/residentSchema");
const formatPrisma_1 = require("../utils/formatPrisma");
const register = (residentData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const validateResident = residentSchema_1.residentSchema.safeParse(residentData);
        if (!validateResident.success) {
            const errors = validateResident.error.issues.map(({ message, path }) => `${path}: ${message}`);
            throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, errors.join(". "));
        }
        const { roomId } = residentData;
        if (!roomId) {
            throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, "Room was not is provided.");
        }
        const existingRoom = yield prisma_1.default.room.findUnique({
            where: { id: roomId },
        });
        if (!existingRoom) {
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Room not found.");
        }
        if (existingRoom.gender !== "mix" &&
            existingRoom.gender !== residentData.gender) {
            throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Room gender does not match resident's gender.`);
        }
        const currentResidentsCount = yield prisma_1.default.residentProfile.count({
            where: { roomId: residentData.roomId },
        });
        if (currentResidentsCount >= existingRoom.maxCap) {
            throw new http_error_1.default(http_status_1.HttpStatus.CONFLICT, "Room has reached its maximum capacity.");
        }
        const hashed = yield (0, bcrypt_1.hashPassword)(residentData.password);
        const user = yield prisma_1.default.user.create({
            data: {
                email: residentData.email,
                password: hashed,
                firstName: residentData.firstName,
                lastName: residentData.lastName,
                gender: residentData.gender,
                phone: (_a = residentData.phone) !== null && _a !== void 0 ? _a : null,
                role: "resident",
            },
        });
        const newProfile = yield prisma_1.default.residentProfile.create({
            data: {
                userId: user.id,
                hostelId: (_b = residentData.hostelId) !== null && _b !== void 0 ? _b : null,
                roomId,
                studentId: (_c = residentData.studentId) !== null && _c !== void 0 ? _c : null,
                course: (_d = residentData.course) !== null && _d !== void 0 ? _d : null,
                status: "active",
                checkInDate: (_e = residentData.checkInDate) !== null && _e !== void 0 ? _e : null,
                checkOutDate: (_f = residentData.checkOutDate) !== null && _f !== void 0 ? _f : null,
            },
            include: { room: true, user: true },
        });
        return newProfile;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.register = register;
const getAllResident = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residents = yield prisma_1.default.residentProfile.findMany({
            include: { room: { include: { hostel: true } }, user: true },
        });
        return residents;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.getAllResident = getAllResident;
const getResidentById = (residentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resident = yield prisma_1.default.residentProfile.findUnique({
            where: { id: residentId },
            include: { room: true, user: true },
        });
        if (!resident) {
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Resident not found.");
        }
        return resident;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.getResidentById = getResidentById;
const getResidentByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { email },
            include: { residentProfile: { include: { room: true } } },
        });
        const resident = user === null || user === void 0 ? void 0 : user.residentProfile;
        if (!resident) {
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Resident not found.");
        }
        return resident;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.getResidentByEmail = getResidentByEmail;
const updateResident = (residentId, residentData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const validateResident = residentSchema_1.updateResidentSchema.safeParse(residentData);
        if (!validateResident.success) {
            const errors = validateResident.error.issues.map(({ message, path }) => `${path}: ${message}`);
            throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, errors.join(". "));
        }
        const resident = yield prisma_1.default.residentProfile.findUnique({
            where: { id: residentId },
        });
        if (!resident) {
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "resident not found");
        }
        const updatedResident = yield prisma_1.default.residentProfile.update({
            where: { id: residentId },
            data: {
                hostelId: (_a = residentData.hostelId) !== null && _a !== void 0 ? _a : resident.hostelId,
                roomId: (_b = residentData.roomId) !== null && _b !== void 0 ? _b : resident.roomId,
                studentId: (_c = residentData.studentId) !== null && _c !== void 0 ? _c : resident.studentId,
                course: (_d = residentData.course) !== null && _d !== void 0 ? _d : resident.course,
                roomNumber: (_e = residentData.roomNumber) !== null && _e !== void 0 ? _e : resident.roomNumber,
                status: (_f = residentData.status) !== null && _f !== void 0 ? _f : resident.status,
                checkInDate: (_g = residentData.checkInDate) !== null && _g !== void 0 ? _g : resident.checkInDate,
                checkOutDate: (_h = residentData.checkOutDate) !== null && _h !== void 0 ? _h : resident.checkOutDate,
            },
        });
        return updatedResident;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.updateResident = updateResident;
const deleteResident = (residentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const findResident = yield prisma_1.default.residentProfile.findUnique({
            where: { id: residentId },
            include: { room: true },
        });
        if (!findResident) {
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Resident not found");
        }
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.payment.updateMany({
                where: { residentProfileId: residentId },
                data: { residentProfileId: null },
            });
            yield tx.residentProfile.delete({ where: { id: residentId } });
            if (findResident.roomId) {
                const currentCount = yield tx.residentProfile.count({ where: { roomId: findResident.roomId } });
                yield tx.room.update({
                    where: { id: findResident.roomId },
                    data: {
                        currentResidentCount: currentCount,
                        status: currentCount >= 1 ? "occupied" : "available",
                    },
                });
            }
            return { archived: false };
        }));
        return result;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.deleteResident = deleteResident;
const getDebtors = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const debtorRefs = yield prisma_1.default.payment.findMany({
            where: { status: "confirmed", balanceOwed: { gt: 0 } },
            select: { residentProfileId: true },
            distinct: ["residentProfileId"],
        });
        const ids = debtorRefs
            .map((d) => d.residentProfileId)
            .filter((x) => !!x);
        if (ids.length === 0)
            return [];
        const debtors = yield prisma_1.default.residentProfile.findMany({ where: { id: { in: ids } }, include: { room: true, user: true } });
        return debtors;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.getDebtors = getDebtors;
const getDebtorsForHostel = (hostelId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const debtorRefs = yield prisma_1.default.payment.findMany({
            where: { status: "confirmed", balanceOwed: { gt: 0 }, residentProfile: { room: { hostelId } } },
            select: { residentProfileId: true },
            distinct: ["residentProfileId"],
        });
        const ids = debtorRefs
            .map((d) => d.residentProfileId)
            .filter((x) => !!x);
        if (ids.length === 0)
            return [];
        const debtors = yield prisma_1.default.residentProfile.findMany({ where: { id: { in: ids } }, include: { room: true, user: true } });
        return debtors;
    }
    catch (error) {
        const err = error;
        throw new http_error_1.default(err.status || http_status_1.HttpStatus.INTERNAL_SERVER_ERROR, err.message || "Error fetching debtors");
    }
});
exports.getDebtorsForHostel = getDebtorsForHostel;
const getAllresidentsForHostel = (hostelId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residents = yield prisma_1.default.residentProfile.findMany({
            where: {
                OR: [
                    { room: { hostelId } },
                    { hostelId },
                ],
            },
            include: { room: true, user: true },
        });
        return residents;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.getAllresidentsForHostel = getAllresidentsForHostel;
const addResidentFromHostel = (residentData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateResident = residentSchema_1.residentSchema.safeParse(residentData);
        if (!validateResident.success) {
            const errors = validateResident.error.issues.map(({ message, path }) => `${path}: ${message}`);
            throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, errors.join(". "));
        }
        return yield (0, exports.register)(residentData);
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.addResidentFromHostel = addResidentFromHostel;
const assignRoomToResident = (residentId, roomId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const resident = yield prisma_1.default.residentProfile.findUnique({
            where: { id: residentId },
            include: { user: true },
        });
        if (!resident) {
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Resident not found.");
        }
        const room = yield prisma_1.default.room.findUnique({ where: { id: roomId } });
        if (!room) {
            throw new http_error_1.default(http_status_1.HttpStatus.NOT_FOUND, "Room not found.");
        }
        if (room.gender !== "mix" && room.gender !== ((_a = resident.user) === null || _a === void 0 ? void 0 : _a.gender)) {
            throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Room gender does not match resident's gender.`);
        }
        if (resident.hostelId !== room.hostelId) {
            throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, `Resident and room do not belong to the same hostel.`);
        }
        const currentResidentsCount = yield prisma_1.default.residentProfile.count({
            where: { roomId: (_b = resident.roomId) !== null && _b !== void 0 ? _b : undefined },
        });
        if (currentResidentsCount >= room.maxCap) {
            throw new http_error_1.default(http_status_1.HttpStatus.CONFLICT, "Room has reached its maximum capacity.");
        }
        const assignResident = yield prisma_1.default.residentProfile.update({
            where: { id: residentId },
            data: { roomId },
            include: { room: true, user: true },
        });
        return assignResident;
    }
    catch (error) {
        throw (0, formatPrisma_1.formatPrismaError)(error);
    }
});
exports.assignRoomToResident = assignRoomToResident;
const verifyResidentCode = (_code) => __awaiter(void 0, void 0, void 0, function* () {
    throw new http_error_1.default(http_status_1.HttpStatus.BAD_REQUEST, "Verification code is not supported");
});
exports.verifyResidentCode = verifyResidentCode;
