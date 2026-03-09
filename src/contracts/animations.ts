import { z } from "zod";

import { apiErrorSchema } from "@/contracts/common";

export const createAnimationShareRequestSchema = z.object({
  threadId: z.string().trim().min(1),
  taskId: z.string().trim().min(1).optional(),
});

export const createAnimationShareSuccessResponseSchema = z.object({
  ok: z.literal(true),
  item: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
  }),
});

export const createAnimationShareResponseSchema = z.union([createAnimationShareSuccessResponseSchema, apiErrorSchema]);
