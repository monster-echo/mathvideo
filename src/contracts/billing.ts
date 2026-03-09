import { z } from "zod";

import { apiErrorSchema } from "@/contracts/common";

export const billingCycleSchema = z.enum(["monthly", "yearly"]);
export const paidPlanIdSchema = z.enum(["teacher_pro", "creator_pro", "school_team"]);

export const checkoutRequestSchema = z.object({
  planId: paidPlanIdSchema,
  billingCycle: billingCycleSchema,
  source: z.string().trim().max(64).optional(),
});

export const checkoutSuccessResponseSchema = z.object({
  ok: z.literal(true),
  checkoutUrl: z.string().min(1),
  sessionId: z.string().min(1),
});

export const checkoutResponseSchema = z.union([checkoutSuccessResponseSchema, apiErrorSchema]);

export const billingPortalSuccessResponseSchema = z.object({
  ok: z.literal(true),
  url: z.string().min(1),
});

export const billingPortalResponseSchema = z.union([billingPortalSuccessResponseSchema, apiErrorSchema]);

export type BillingCycle = z.infer<typeof billingCycleSchema>;
export type PaidPlanId = z.infer<typeof paidPlanIdSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
