import { z } from "zod";

import { renderJobStatusSchema, renderOutputSchema, renderQualitySchema } from "@/contracts/renders";

export const uiMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(z.any()),
});

export const chatThreadTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  report: z.string().trim().min(1).max(40_000),
  code: z.string().trim().min(20).max(20_000),
  sourceMessageId: z.string().min(1).optional(),
  sourcePartIndex: z.number().int().min(0).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  renderQuality: renderQualitySchema.default("preview"),
  renderJobId: z.string().min(1).optional(),
  renderStatus: renderJobStatusSchema.optional(),
  renderError: z.string().optional(),
  renderOutput: renderOutputSchema.optional(),
  renderLogs: z.array(z.string()).max(60).optional(),
});

export const chatThreadSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  messageCount: z.number().int().min(0),
  taskCount: z.number().int().min(0).default(0),
  lastMessagePreview: z.string().optional(),
});

export const chatThreadSchema = chatThreadSummarySchema.extend({
  messages: z.array(uiMessageSchema),
  tasks: z.array(chatThreadTaskSchema).default([]),
});

export const chatThreadsListResponseSchema = z.object({
  ok: z.literal(true),
  threads: z.array(chatThreadSummarySchema),
});

export const chatThreadResponseSchema = z.object({
  ok: z.literal(true),
  thread: chatThreadSchema,
});

export const chatThreadCreateRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    initialMessages: z.array(uiMessageSchema).optional(),
    initialTasks: z.array(chatThreadTaskSchema).optional(),
  })
  .default({});

export const chatThreadUpdateRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    messages: z.array(uiMessageSchema).optional(),
    tasks: z.array(chatThreadTaskSchema).optional(),
  })
  .refine((value) => value.title !== undefined || value.messages !== undefined || value.tasks !== undefined, {
    message: "至少需要传入 title、messages、tasks 之一",
  });

export const chatStreamRequestSchema = z.object({
  id: z.string().min(1).optional(),
  threadId: z.string().min(1).optional(),
  messages: z.array(uiMessageSchema),
});

export type ChatThreadSummary = z.infer<typeof chatThreadSummarySchema>;
export type ChatThread = z.infer<typeof chatThreadSchema>;
export type ChatThreadTask = z.infer<typeof chatThreadTaskSchema>;
