/**
 * Generates a valid SVG avatar image for seeded dummy candidate photos
 * when the physical image file does not exist in S3/R2 or local disk.
 */
export function generateDummyAvatarSvg(objectKey: string): string {
  const match = objectKey.match(/CAND-(\d+)/i);
  const label = match ? `C-${match[1]}` : "DPP";
  const num = match ? parseInt(match[1], 10) : 1;
  const palettes = [
    ["#0284c7", "#0369a1"],
    ["#0d9488", "#0f766e"],
    ["#4f46e5", "#4338ca"],
    ["#2563eb", "#1d4ed8"],
    ["#059669", "#047857"],
    ["#7c3aed", "#6d28d9"],
  ];
  const [bgStart, bgEnd] = palettes[num % palettes.length];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgStart}"/>
      <stop offset="100%" stop-color="${bgEnd}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="32" fill="url(#g)"/>
  <circle cx="128" cy="96" r="42" fill="rgba(255,255,255,0.22)"/>
  <path d="M56 220 C56 172 200 172 200 220" fill="rgba(255,255,255,0.22)"/>
  <text x="128" y="142" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text>
</svg>`;
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Generates a valid, standards-compliant single-page PDF 1.4 document buffer
 * for seeded dummy PDF documents when the physical object is not in S3/R2 or local disk.
 */
export function generateDummyPdfBuffer(objectKey: string): Buffer {
  const fileName = objectKey.split("/").pop() || objectKey;
  const candMatch = objectKey.match(/CAND-(\d+)/i);
  const candidateLabel = candMatch ? `Kandidat #CAND-${candMatch[1]}` : "Dokumen Kandidat / Rekrutmen";

  let docTitle = "DOKUMEN REKRUTMEN";
  const lower = fileName.toLowerCase();
  if (lower.includes("ktp")) docTitle = "KARTU TANDA PENDUDUK (KTP)";
  else if (lower.includes("keluarga") || lower.includes("kk")) docTitle = "KARTU KELUARGA (KK)";
  else if (lower.includes("curriculum-vitae") || lower.includes("cv")) docTitle = "CURRICULUM VITAE (CV)";
  else if (lower.includes("ijazah")) docTitle = "IJAZAH & TRANSKRIP NILAI";
  else if (lower.includes("bnsp") || lower.includes("sertifikat")) docTitle = "SERTIFIKAT KOMPETENSI BNSP";
  else if (lower.includes("ol") || lower.includes("offering")) docTitle = "SURAT PENAWARAN KERJA (OFFERING LETTER)";
  else if (lower.includes("mcu")) docTitle = "HASIL MEDICAL CHECK-UP (MCU)";
  else if (lower.includes("pkwt")) docTitle = "PERJANJIAN KERJA WAKTU TERTENTU (PKWT)";
  else if (lower.includes("skill") || lower.includes("survey") || lower.includes("report")) docTitle = "LAPORAN EVALUASI UJI KOMPETENSI TEKNIS";

  const streamLines = [
    "q",
    "0.95 0.97 1.0 rg",
    "40 710 515 80 re f",
    "0.05 0.32 0.65 rg",
    "40 786 515 4 re f",
    "BT",
    "/F2 16 Tf",
    "0.05 0.25 0.52 rg",
    "60 758 Td",
    "(PT DIAN PANDU PRATAMA - RECRUITMENT PORTAL) Tj",
    "/F1 11 Tf",
    "0.25 0.30 0.38 rg",
    "0 -22 Td",
    "(Sistem Informasi Rekrutmen & Manajemen Talenta Terpadu) Tj",
    "ET",
    "0.85 0.88 0.92 RG",
    "1 w",
    "40 420 515 265 re S",
    "BT",
    "/F2 18 Tf",
    "0.10 0.14 0.20 rg",
    "60 645 Td",
    `(${escapePdfText(docTitle)}) Tj`,
    "/F1 12 Tf",
    "0.20 0.25 0.33 rg",
    "0 -36 Td",
    `(${escapePdfText(`Pemilik Berkas : ${candidateLabel}`)}) Tj`,
    "0 -22 Td",
    `(${escapePdfText(`Nama File      : ${fileName}`)}) Tj`,
    "0 -22 Td",
    `(${escapePdfText(`Object Key     : ${objectKey}`)}) Tj`,
    "0 -22 Td",
    "(Status Berkas  : Terverifikasi Sistem \(Pratinjau Data Seed / Simulasi\)) Tj",
    "0 -40 Td",
    "/F2 11 Tf",
    "0.05 0.45 0.30 rg",
    "(CATATAN SISTEM:) Tj",
    "/F1 10 Tf",
    "0.30 0.35 0.42 rg",
    "0 -18 Td",
    "(Dokumen ini dibuat otomatis sebagai pratinjau untuk data dummy hasil seeding database.) Tj",
    "0 -15 Td",
    "(Saat pengguna mengunggah file asli melalui portal, sistem akan menampilkan file asli) Tj",
    "0 -15 Td",
    "(yang tersimpan pada Object Storage \(Cloudflare R2 / Local Upload Directory\).) Tj",
    "ET",
    "Q",
  ];

  const streamContent = streamLines.join("\n");
  const streamByteLength = Buffer.byteLength(streamContent, "utf8");

  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${streamByteLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

