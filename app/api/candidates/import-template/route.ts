import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/auth-guard";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || !STAFF_ROLES.includes(userRole)) {
    return NextResponse.json(
      { error: "Unauthorized: Hanya staf rekrutmen/admin yang dapat mengunduh template ini." },
      { status: 403 }
    );
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PT Dian Pandu Pratama (DPP)";
  workbook.lastModifiedBy = "DPP Recruitment System";
  workbook.created = new Date();

  // Sheet 1: Template Data Kandidat
  const worksheet = workbook.addWorksheet("Template Import Kandidat", {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { header: "NIK (16 Digit Wajib)", key: "nik", width: 24 },
    { header: "Nama Lengkap (Wajib)", key: "fullName", width: 30 },
    { header: "No. Kartu Keluarga (16 Digit)", key: "kk", width: 26 },
    { header: "Email (Opsional)", key: "email", width: 32 },
    { header: "No. WhatsApp / HP (Wajib)", key: "phone", width: 24 },
    { header: "Tempat Lahir", key: "birthPlace", width: 20 },
    { header: "Tanggal Lahir (YYYY-MM-DD)", key: "birthDate", width: 24 },
    { header: "Jenis Kelamin (Laki-laki / Perempuan)", key: "gender", width: 26 },
    { header: "Pendidikan Terakhir (SMA/SMK/D3/S1)", key: "latestEducation", width: 26 },
    { header: "Nama Sekolah / Universitas", key: "educationInstitution", width: 32 },
    { header: "Alamat Domisili / Kota", key: "domicileAddress", width: 35 },
    { header: "Catatan Kualifikasi / Pengalaman", key: "notes", width: 35 },
  ];

  // Header row styling: DPP Corporate Navy
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0A2540" },
    };
    cell.font = {
      name: "Segoe UI",
      size: 10,
      bold: true,
      color: { argb: "FFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "CCCCCC" } },
      left: { style: "thin", color: { argb: "CCCCCC" } },
      bottom: { style: "medium", color: { argb: "000000" } },
      right: { style: "thin", color: { argb: "CCCCCC" } },
    };
  });

  // Sample data rows
  const sampleRows = [
    {
      nik: "6403061205900001",
      fullName: "Budi Santoso",
      kk: "6403061205900002",
      email: "budi.santoso@gmail.com",
      phone: "081234567890",
      birthPlace: "Samarinda",
      birthDate: "1990-05-12",
      gender: "Laki-laki",
      latestEducation: "SMK Otomotif",
      educationInstitution: "SMKN 2 Samarinda",
      domicileAddress: "Samarinda, Kalimantan Timur",
      notes: "Pengalaman Staff Lapangan & Workshop 3 Tahun",
    },
    {
      nik: "6402012010930005",
      fullName: "Siti Rahmawati",
      kk: "6402012010930006",
      email: "siti.rahma@yahoo.com",
      phone: "085298765432",
      birthPlace: "Balikpapan",
      birthDate: "1993-10-20",
      gender: "Perempuan",
      latestEducation: "D3 Akuntansi",
      educationInstitution: "Politeknik Negeri Balikpapan",
      domicileAddress: "Balikpapan, Kalimantan Timur",
      notes: "Pengalaman Site Admin & Finance Support",
    },
    {
      nik: "3201011508950009",
      fullName: "Ahmad Fauzi",
      kk: "3201011508950010",
      email: "",
      phone: "087711223344",
      birthPlace: "Kutai Kartanegara",
      birthDate: "1995-08-15",
      gender: "Laki-laki",
      latestEducation: "S1 Teknik Pertambangan",
      educationInstitution: "Universitas Mulawarman",
      domicileAddress: "Tenggarong, Kutai Kartanegara",
      notes: "Sertifikasi POP & K3 Umum BNSP",
    },
  ];

  sampleRows.forEach((rowData) => {
    const row = worksheet.addRow(rowData);
    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Segoe UI", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 || colNumber === 3 || colNumber === 7 ? "center" : "left",
      };
      // Format NIK and KK as text format
      if (colNumber === 1 || colNumber === 3) {
        cell.numFmt = "@";
      }
      cell.border = {
        top: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };
    });
  });

  // Sheet 2: Panduan & Aturan
  const guideSheet = workbook.addWorksheet("Panduan Pengisian");
  guideSheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Kolom / Field", key: "field", width: 28 },
    { header: "Aturan Pengisian", key: "rule", width: 65 },
    { header: "Wajib / Opsional", key: "required", width: 18 },
  ];

  const guideHeader = guideSheet.getRow(1);
  guideHeader.height = 28;
  guideHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1E293B" },
    };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guideData = [
    {
      no: 1,
      field: "NIK",
      rule: "Wajib tepat 16 digit angka. Jangan gunakan spasi atau tanda minus (-). Format text dipertahankan.",
      required: "WAJIB",
    },
    {
      no: 2,
      field: "Nama Lengkap",
      rule: "Nama resmi kandidat sesuai KTP. Minimal 2 karakter.",
      required: "WAJIB",
    },
    {
      no: 3,
      field: "No. Kartu Keluarga",
      rule: "16 digit angka nomor KK. Digunakan untuk keperluan administrasi BPJS & PKWT.",
      required: "Opsional",
    },
    {
      no: 4,
      field: "Email",
      rule: "Alamat email aktif. Jika dikosongkan, sistem DPP otomatis membuat email unik berbasis NIK.",
      required: "Opsional",
    },
    {
      no: 5,
      field: "No. WhatsApp / HP",
      rule: "Nomor kontak aktif kandidat (contoh: 081234567890).",
      required: "WAJIB",
    },
    {
      no: 6,
      field: "Tanggal Lahir",
      rule: "Gunakan format YYYY-MM-DD (Tahun-Bulan-Tanggal), contoh: 1993-10-20.",
      required: "Opsional",
    },
    {
      no: 7,
      field: "Jenis Kelamin",
      rule: 'Pilih "Laki-laki" atau "Perempuan".',
      required: "Opsional",
    },
    {
      no: 8,
      field: "Pendidikan Terakhir",
      rule: "Tingkat pendidikan, contoh: SMA, SMK Otomotif, D3 Akuntansi, S1 Teknik Mesin.",
      required: "Opsional",
    },
    {
      no: 9,
      field: "Proteksi Data Pribadi (UU PDP)",
      rule: "Data NIK dan KK otomatis dienkripsi dengan standar AES-256-GCM sesuai UU No. 27 Tahun 2022.",
      required: "SISTEM",
    },
  ];

  guideData.forEach((g) => {
    const row = guideSheet.addRow(g);
    row.height = 24;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Segoe UI", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 1 || colNumber === 4 ? "center" : "left",
      };
      if (colNumber === 4 && g.required === "WAJIB") {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "B91C1C" } };
      }
      cell.border = {
        top: { style: "thin", color: { argb: "E2E8F0" } },
        left: { style: "thin", color: { argb: "E2E8F0" } },
        bottom: { style: "thin", color: { argb: "E2E8F0" } },
        right: { style: "thin", color: { argb: "E2E8F0" } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="Template_Import_Kandidat_DPP.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
