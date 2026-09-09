import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(120).default(""),
    role: z.string().trim().optional(),
    status: z.string().trim().optional(),
    campus: z.string().trim().max(120).optional(),
    sort: z.enum(["newest", "oldest", "name"]).default("newest"),
  })
  .passthrough();

export function pageRange(page, limit) {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
}

export function sendValidationError(response, message = "Invalid request.") {
  return response
    .status(400)
    .json({ success: false, code: "INVALID_REQUEST", message });
}
