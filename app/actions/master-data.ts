"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ProvinceInput, ProvinceSchema, CityInput, CitySchema, CustomerInput, CustomerSchema, PositionInput, PositionSchema, DepartmentInput, DepartmentSchema, SiteInput, SiteSchema, InstituteInput, InstituteSchema, RequestTypeInput, RequestTypeSchema, CertificationInput, CertificationSchema, RejectionMessageInput, RejectionMessageSchema, ClinicInput, ClinicSchema } from "@/lib/validations/master"

export async function getProvinces() {
  try {
    const provinces = await prisma.masterProvince.findMany({
      orderBy: { name: 'asc' }
    })
    return { success: true, data: provinces }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data provinsi" }
  }
}

export async function createProvince(data: ProvinceInput) {
  try {
    const parsed = ProvinceSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal: " + parsed.error.message }
    }

    const newProvince = await prisma.masterProvince.create({
      data: parsed.data
    })

    revalidatePath("/dashboard/settings/master-data/province")
    return { success: true, data: newProvince }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data provinsi" }
  }
}

export async function updateProvince(id: string, data: ProvinceInput) {
  try {
    const parsed = ProvinceSchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal: " + parsed.error.message }
    }

    const updatedProvince = await prisma.masterProvince.update({
      where: { id },
      data: parsed.data
    })

    revalidatePath("/dashboard/settings/master-data/province")
    return { success: true, data: updatedProvince }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data provinsi" }
  }
}

export async function deleteProvince(id: string) {
  try {
    await prisma.masterProvince.delete({
      where: { id }
    })

    revalidatePath("/dashboard/settings/master-data/province")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data provinsi" }
  }
}

// ----------------------------------------------------------------------
// CITIES
// ----------------------------------------------------------------------

export async function getCities() {
  try {
    const cities = await prisma.masterCity.findMany({
      include: { province: true },
      orderBy: { name: 'asc' }
    })
    return { success: true, data: cities }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data kota" }
  }
}

export async function createCity(data: CityInput) {
  try {
    const parsed = CitySchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal: " + parsed.error.message }
    }

    const newCity = await prisma.masterCity.create({
      data: parsed.data,
      include: { province: true }
    })

    revalidatePath("/dashboard/settings/master-data/city")
    return { success: true, data: newCity }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data kota" }
  }
}

export async function updateCity(id: string, data: CityInput) {
  try {
    const parsed = CitySchema.safeParse(data)
    if (!parsed.success) {
      return { success: false, error: "Validasi gagal: " + parsed.error.message }
    }

    const updatedCity = await prisma.masterCity.update({
      where: { id },
      data: parsed.data,
      include: { province: true }
    })

    revalidatePath("/dashboard/settings/master-data/city")
    return { success: true, data: updatedCity }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data kota" }
  }
}

export async function deleteCity(id: string) {
  try {
    await prisma.masterCity.delete({
      where: { id }
    })

    revalidatePath("/dashboard/settings/master-data/city")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data kota" }
  }
}

// ----------------------------------------------------------------------
// CUSTOMERS
// ----------------------------------------------------------------------

export async function getCustomers() {
  try {
    const data = await prisma.masterCustomer.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data customer" }
  }
}

