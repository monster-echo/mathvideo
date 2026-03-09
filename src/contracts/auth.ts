import { z } from "zod";

import { apiErrorSchema } from "@/contracts/common";

export const sessionUserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable().optional(),
  emailVerified: z.boolean().optional(),
  name: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export const subscriptionSummarySchema = z.object({
  status: z.string().min(1),
  planId: z.string().nullable().optional(),
  cycle: z.string().nullable().optional(),
  active: z.boolean(),
});

export const authMeResponseSchema = z.union([
  z.object({
    authenticated: z.literal(false),
    user: z.null(),
    subscription: z.null(),
  }),
  z.object({
    authenticated: z.literal(true),
    user: sessionUserSchema,
    subscription: subscriptionSummarySchema.nullable(),
  }),
]);

export const sessionLoginRequestSchema = z.object({
  idToken: z.string().trim().min(1, "缺少 idToken"),
});

export const sessionLoginSuccessResponseSchema = z.object({
  ok: z.literal(true),
  user: sessionUserSchema,
});

export const sessionLoginResponseSchema = z.union([sessionLoginSuccessResponseSchema, apiErrorSchema]);

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
export type SessionLoginRequest = z.infer<typeof sessionLoginRequestSchema>;
export type SessionLoginSuccessResponse = z.infer<typeof sessionLoginSuccessResponseSchema>;
