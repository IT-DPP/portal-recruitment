import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping position names or keywords to professional DPP enterprise job descriptions
const descriptionsMap: Record<string, string> = {
  "Operator Excavator": `Bertanggung jawab penuh atas pengoperasian alat berat Excavator (kelas 20-200 ton, e.g., Komatsu PC200 - PC2000) secara aman, efektif, dan produktif di area penambangan/konstruksi.

Tanggung Jawab Utama:
• Melakukan Pemeriksaan Harian (P2H) sebelum dan sesudah unit dioperasikan sesuai standar K3LH dan SOP perusahaan.
• Melaksanakan kegiatan loading overburden (OB), ripping/digging, re-handling, serta pembuatan drainage dan pemeliharaan bench/front tambang.
• Menjaga efisiensi fuel consumption dan siklus kerja (cycle time) optimal sesuai target produksi mingguan dan bulanan.
• Menjaga keselamatan kerja diri sendiri, rekan kerja, dan aset unit di bawah prinsip Zero Accident (K3LH & Golden Rules).
• Melaporkan setiap abnormalitas mesin, sistem hidrolik, dan kondisi front penambangan secara langsung kepada Supervisor/Foreman.`,

  "Mine Surveyor": `Bertanggung jawab dalam merencanakan, melaksanakan, dan mengolah data pengukuran topografi tambang permukaan untuk menjamin ketepatan realisasi pit design dan perhitungan volume.

Tanggung Jawab Utama:
• Melakukan survey topografi berkala menggunakan Total Station, GPS Geodetik (RTK), dan Drone/UAV photogrammetry.
• Mengolah data titik koordinat dan elevasi (contouring, DTM) untuk rekonsiliasi volume overburden (OB) dan cadangan batubara/mineral (end-of-month reconciliation).
• Melakukan staking out batas pit limit, disposal area, sumping, ramp jalan tambang, dan blast pattern (pola pemboran & peledakan).
• Memonitor pergerakan lereng tambang (slope stability monitoring) dan memberikan peringatan dini terhadap potensi geoteknikal labil.
• Menyusun peta operasional tambang mingguan dan bulanan serta berkoordinasi erat dengan tim Mine Planning Engineer.`,

  "HSE Mining Inspector": `Bertanggung jawab mengawal, memonitor, dan menegakkan penerapan Sistem Manajemen Keselamatan Pertambangan (SMKP) Minerba dan regulasi K3LH di seluruh site operasional.

Tanggung Jawab Utama:
• Melakukan inspeksi K3 berkala pada front kerja tambang, disposal, workshop, hauling road, serta fasilitas mess & greenplant.
• Memfasilitasi pelaksanaan Job Safety Analysis (JSA), Hazard Identification Risk Assessment and Determining Control (HIRADC), dan Safety Talk harian.
• Menginvestigasi insiden kerja (nearmiss, property damage, injury), menganalisis akar masalah (RCA), dan memonitor implementasi tindakan korektif (CAPA).
• Memastikan kepatuhan terhadap izin kerja khusus (Permit to Work): Hot Work, Working at Height, Confined Space, dan Heavy Lifting.
• Melakukan audit kepatuhan APD (Alat Pelindung Diri) dan evaluasi kesiapan tanggap darurat (Emergency Response Preparedness).`,

  "Heavy Equipment Mechanic": `Bertanggung jawab melaksanakan kegiatan pemeliharaan berkala (preventive maintenance), perbaikan darurat (corrective maintenance), dan troubleshooting sistem mekanikal/hidrolik alat berat.

Tanggung Jawab Utama:
• Melakukan periodic inspection (PS 250, 500, 1000, 2000 hours) pada unit Excavator, Dump Truck, Dozer, dan Grader.
• Melakukan troubleshooting engine diesel, transmisi powershift, hidrolik pump/valve, sistem kemudi, dan undercarriage.
• Mengganti suku cadang, komponen assembly (sub-assembly overhaul), serta pelumasan pelumas/grease sesuai manual shop service.
• Mengisi lembar kerja Backlog Sheet dan Service Report secara terperinci untuk rekam jejak riwayat unit (equipment health history).
• Menjaga standar kebersihan workshop, penanganan limbah B3 (oli bekas, filter), serta kepatuhan K3 mekanik.`,

  "Drill & Blast Engineer": `Bertanggung jawab merancang pola pengeboran dan peledakan (Drilling & Blasting pattern) yang efisien, aman, serta menghasilkan fragmentasi batuan optimum.

Tanggung Jawab Utama:
• Merancang desain geometri peledakan (burden, spacing, sub-drilling, stemming) sesuai karakteristik geomekanik batuan overburden.
• Mengawasi pengisian bahan peledak (ANFO, emulsion), tie-in inisiasi (non-el / electronic detonator), dan keamanan perimeter peledakan.
• Mengukur dan menganalisis tingkat getaran (ground vibration) dan airblast menggunakan seismograf untuk menjaga stabilitas lereng dan lingkungan.
• Melakukan evaluasi fragmentasi batuan (diggability assessment) guna mendukung produktivitas unit muat (excavator loading rate).
• Memastikan administrasi izin bahan peledak (Gudang Handak, P1/P2, KTT) patuh terhadap regulasi Kepmen ESDM No. 1827 K/30/MEM/2018.`,

  "Mine Geologist": `Bertanggung jawab dalam pemodelan geologi, evaluasi stratigrafi, logging eksplorasi/produksi, dan pengendalian kualitas komoditas tambang (coal/mineral quality control).

Tanggung Jawab Utama:
• Melakukan pemetaan geologi lapangan, structural mapping (patahan, lipatan), dan pengecekan ketebalan singkapan (outcrop).
• Mengelola program core drilling, sampling, dan logging geofisika (gamma ray, density, caliper) untuk verifikasi model geologi 3D.
• Memantau proses penambangan batubara/mineral di front kerja guna meminimalkan losses, dilution, dan kontaminasi material pengotor.
• Mengkoordinasikan pengujian laboratorium untuk parameter kualitas (CV, TM, IM, Ash, Total Sulfur) sebelum batubara di-dispatch ke ROM atau stockpile.
• Menyusun estimasi cadangan dan rekonsiliasi deposit geologi bulanan bersama tim eksplorasi dan perencana tambang.`,

  "Welder Specialist": `Bertanggung jawab melakukan pekerjaan pengelasan struktur baja berat, perbaikan bucket excavator, chassis dump truck, dan fabrikasi komponen industri sesuai standar WPS/PQR internasional.

Tanggung Jawab Utama:
• Melaksanakan pengelasan SMAW, GMAW/FCAW, dan GTAW pada material baja karbon tinggi, hardox plate, dan struktur penunjang.
• Melakukan hardfacing, relining, dan rebuilding lip shroud pada bucket alat berat tambang untuk memperpanjang lifetime komponen.
• Membaca dan menginterpretasikan gambar teknik, simbol las (welding symbols), serta spesifikasi prosedur las (WPS).
• Memastikan sambungan las bebas cacat (porosity, undercut, crack) dan siap melalui pengujian visual maupun Non-Destructive Testing (NDT/UT/MT).
• Menerapkan standar keselamatan kerja pengelasan termasuk perlindungan mata (auto-darkening helmet), ventilasi, dan proteksi bahaya kebakaran.`,

  "Tyre Specialist": `Bertanggung jawab atas manajemen, inspeksi harian, penggantian, dan perawatan OTR (Off-The-Road) Tyre pada armada alat berat di lokasi tambang.

Tanggung Jawab Utama:
• Melakukan monitoring tekanan angin (tyre pressure), kedalaman alur ban (tread depth), dan suhu operasional ban OTR secara berkala.
• Melakukan rotasi ban, balance, perbaikan rim/wheel assembly, dan penanganan cut-separation pada ban berukuran besar (e.g. 27.00R49, 33.00R51).
• Menganalisis penyebab keausan dini ban dan merekomendasikan perbaikan kondisi jalan hauling (road maintenance) ke tim operasional.
• Mengelola database Tyre Management System (TMS) untuk menghitung TKPH (Ton-Kilometer-Per-Hour) dan cost-per-hour ban.
• Menjaga standar safety pengisian nitrogen/angin bertekanan tinggi menggunakan safety cage sesuai SOP.`,

  "Admin Operasional Site": `Bertanggung jawab mengelola administrasi logistik, timesheet tenaga kerja, akomodasi, dan pelaporan harian proyek penempatan di site operasional.

Tanggung Jawab Utama:
• Mengelola pencatatan absensi, roster kerja, izin, cuti, dan over time ratusan tenaga kerja operasional di site penempatan.
• Memproses pengajuan kebutuhan logistik, APD, konsumsi, dan tiket transportasi/akomodasi perjalanan dinas staf dan teknisi.
• Menyusun rekapitulasi Timesheet Harian & Bulanan untuk keperluan penagihan (billing) kepada klien serta pemrosesan payroll.
• Mengelola data aset perusahaan di site, surat-menyurat operasional, dan pengarsipan berkas kepatuhan legal ketenagakerjaan.
• Berkoordinasi aktif antara Head Office Jakarta/Cikarang dengan Manajer Operasional Site terkait pemenuhan kebutuhan manpower.`,

  "Planner Maintenance": `Bertanggung jawab merencanakan jadwal servis berkala, pengadaan suku cadang, dan alokasi manpower perawatan armada unit alat berat.

Tanggung Jawab Utama:
• Menyusun jadwal Periodic Service (PS) mingguan dan bulanan berdasarkan indikator Service Meter Units (SMU) atau Hour Meter (HM).
• Melakukan estimasi kebutuhan spare parts, consumable items, oil, dan filters serta berkoordinasi dengan departemen procurement/warehouse.
• Menganalisis ketersediaan fisik alat (Physical Availability / PA), Mechanical Availability (MA), dan Mean Time Between Failures (MTBF).
• Mengelola Work Order (WO) dari status open hingga complete dalam software CMMS/ERP perusahaan.
• Memantau backlog list perbaikan dan memprioritaskan jadwal overhaul komponen engine/transmisi.`,
};