export async function createCustomer(data: CustomerInput) {
  try {
    const parsed = CustomerSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterCustomer.create({ data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/customer")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data customer" }
  }
}

export async function updateCustomer(id: string, data: CustomerInput) {
  try {
    const parsed = CustomerSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterCustomer.update({ where: { id }, data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/customer")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data customer" }
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.masterCustomer.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/customer")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data customer" }
  }
}

// ----------------------------------------------------------------------
// POSITIONS
// ----------------------------------------------------------------------

export async function getPositions() {
  try {
    const data = await prisma.masterPosition.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data posisi" }
  }
}

export async function getDepartments() {
  try {
    const data = await prisma.masterDepartment.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data departemen" }
  }
}

export async function createDepartment(data: DepartmentInput) {
  try {
    const parsed = DepartmentSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterDepartment.create({ data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/department")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data departemen" }
  }
}

export async function updateDepartment(id: string, data: DepartmentInput) {
  try {
    const parsed = DepartmentSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterDepartment.update({ where: { id }, data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/department")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data departemen" }
  }
}

export async function deleteDepartment(id: string) {
  try {
    await prisma.masterDepartment.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/department")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data departemen" }
  }
}

export async function createPosition(data: PositionInput) {
  try {
    const parsed = PositionSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterPosition.create({ data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/positions")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data posisi" }
  }
}

export async function updatePosition(id: string, data: PositionInput) {
  try {
    const parsed = PositionSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterPosition.update({ where: { id }, data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/positions")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data posisi" }
  }
}

export async function deletePosition(id: string) {
  try {
    await prisma.masterPosition.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/positions")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data posisi" }
  }
}

// ----------------------------------------------------------------------
// SITES
// ----------------------------------------------------------------------

export async function getSites() {
  try {
    const data = await prisma.masterSite.findMany({
      include: { customer: true, city: true, province: true, siteSlas: true },
      orderBy: { name: 'asc' }
    })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data site" }
  }
}

export async function createSite(data: SiteInput) {
  try {
    const parsed = SiteSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const { siteSlas, ...siteData } = parsed.data;
    const result = await prisma.masterSite.create({
      data: {
        ...siteData,
        code: siteData.code || null,
        mcuPackage: siteData.mcuPackage || null,
        siteSlas: siteData.useSpecificSla && siteSlas ? {
          create: siteSlas.map(sla => ({
            stageId: sla.stageId,
            slaDays: sla.slaDays,
            reminderDays: sla.reminderDays
          }))
        } : undefined
      },
      include: { customer: true, city: true, province: true, siteSlas: true }
    })
    revalidatePath("/dashboard/settings/master-data/sites-operation")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data site" }
  }
}

export async function updateSite(id: string, data: SiteInput) {
  try {
    const parsed = SiteSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const { siteSlas, ...siteData } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // Delete old SLA if exists
      await tx.siteSla.deleteMany({ where: { siteId: id } });

      return await tx.masterSite.update({ 
        where: { id }, 
        data: {
          ...siteData,
          code: siteData.code || null,
          mcuPackage: siteData.mcuPackage || null,
          siteSlas: siteData.useSpecificSla && siteSlas ? {
            create: siteSlas.map(sla => ({
              stageId: sla.stageId,
              slaDays: sla.slaDays,
              reminderDays: sla.reminderDays
            }))
          } : undefined
        },
        include: { customer: true, city: true, province: true, siteSlas: true }
      });
    });
    revalidatePath("/dashboard/settings/master-data/sites-operation")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data site" }
  }
}

export async function deleteSite(id: string) {
  try {
    await prisma.masterSite.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/sites-operation")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data site" }
  }
}

// ----------------------------------------------------------------------
// INSTITUTE
// ----------------------------------------------------------------------

export async function getInstitutes() {
  try {
    const data = await prisma.masterInstitute.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data institusi" }
  }
}

export async function createInstitute(data: InstituteInput) {
  try {
    const parsed = InstituteSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterInstitute.create({ data: payload })
    revalidatePath("/dashboard/settings/master-data/institute")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data institusi" }
  }
}

export async function updateInstitute(id: string, data: InstituteInput) {
  try {
    const parsed = InstituteSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterInstitute.update({ where: { id }, data: payload })
    revalidatePath("/dashboard/settings/master-data/institute")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data institusi" }
  }
}

export async function deleteInstitute(id: string) {
  try {
    await prisma.masterInstitute.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/institute")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data institusi" }
  }
}

// ----------------------------------------------------------------------
// REQUEST TYPE
// ----------------------------------------------------------------------

export async function getRequestTypes() {
  try {
    const data = await prisma.masterRequestType.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data jenis request" }
  }
}

export async function createRequestType(data: RequestTypeInput) {
  try {
    const parsed = RequestTypeSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterRequestType.create({ data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/request-type")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data jenis request" }
  }
}

export async function updateRequestType(id: string, data: RequestTypeInput) {
  try {
    const parsed = RequestTypeSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const result = await prisma.masterRequestType.update({ where: { id }, data: parsed.data })
    revalidatePath("/dashboard/settings/master-data/request-type")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data jenis request" }
  }
}

export async function deleteRequestType(id: string) {
  try {
    await prisma.masterRequestType.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/request-type")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data jenis request" }
  }
}

// ----------------------------------------------------------------------
// CERTIFICATION
// ----------------------------------------------------------------------

export async function getCertifications() {
  try {
    const data = await prisma.masterCertification.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data sertifikasi" }
  }
}

export async function createCertification(data: CertificationInput) {
  try {
    const parsed = CertificationSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterCertification.create({ data: payload })
    revalidatePath("/dashboard/settings/master-data/certification")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data sertifikasi" }
  }
}

export async function updateCertification(id: string, data: CertificationInput) {
  try {
    const parsed = CertificationSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterCertification.update({ where: { id }, data: payload })
    revalidatePath("/dashboard/settings/master-data/certification")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data sertifikasi" }
  }
}

export async function deleteCertification(id: string) {
  try {
    await prisma.masterCertification.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/certification")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data sertifikasi" }
  }
}

// ----------------------------------------------------------------------
// CERTIFICATION SCHEMA (BNSP SKEMA)
// ----------------------------------------------------------------------

export async function getCertificationSchemas() {
  try {
    const data = await prisma.masterCertificationSchema.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data skema sertifikasi" }
  }
}

export async function createCertificationSchema(data: CertificationInput) {
  try {
    const parsed = CertificationSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterCertificationSchema.create({ data: payload })
    revalidatePath("/dashboard/settings/master-data/skema-sertifikasi")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data skema sertifikasi" }
  }
}

