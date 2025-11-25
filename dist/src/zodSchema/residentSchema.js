"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateResidentSchema = exports.residentSchema = exports.ResidentStatusEnum = exports.GenderEnum = void 0;
const zod_1 = require("zod");
// Enums to match Prisma schema
exports.GenderEnum = zod_1.z.enum(["male", "female", "other"]);
exports.ResidentStatusEnum = zod_1.z.enum(["active", "checked_out", "banned"]);
// Base schema for common resident fields
const baseResidentSchema = {
    studentId: zod_1.z
        .string({ required_error: "Student ID is required" })
        .trim()
        .min(1, { message: "Student ID can't be empty" }),
    course: zod_1.z
        .string({ required_error: "Course is required" })
        .trim()
        .min(1, { message: "Course can't be empty" })
        .optional(),
    roomId: zod_1.z
        .string({ required_error: "Room ID is required" })
        .trim()
        .min(1, { message: "Room ID can't be empty" })
        .optional(),
    gender: exports.GenderEnum.optional(),
    status: exports.ResidentStatusEnum.optional(),
    checkInDate: zod_1.z.coerce.date().optional(),
    checkOutDate: zod_1.z.coerce.date().optional()
};
// Schema for creating a new Resident
exports.residentSchema = zod_1.z.object(Object.assign(Object.assign({ firstName: zod_1.z
        .string({ required_error: "First name is required" })
        .trim()
        .min(1, { message: "First name can't be empty" }), lastName: zod_1.z
        .string({ required_error: "Last name is required" })
        .trim()
        .min(1, { message: "Last name can't be empty" }), email: zod_1.z
        .string({ required_error: "Email is required" })
        .email({ message: "Email must be a valid email address" })
        .min(1, { message: "Email can't be empty" }), phone: zod_1.z
        .string({ required_error: "Phone number is required" })
        .min(1, { message: "Phone number can't be empty" })
        .optional(), password: zod_1.z
        .string({ required_error: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters long" }) }, baseResidentSchema), { 
    // Additional fields for resident profile
    hostelId: zod_1.z
        .string({ required_error: "Hostel ID is required" })
        .trim()
        .min(1, { message: "Hostel ID can't be empty" })
        .optional() }));
// Schema for updating a Resident (all fields are optional)
exports.updateResidentSchema = zod_1.z.object(Object.assign({ firstName: zod_1.z
        .string()
        .trim()
        .min(1, { message: "First name can't be empty" })
        .optional(), lastName: zod_1.z
        .string()
        .trim()
        .min(1, { message: "Last name can't be empty" })
        .optional(), email: zod_1.z
        .string()
        .email({ message: "Email must be a valid email address" })
        .min(1, { message: "Email can't be empty" })
        .optional(), phone: zod_1.z
        .string()
        .min(1, { message: "Phone number can't be empty" })
        .optional(), password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .optional() }, Object.fromEntries(Object.entries(baseResidentSchema).map(([key, schema]) => [
    key,
    schema.isOptional() ? schema : schema.optional()
]))));
