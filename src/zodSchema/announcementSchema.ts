import { z } from "zod";

export const createAnnouncementSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    type: z.string().default("general"),
});

export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>;
