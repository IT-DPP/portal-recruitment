import { z } from 'zod';

// Province Schema
export const ProvinceSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nama Provinsi wajib diisi'),
});

export type ProvinceInput = z.infer<typeof ProvinceSchema>;

// City Schema
export const CitySchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nama Kota wajib diisi'),
  provinceId: z.string().min(1, 'Provinsi wajib dipilih'),
});

export type CityInput = z.infer<typeof CitySchema>;

// Customer Schema
export const CustomerSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nama Customer wajib diisi'),
});
export type CustomerInput = z.infer<typeof CustomerSchema>;

// Position Schema
export const PositionSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nama Posisi wajib diisi'),
});
export type PositionInput = z.infer<typeof PositionSchema>;

// Department Schema
export const DepartmentSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nama Departemen wajib diisi'),
});
export type DepartmentInput = z.infer<typeof DepartmentSchema>;

// Institute Schema
export const InstituteSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nama Institusi wajib diisi'),
  type: z.string().optional(),
  status: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});
export type InstituteInput = z.infer<typeof InstituteSchema>;

// Request Type Schema
export const RequestTypeSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Jenis Request wajib diisi'),
});
export type RequestTypeInput = z.infer<typeof RequestTypeSchema>;

// Certification Schema
export const CertificationSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nama Sertifikasi wajib diisi'),
});
export type CertificationInput = z.infer<typeof CertificationSchema>;

// Rejection Message Schema
export const RejectionMessageSchema = z.object({
  code: z.string().optional(),
  stageId: z.string().min(1, 'Stage wajib diisi'),
  message: z.string().min(1, 'Pesan penolakan wajib diisi'),
});
export type RejectionMessageInput = z.infer<typeof RejectionMessageSchema>;

// Site Schema
export const SiteSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1, 'Nama Site wajib diisi'),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  customerId: z.string().min(1, 'Customer wajib dipilih'),
  cityId: z.string().min(1, 'Kota wajib dipilih'),
  provinceId: z.string().min(1, 'Provinsi wajib dipilih'),
  useSpecificSla: z.boolean().default(false),
  mcuPackage: z.string().optional().nullable(),
  siteSlas: z.array(z.object({
    stageId: z.string(),
    slaDays: z.number().min(0),
    reminderDays: z.number().min(0)
  })).optional()
});
export type SiteInput = z.infer<typeof SiteSchema>;

// Clinic Schema
export const ClinicSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1, 'Nama Klinik wajib diisi'),
  provinceId: z.string().min(1, 'Provinsi wajib dipilih'),
  address: z.string().min(1, 'Detail alamat klinik wajib diisi'),
});
export type ClinicInput = z.infer<typeof ClinicSchema>;
