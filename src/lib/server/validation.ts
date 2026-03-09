import { z, type ZodType } from "zod";

type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function validateBody<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input);

  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  const firstIssue = parsed.error.issues[0];
  const path = firstIssue?.path?.join(".");
  const message = firstIssue?.message ?? "请求参数不合法";
  const formattedMessage = path ? `${path}: ${message}` : message;

  return { ok: false, error: formattedMessage };
}

export { z };

