import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas — validate inbound API request bodies and give clear errors.
// ---------------------------------------------------------------------------

export const analyzeRequestSchema = z.object({
  resume: z
    .string()
    .trim()
    .min(40, "Resume text is too short. Please paste or upload a full resume."),
  jobDescription: z
    .string()
    .trim()
    .min(40, "Job description is too short. Please paste or upload a full job description."),
  instruction: z
    .string()
    .trim()
    .max(2000, "Instruction is too long (max 2000 characters).")
    .optional()
    .default(""),
  mode: z
    .enum(["economy", "balanced", "premium", "local"])
    .optional()
    .default("balanced"),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const exportRequestSchema = z.object({
  content: z.string().min(1, "Nothing to export."),
  format: z.enum(["docx", "pdf", "txt", "md"]),
  filename: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("tailored-resume"),
  candidateName: z.string().trim().max(120).optional().default(""),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
