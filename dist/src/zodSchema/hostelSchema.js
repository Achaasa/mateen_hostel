"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHostelSchema = exports.hostelSchema = void 0;
const zod_1 = require("zod");
// Schema to create a new hostel
exports.hostelSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: "The hostel name is required" })
        .trim()
        .min(1, { message: "Hostel name can't be empty" }),
    description: zod_1.z
        .string({ required_error: "Description is needed" })
        .trim()
        .min(1, { message: "Description can't be empty" })
        .optional(),
    address: zod_1.z
        .string({ required_error: "The address is required" })
        .trim()
        .min(1, { message: "Address can't be empty" }),
    location: zod_1.z
        .string({ required_error: "Location is required" })
        .trim()
        .min(1, { message: "Location can't be empty" }),
    manager: zod_1.z
        .string({ required_error: "Manager's name is required" })
        .trim()
        .min(1, { message: "Manager's name can't be empty" }),
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email({ message: "Email must be a valid email address" })
        .min(1, { message: "Email can't be empty" }),
    phone: zod_1.z
        .string({ required_error: "Phone number is required" })
        .min(1, { message: "Phone number can't be empty" }),
});
// Schema for updating a hostel (all fields are optional)
exports.updateHostelSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: "Hostel name is required" })
        .trim()
        .min(1, { message: "Hostel name can't be empty" })
        .optional(),
    description: zod_1.z
        .string({ required_error: "Description is needed" })
        .trim()
        .min(1, { message: "Description can't be empty" })
        .optional(),
    address: zod_1.z
        .string({ required_error: "The address is required" })
        .trim()
        .min(1, { message: "Address can't be empty" })
        .optional(),
    location: zod_1.z
        .string({ required_error: "Location is required" })
        .trim()
        .min(1, { message: "Location can't be empty" })
        .optional(),
    manager: zod_1.z
        .string({ required_error: "Manager's name is required" })
        .trim()
        .min(1, { message: "Manager's name can't be empty" })
        .optional(),
    email: zod_1.z
        .string({ required_error: "Email is required" })
        .email({ message: "Email must be a valid email address" })
        .min(1, { message: "Email can't be empty" })
        .optional(),
    phone: zod_1.z
        .string({ required_error: "Phone number is required" })
        .min(1, { message: "Phone number can't be empty" })
        .optional(),
});
