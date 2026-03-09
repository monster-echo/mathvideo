import { z } from "zod";

import { apiErrorSchema } from "@/contracts/common";

export const playgroundOptimizeHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20_000),
});

export const playgroundOptimizeRequestSchema = z.object({
  code: z.string().trim().min(20).max(40_000),
  instruction: z.string().trim().min(2).max(4_000),
  history: z.array(playgroundOptimizeHistoryItemSchema).max(20).default([]),
});

export const playgroundOptimizeSuccessResponseSchema = z.object({
  ok: z.literal(true),
  reply: z.string().trim().min(1),
  optimizedCode: z.string().trim().min(20),
});

export const playgroundOptimizeResponseSchema = z.union([playgroundOptimizeSuccessResponseSchema, apiErrorSchema]);

export type PlaygroundOptimizeHistoryItem = z.infer<typeof playgroundOptimizeHistoryItemSchema>;
