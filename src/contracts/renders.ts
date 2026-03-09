import { z } from "zod";

import { apiErrorSchema } from "@/contracts/common";

export const renderQualitySchema = z.enum(["preview", "1080p"]);
export const renderJobStatusSchema = z.enum(["queued", "running", "succeeded", "failed"]);

export const createRenderRequestSchema = z.object({
  code: z.string().trim().min(20, "代码内容过短").max(20_000, "代码长度超出限制"),
  quality: renderQualitySchema.default("preview"),
  title: z.string().trim().max(80).optional(),
});

export const listRendersQuerySchema = z.object({
  id: z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const text = value.trim();
    return text.length > 0 ? text : undefined;
  }, z.string().min(1).optional()),
  limit: z.preprocess((value) => {
    const raw = typeof value === "string" && value.length > 0 ? value : "10";
    const numeric = Number(raw);

    if (Number.isNaN(numeric)) return 10;
    return Math.max(Math.min(Math.trunc(numeric), 30), 1);
  }, z.number().int().min(1).max(30)),
});

export const renderOutputSchema = z.object({
  durationSec: z.number(),
  resolution: z.string(),
  previewText: z.string(),
  videoUrl: z.string().url().optional(),
});

export const renderJobSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  quality: renderQualitySchema,
  status: renderJobStatusSchema,
  codeLength: z.number(),
  logs: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  output: renderOutputSchema.optional(),
  error: z.string().optional(),
});

export const createRenderSuccessResponseSchema = z.object({
  ok: z.literal(true),
  job: renderJobSchema,
});

export const getRenderSuccessResponseSchema = z.object({
  ok: z.literal(true),
  job: renderJobSchema,
});

export const listRendersSuccessResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(renderJobSchema),
});

export const createRenderResponseSchema = z.union([createRenderSuccessResponseSchema, apiErrorSchema]);

export const workerClaimResponseSchema = z.object({
  ok: z.literal(true),
  job: z
    .object({
      id: z.string().min(1),
      title: z.string().min(1),
      quality: renderQualitySchema,
      code: z.string().min(20),
      codeLength: z.number().int().min(0),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
});

export const workerStatusSchema = z.enum(["idle", "busy", "offline"]);

export const workerHeartbeatRequestSchema = z.object({
  workerId: z.string().trim().min(1).max(120),
  status: workerStatusSchema,
  activeJobId: z.string().trim().min(1).max(120).optional(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const workerUpdateRequestSchema = z.object({
  jobId: z.string().min(1),
  status: renderJobStatusSchema,
  logs: z.array(z.string().trim().min(1)).max(200).optional(),
  error: z.string().trim().max(4000).optional(),
  output: renderOutputSchema.optional(),
});

export const workerUpdateResponseSchema = z.object({
  ok: z.literal(true),
  job: renderJobSchema,
});

export type RenderQuality = z.infer<typeof renderQualitySchema>;
export type RenderJobStatus = z.infer<typeof renderJobStatusSchema>;
export type RenderJob = z.infer<typeof renderJobSchema>;
export type CreateRenderRequest = z.infer<typeof createRenderRequestSchema>;
export type RenderOutput = z.infer<typeof renderOutputSchema>;
