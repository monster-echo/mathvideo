import type { ZodType } from "zod";

import { apiErrorSchema } from "@/contracts/common";

export async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function parseWithSchema<T>(schema: ZodType<T>, input: unknown): T | null {
  const parsed = schema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function getApiErrorMessage(input: unknown): string | null {
  const parsed = apiErrorSchema.safeParse(input);
  return parsed.success ? parsed.data.error : null;
}

export async function parseApiResponseOrThrow<T>({
  response,
  successSchema,
  fallbackError,
}: {
  response: Response;
  successSchema: ZodType<T>;
  fallbackError: string;
}): Promise<T> {
  const data = await readJsonSafely(response);
  const success = parseWithSchema(successSchema, data);

  if (response.ok && success) {
    return success;
  }

  const error = getApiErrorMessage(data);
  throw new Error(error ?? fallbackError);
}