// Fallback template for any other position
function getFallbackDescription(title: string, customer: string, dept: string): string {
  return `Posisi ${title} memegang peranan strategis dalam mendukung keandalan operasional dan produktivitas proyek penempatan PT Dian Pandu Pratama bersama mitra ${customer}.

Tanggung Jawab Utama:
• Melaksanakan kegiatan operasional harian pada unit kerja ${dept} sesuai standar operasional prosedur (SOP) dan instruksi kerja yang berlaku.
• Memastikan seluruh pekerjaan diselesaikan dengan target kuantitas dan kualitas yang telah ditentukan oleh manajemen dan klien.
• Menjaga dan memelihara peralatan kerja, perlengkapan keselamatan (APD), serta dokumentasi teknis terkait.
• Berkoordinasi secara aktif dengan tim kerja lintas divisi untuk menjamin kelancaran arus informasi dan operasional di lapangan.
• Mematuhi seluruh regulasi K3LH (Kesehatan, Keselamatan Kerja, dan Lingkungan Hidup) dengan komitmen Zero Accident.`;
}

async function backfillJobDescriptions() {
  console.log("=== MEMULAI BACKFILL DESKRIPSI PEKERJAAN PT DPP ===");
  const jobs = await prisma.jobOpening.findMany({
    include: {
      position: true,
      customer: true,
      department: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Ditemukan ${jobs.length} total lowongan.`);

  let updatedCount = 0;

  for (const job of jobs) {
    const title = job.positionName || job.position?.name || "Posisi Terkait";
    const customer = job.customer?.name || "Mitra Industri PT DPP";
    const dept = job.departmentName || job.department?.name || "Operasional";

    // Find best match in descriptionsMap
    let matchedDesc: string | null = null;

    for (const [key, desc] of Object.entries(descriptionsMap)) {
      if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
        matchedDesc = desc;
        break;
      }
    }

    if (!matchedDesc) {
      matchedDesc = getFallbackDescription(title, customer, dept);
    }

    await prisma.jobOpening.update({
      where: { id: job.id },
      data: {
        deskripsi: matchedDesc,
      },
    });

    updatedCount++;
    console.log(`[UPDATED] Job "${title}" (ID: ${job.id}) -> Deskripsi tersimpan (${matchedDesc.length} chars).`);
  }

  console.log(`\n=== BERHASIL MEMPERBARUI ${updatedCount} DESKRIPSI PEKERJAAN ===`);
}

backfillJobDescriptions()
  .catch((e) => {
    console.error("Backfill Deskripsi Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