export async function updateCertificationSchema(id: string, data: CertificationInput) {
  try {
    const parsed = CertificationSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterCertificationSchema.update({ where: { id }, data: payload })
    revalidatePath("/dashboard/settings/master-data/skema-sertifikasi")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data skema sertifikasi" }
  }
}

export async function deleteCertificationSchema(id: string) {
  try {
    await prisma.masterCertificationSchema.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/skema-sertifikasi")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data skema sertifikasi" }
  }
}

// ----------------------------------------------------------------------
// REJECTION MESSAGE
// ----------------------------------------------------------------------

export async function getRejectionMessages() {
  try {
    const data = await prisma.masterRejectionMessage.findMany({ 
      include: { stage: true },
      orderBy: { code: 'asc' } 
    })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data pesan penolakan" }
  }
}

export async function createRejectionMessage(data: RejectionMessageInput) {
  try {
    const parsed = RejectionMessageSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterRejectionMessage.create({ data: payload })
    revalidatePath("/dashboard/settings/master-data/rejection-message")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data pesan penolakan" }
  }
}

export async function updateRejectionMessage(id: string, data: RejectionMessageInput) {
  try {
    const parsed = RejectionMessageSchema.safeParse(data)
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message }
    const payload = { ...parsed.data, code: parsed.data.code || null }
    const result = await prisma.masterRejectionMessage.update({ where: { id }, data: payload })
    revalidatePath("/dashboard/settings/master-data/rejection-message")
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data pesan penolakan" }
  }
}

export async function deleteRejectionMessage(id: string) {
  try {
    await prisma.masterRejectionMessage.delete({ where: { id } })
    revalidatePath("/dashboard/settings/master-data/rejection-message")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Gagal menghapus data pesan penolakan" }
  }
}

export async function ensureExtendedPipelineStages() {
  try {
    const newStages = [
      { id: "stage_8", name: "Training", orderIndex: 8, slaDays: 0, reminderDays: 0 },
      { id: "stage_9", name: "Induction", orderIndex: 9, slaDays: 0, reminderDays: 0 },
      { id: "stage_10", name: "PKWT", orderIndex: 10, slaDays: 0, reminderDays: 0 },
    ];
    for (const st of newStages) {
      const existing = await prisma.masterPipelineStage.findUnique({ where: { id: st.id } });
      if (!existing) {
        await prisma.masterPipelineStage.create({ data: st });
      }
    }
  } catch (err) {
    console.error("ensureExtendedPipelineStages Error:", err);
  }
}

export async function getPipelineStages() {
  try {
    await ensureExtendedPipelineStages();
    const data = await prisma.masterPipelineStage.findMany({ orderBy: { orderIndex: 'asc' } })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Gagal mengambil data tahapan rekrutmen" }
  }
}

export async function updateGlobalSla(payload: { id: string; slaDays: number; reminderDays: number }[]) {
  try {
    await prisma.$transaction(
      payload.map(item => 
        prisma.masterPipelineStage.update({
          where: { id: item.id },
          data: { slaDays: item.slaDays, reminderDays: item.reminderDays }
        })
      )
    );
    revalidatePath("/dashboard/settings/sla");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengupdate konfigurasi SLA" };
  }
}

// ----------------------------------------------------------------------
// Master Clinic Actions
// ----------------------------------------------------------------------

export async function getClinics() {
  try {
    const data = await prisma.masterClinic.findMany({
      include: { province: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data klinik" };
  }
}

export async function createClinic(data: ClinicInput) {
  try {
    const parsed = ClinicSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message };

    const result = await prisma.masterClinic.create({
      data: {
        code: parsed.data.code || null,
        name: parsed.data.name,
        provinceId: parsed.data.provinceId,
        address: parsed.data.address
      },
      include: { province: true }
    });

    revalidatePath("/dashboard/settings/master-data/clinics");
    revalidatePath("/dashboard/generate-documents");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data klinik" };
  }
}

export async function updateClinic(id: string, data: ClinicInput) {
  try {
    const parsed = ClinicSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Validasi gagal: " + parsed.error.message };

    const result = await prisma.masterClinic.update({
      where: { id },
      data: {
        code: parsed.data.code || null,
        name: parsed.data.name,
        provinceId: parsed.data.provinceId,
        address: parsed.data.address
      },
      include: { province: true }
    });

    revalidatePath("/dashboard/settings/master-data/clinics");
    revalidatePath("/dashboard/generate-documents");
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "Gagal mengupdate data klinik" };
  }
}

export async function deleteClinic(id: string) {
  try {
    await prisma.masterClinic.delete({ where: { id } });
    revalidatePath("/dashboard/settings/master-data/clinics");
    revalidatePath("/dashboard/generate-documents");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus data klinik" };
  }
}
