import { z } from "zod";

import { apiErrorSchema, personaSchema } from "@/contracts/common";

export const promptRequestSchema = z.object({
  prompt: z
    .string({ error: "请填写动画需求" })
    .trim()
    .min(3, "需求至少 3 个字符")
    .max(2000, "需求最多 2000 个字符"),
  persona: personaSchema.default("teacher"),
});

export const sceneSpecSchema = z.object({
  title: z.string().trim().min(1, "sceneSpec.title 不能为空"),
  timeline: z.array(z.string()).default([]),
  estimatedRenderTime: z.string().trim().min(1).default("60s"),
});

export const promptAiBridgeResponseSchema = z.object({
  sceneSpec: sceneSpecSchema,
});

export const promptSuccessResponseSchema = z.object({
  ok: z.literal(true),
  sceneSpec: sceneSpecSchema,
  ahaReady: z.boolean(),
  source: z.enum(["external_ai", "local_fallback"]),
  fallbackReason: z.string().trim().min(1).optional(),
});

export const promptResponseSchema = z.union([promptSuccessResponseSchema, apiErrorSchema]);

export type PromptRequest = z.infer<typeof promptRequestSchema>;
export type SceneSpec = z.infer<typeof sceneSpecSchema>;
export type PromptSuccessResponse = z.infer<typeof promptSuccessResponseSchema>;
