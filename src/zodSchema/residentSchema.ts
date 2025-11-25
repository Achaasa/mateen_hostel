import { z } from "zod";

// Enums to match Prisma schema
export const GenderEnum = z.enum(["male", "female", "other"]);
export const ResidentStatusEnum = z.enum(["active", "checked_out", "banned"]);

type Gender = z.infer<typeof GenderEnum>;
type ResidentStatus = z.infer<typeof ResidentStatusEnum>;

// Base schema for common resident fields
const baseResidentSchema = {
  studentId: z
    .string({ required_error: "Student ID is required" })
    .trim()
    .min(1, { message: "Student ID can't be empty" }),

  course: z
    .string({ required_error: "Course is required" })
    .trim()
    .min(1, { message: "Course can't be empty" })
    .optional(),

  roomId: z
    .string({ required_error: "Room ID is required" })
    .trim()
    .min(1, { message: "Room ID can't be empty" })
    .optional(),

  gender: GenderEnum.optional(),
  status: ResidentStatusEnum.optional(),
  checkInDate: z.coerce.date().optional(),
  checkOutDate: z.coerce.date().optional()
};

// Schema for creating a new Resident
export const residentSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .trim()
    .min(1, { message: "First name can't be empty" }),

  lastName: z
    .string({ required_error: "Last name is required" })
    .trim()
    .min(1, { message: "Last name can't be empty" }),

  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Email must be a valid email address" })
    .min(1, { message: "Email can't be empty" }),

  phone: z
    .string({ required_error: "Phone number is required" })
    .min(1, { message: "Phone number can't be empty" })
    .optional(),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" }),

  ...baseResidentSchema,

  // Additional fields for resident profile
  hostelId: z
    .string({ required_error: "Hostel ID is required" })
    .trim()
    .min(1, { message: "Hostel ID can't be empty" })
    .optional(),
});

// Schema for updating a Resident (all fields are optional)
export const updateResidentSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name can't be empty" })
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name can't be empty" })
    .optional(),

  email: z
    .string()
    .email({ message: "Email must be a valid email address" })
    .min(1, { message: "Email can't be empty" })
    .optional(),

  phone: z
    .string()
    .min(1, { message: "Phone number can't be empty" })
    .optional(),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .optional(),

  ...Object.fromEntries(
    Object.entries(baseResidentSchema).map(([key, schema]) => [
      key,
      schema.isOptional() ? schema : schema.optional()
    ])
  )
});

// Types to infer the data structures
export type ResidentRequestDto = z.infer<typeof residentSchema>;
export type UpdateResidentRequestDto = z.infer<typeof updateResidentSchema>;

export type { Gender, ResidentStatus };
