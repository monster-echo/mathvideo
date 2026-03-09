import { z } from "zod";

import { paidPlanIdSchema } from "@/contracts/billing";
import { apiErrorSchema, personaSchema } from "@/contracts/common";

export const ahaOfferRequestSchema = z.object({
  persona: personaSchema.default("teacher"),
  trigger: z.string().trim().min(1).max(64).default("download_1080"),
});

export const ahaOfferSchema = z.object({
  headline: z.string().optional(),
  planId: paidPlanIdSchema.optional(),
  planName: z.string().min(1),
  monthly: z.number().optional(),
  yearly: z.number().optional(),
  discount: z.number().optional(),
});

export const ahaOfferSuccessResponseSchema = z.object({
  ok: z.literal(true),
  offer: ahaOfferSchema,
});

export const ahaOfferResponseSchema = z.union([ahaOfferSuccessResponseSchema, apiErrorSchema]);

export type AhaOfferRequest = z.infer<typeof ahaOfferRequestSchema>;
export type AhaOffer = z.infer<typeof ahaOfferSchema>;
export type AhaOfferSuccessResponse = z.infer<typeof ahaOfferSuccessResponseSchema>;
