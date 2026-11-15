import { z } from "zod";

export const JobOpeningSchema = z.object({
  noRegistrasi: z.string().min(1, "No Registrasi is required"),
  positionId: z.string().nullable().optional(),
  positionName: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  departmentName: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  provinceId: z.string().min(1, "Province is required"),
  cityId: z.string().min(1, "City is required"),
  siteId: z.string().min(1, "Site is required"),
  statusPermintaan: z.string().min(1, "Status Permintaan is required"),
  jumlahPermintaan: z.coerce
    .number()
    .int("Jumlah Permintaan harus berupa bilangan bulat")
    .positive("Jumlah Permintaan harus lebih dari 0 (minimal 1)"),
  tanggalMasuk: z.date(),
  noFormB1: z.string().optional(),
  district: z.string().optional(),
  deskripsi: z.string().optional(),
  kualifikasi: z.string().optional(),
  benefit: z.string().optional(),
  requiresSkillTest: z.boolean().default(false),
  requiresBnsp: z.boolean().default(false),
  isPriority: z.boolean().default(false),
});

export type JobOpeningInput = z.infer<typeof JobOpeningSchema>;
