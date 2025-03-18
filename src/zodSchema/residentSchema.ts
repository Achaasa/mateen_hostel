import { z } from "zod";

// Schema for creating a new Resident
export const residentSchema = z.object({
  name: z
    .string({ required_error: "The resident name is required" })
    .trim()
    .min(1, { message: "Name can't be empty" }),

  studentId: z
    .string({ required_error: "Student ID is required" })
    .trim()
    .min(1, { message: "Student ID can't be empty" }),

  course: z
    .string({ required_error: "Course is required" })
    .trim()
    .min(1, { message: "Course can't be empty" }),

  phone: z
    .string({ required_error: "Phone number is required" })
    .min(1, { message: "Phone number can't be empty" }),

  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Email must be a valid email address" })
    .min(1, { message: "Email can't be empty" }),

  emergencyContactName: z
    .string({ required_error: "Emergency contact name is required" })
    .trim()
    .min(1, { message: "Emergency contact name can't be empty" }),

  emergencyContactPhone: z
    .string({ required_error: "Emergency contact phone number is required" })
    .min(1, { message: "Emergency contact phone number can't be empty" }),

  relationship: z
    .string({ required_error: "Relationship to emergency contact is required" })
    .trim()
    .min(1, { message: "Relationship can't be empty" }),

  roomId: z
    .string({ required_error: "Room ID is required" })
    .trim()
    .min(1, { message: "Room ID can't be empty" }).optional(),
});

// Schema for updating a Resident (all fields are optional)
export const updateResidentSchema = z.object({
  name: z
    .string({ required_error: "Resident name is required" })
    .trim()
    .min(1, { message: "Name can't be empty" })
    .optional(),

  studentId: z
    .string({ required_error: "Student ID is required" })
    .trim()
    .min(1, { message: "Student ID can't be empty" })
    .optional(),

  course: z
    .string({ required_error: "Course is required" })
    .trim()
    .min(1, { message: "Course can't be empty" })
    .optional(),

  phone: z
    .string({ required_error: "Phone number is required" })
    .min(1, { message: "Phone number can't be empty" })
    .optional(),

  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Email must be a valid email address" })
    .min(1, { message: "Email can't be empty" })
    .optional(),

  emergencyContactName: z
    .string({ required_error: "Emergency contact name is required" })
    .trim()
    .min(1, { message: "Emergency contact name can't be empty" })
    .optional(),

  emergencyContactPhone: z
    .string({ required_error: "Emergency contact phone number is required" })
    .min(1, { message: "Emergency contact phone number can't be empty" })
    .optional(),

  relationship: z
    .string({ required_error: "Relationship to emergency contact is required" })
    .trim()
    .min(1, { message: "Relationship can't be empty" })
    .optional(),

  roomId: z
    .string({ required_error: "Room ID is required" })
    .trim()
    .min(1, { message: "Room ID can't be empty" })
    .optional(),
});

// Types to infer the data structures
export type ResidentRequestDto = z.infer<typeof residentSchema>;
export type UpdateResidentRequestDto = z.infer<typeof updateResidentSchema>;
