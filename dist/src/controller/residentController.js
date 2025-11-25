"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyResidentCodeController = exports.assignRoomToResidentController = exports.addResidentFromHostelController = exports.getAllresidentsForHostel = exports.getDebtorsForHostel = exports.getAlldebtors = exports.deleteResidentController = exports.updateResidentController = exports.getResidentByEmailController = exports.getResidentByIdController = exports.getAllResidentsController = exports.registerResidentController = void 0;
const residentHelper = __importStar(require("../helper/residentHelper")); // Assuming your helper functions are in this file
const http_status_1 = require("../utils/http-status");
const formatPrisma_1 = require("../utils/formatPrisma");
// Register a Resident
const registerResidentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const residentData = req.body; // Get resident data from the request body
    try {
        const newResident = yield residentHelper.register(residentData);
        res.status(http_status_1.HttpStatus.CREATED).json({
            message: "Resident registered successfully",
            data: newResident,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.registerResidentController = registerResidentController;
// Get All Residents
const getAllResidentsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const residents = yield residentHelper.getAllResident();
        res.status(http_status_1.HttpStatus.OK).json({
            message: "Residents fetched successfully",
            data: residents,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.getAllResidentsController = getAllResidentsController;
// Get Resident by ID
const getResidentByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { residentId } = req.params;
    try {
        const resident = yield residentHelper.getResidentById(residentId);
        res.status(http_status_1.HttpStatus.OK).json({
            message: "Resident fetched successfully ID",
            data: resident,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.getResidentByIdController = getResidentByIdController;
// Get Resident by Email
const getResidentByEmailController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.params;
    try {
        const resident = yield residentHelper.getResidentByEmail(email);
        res.status(http_status_1.HttpStatus.OK).json({
            message: "Resident fetched successfully email",
            data: resident,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.getResidentByEmailController = getResidentByEmailController;
// Update a Resident
const updateResidentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { residentId } = req.params;
    const residentData = req.body;
    try {
        const updatedResident = yield residentHelper.updateResident(residentId, residentData);
        res.status(http_status_1.HttpStatus.OK).json({
            message: "Resident updated successfully",
            data: updatedResident,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.updateResidentController = updateResidentController;
// Delete a Resident
const deleteResidentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { residentId } = req.params;
    try {
        yield residentHelper.deleteResident(residentId);
        res.status(http_status_1.HttpStatus.OK).json({
            message: "Resident deleted successfully",
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.deleteResidentController = deleteResidentController;
const getAlldebtors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const debtors = yield residentHelper.getDebtors();
        if (debtors.length === 0) {
            console.log("No debtors found with balance owed greater than 0");
        }
        res
            .status(http_status_1.HttpStatus.OK)
            .json({ message: "debtors fetched successfully", data: debtors });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.getAlldebtors = getAlldebtors;
const getDebtorsForHostel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { hostelId } = req.params;
    try {
        const debtors = yield residentHelper.getDebtorsForHostel(hostelId);
        res
            .status(http_status_1.HttpStatus.OK)
            .json({ message: "debors fected successfully", data: debtors });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.getDebtorsForHostel = getDebtorsForHostel;
const getAllresidentsForHostel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { hostelId } = req.params;
    try {
        const residents = yield residentHelper.getAllresidentsForHostel(hostelId);
        res
            .status(http_status_1.HttpStatus.OK)
            .json({ message: "residents fecthed successfully", data: residents });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.getAllresidentsForHostel = getAllresidentsForHostel;
const addResidentFromHostelController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const residentData = req.body; // Get resident data from the request body
    try {
        const newResident = yield residentHelper.addResidentFromHostel(residentData);
        res.status(http_status_1.HttpStatus.CREATED).json({
            message: "Resident registered successfully",
            data: newResident,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.addResidentFromHostelController = addResidentFromHostelController;
const assignRoomToResidentController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { residentId } = req.params;
    const { roomId } = req.body;
    try {
        const updatedResident = yield residentHelper.assignRoomToResident(residentId, roomId);
        res.status(http_status_1.HttpStatus.OK).json({
            message: "Room assigned to resident successfully",
            data: updatedResident,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.assignRoomToResidentController = assignRoomToResidentController;
const verifyResidentCodeController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    try {
        const verifiedResident = yield residentHelper.verifyResidentCode(code);
        res.status(http_status_1.HttpStatus.OK).json({
            message: "Resident code verified successfully",
            data: verifiedResident,
        });
    }
    catch (error) {
        const err = (0, formatPrisma_1.formatPrismaError)(error); // Ensure this function is used
        res.status(err.status).json({ message: err.message });
    }
});
exports.verifyResidentCodeController = verifyResidentCodeController;
