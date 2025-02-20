import { z } from "zod";
import { StaffRole } from "@prisma/client";
const staffRoleEnum = z.enum([
  "HOSTEL_MANAGER",
  "WARDEN",
 "CHIEF_WARDEN"
]);
const genderEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
const maritalStatusEnum = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]);
const locationEnum = z.enum(["ACCRA", "SUNYANI", "KUMASI"]);
const dateWithTimeValidator = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in the format YYYY-MM-DD")
  .transform((date) => `${date}T00:00:00Z`); // Adding the time part
// Schema for creating a staff member
export const StaffSchema = z.object({
  name: z
    .string({ required_error: "Staff name is required" })
    .trim()
    .min(1, { message: "Staff name can't be empty" }),

  role: staffRoleEnum,

  hostelId: z
    .string({ required_error: "Hostel ID is required" })
    .min(1, { message: "Hostel ID can't be empty" }),

  firstName: z
    .string({ required_error: "First name is required" })
    .trim()
    .min(1, { message: "First name can't be empty" }),

  middleName: z.string().trim().optional(),

  lastName: z
    .string({ required_error: "Last name is required" })
    .trim()
    .min(1, { message: "Last name can't be empty" }),

  dateOfBirth: z.string({ required_error: "Date is required" })
  .trim()
  .min(1, { message: "Date of appointment can't be empty" })
    .optional(),

  nationality: z
    .string({ required_error: "Nationality is required" })
    .trim()
    .min(1, { message: "Nationality can't be empty" }),

  gender: genderEnum,

  religion: z
    .string({ required_error: "Religion is required" })
    .trim()
    .min(1, { message: "Religion can't be empty" }),

  maritalStatus: maritalStatusEnum,

  ghanaCardNumber: z
    .string({ required_error: "Ghana Card Number is required" })
    .trim()
    .min(1, { message: "Ghana Card Number can't be empty" }),

  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .min(1, { message: "Phone number can't be empty" }),

  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Email must be a valid email address" })
    .min(1, { message: "Email can't be empty" }),

  residence: z
    .string({ required_error: "Residence is required" })
    .trim()
    .min(1, { message: "Residence can't be empty" }),

  qualification: z
    .string({ required_error: "Qualification is required" })
    .trim()
    .min(1, { message: "Qualification can't be empty" }),

  block: z
    .string({ required_error: "Block is required" })
    .trim()
    .min(1, { message: "Block can't be empty" }),
  dateOfAppointment: z.string({ required_error: "Date is required" })
  .trim()
  .min(1, { message: "Date of appointment can't be empty" })
    .optional(),
});

// Schema for updating a staff member (all fields are optional)
export const updateStaffSchema = z.object({
  name: z
    .string({ required_error: "Staff name is required" })
    .trim()
    .min(1, { message: "Staff name can't be empty" })
    .optional(),

  role: staffRoleEnum.optional(),

  hostelId: z
    .string({ required_error: "Hostel ID is required" })
    .min(1, { message: "Hostel ID can't be empty" })
    .optional(),

  firstName: z
    .string({ required_error: "First name is required" })
    .trim()
    .min(1, { message: "First name can't be empty" })
    .optional(),

  middleName: z.string().trim().optional(),

  lastName: z
    .string({ required_error: "Last name is required" })
    .trim()
    .min(1, { message: "Last name can't be empty" })
    .optional(),

  dateOfBirth: z
    .string({ required_error: "Date of birth is required" })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date of birth must be in the format YYYY-MM-DD"
    )
    .optional(),

  nationality: z
    .string({ required_error: "Nationality is required" })
    .trim()
    .min(1, { message: "Nationality can't be empty" })
    .optional(),

  gender: genderEnum.optional(),

  religion: z
    .string({ required_error: "Religion is required" })
    .trim()
    .min(1, { message: "Religion can't be empty" })
    .optional(),

  maritalStatus: maritalStatusEnum.optional(),

  ghanaCardNumber: z
    .string({ required_error: "Ghana Card Number is required" })
    .trim()
    .min(1, { message: "Ghana Card Number can't be empty" })
    .optional(),

  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .min(1, { message: "Phone number can't be empty" })
    .optional(),

  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Email must be a valid email address" })
    .min(1, { message: "Email can't be empty" })
    .optional(),

  residence: z
    .string({ required_error: "Residence is required" })
    .trim()
    .min(1, { message: "Residence can't be empty" })
    .optional(),

  qualification: z
    .string({ required_error: "Qualification is required" })
    .trim()
    .min(1, { message: "Qualification can't be empty" })
    .optional(),

  block: z
    .string({ required_error: "Block is required" })
    .trim()
    .min(1, { message: "Block can't be empty" })
    .optional(),

  dateOfAppointment: z
    .string({ required_error: "Date of appointment is required" })
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Date of appointment must be in the format YYYY-MM-DD"
    )
    .optional(),
});

// Types to infer the data structures
export type StaffRequestDto = z.infer<typeof StaffSchema>;
export type UpdateStaffRequestDto = z.infer<typeof updateStaffSchema>;
