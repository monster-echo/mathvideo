import { z } from "zod";

import { apiErrorSchema } from "@/contracts/common";

export const leadRequestSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱").max(320).transform((value) => value.toLowerCase()),
  source: z.string().trim().min(1).max(64).default("unknown"),
  segment: z.string().trim().min(1).max(64).default("general"),
  message: z.string().trim().max(500).default(""),
});

export const leadSuccessResponseSchema = z.object({
  ok: z.literal(true),
});

export const leadResponseSchema = z.union([leadSuccessResponseSchema, apiErrorSchema]);

export type LeadRequest = z.infer<typeof leadRequestSchema>;
