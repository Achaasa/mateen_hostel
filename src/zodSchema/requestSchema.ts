import { z } from "zod";

export const RequestTypeEnum = z.enum([
    "maintenance",
    "room_change",
    "item_replacement",
    "other",
]);

export const PriorityEnum = z.enum(["low", "medium", "high", "critical"]);

export const createMaintenanceRequestSchema = z.object({
    type: RequestTypeEnum,
    subject: z.string().min(1, "Subject is required"),
    description: z.string().min(1, "Description is required"),
    priority: PriorityEnum.optional().default("low"),
    images: z.array(z.string().url()).optional(),
});

export type CreateMaintenanceRequestDto = z.infer<
    typeof createMaintenanceRequestSchema
>;
