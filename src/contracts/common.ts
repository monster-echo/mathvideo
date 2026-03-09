import { z } from "zod";

export const personaSchema = z.enum(["teacher", "creator", "institution"]);

export const apiErrorSchema = z.object({
  error: z.string().trim().min(1),
});

export type Persona = z.infer<typeof personaSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;
