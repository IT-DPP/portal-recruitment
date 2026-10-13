import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export interface OfferingLetterData {
  nomorSurat: string;
  namaKandidat: string;
  posisi: string;
  namaPerusahaan: string;
  lokasi: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  totalBulan: number;
  tugasTanggungJawab: string; // HTML string
  hak: string; // HTML string
}

export interface McuLetterData {
  nomorSurat: string;
  namaKandidat: string;
  nik: string;
  ttl?: string;
  jenisKelamin?: string;
  posisi: string;
  namaPerusahaan: string;
  klinikTujuan: string;
  alamatKlinik?: string;
  tanggalPelaksanaan: Date | string | null;
  paketPemeriksaan: string;
  catatan?: string;
}

// Helper to convert an image URL to a Base64 data URL
export const getBase64FromUrl = async (url: string): Promise<string> => {
  if (typeof window === "undefined" || !url) return "";
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve((reader.result as string) || "");
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not convert image to base64:", err);
    return "";
  }
};

// Enhanced HTML to DOCX parser for Tiptap rich-text output
const parseHtmlToDocx = (htmlString: string): Paragraph[] => {
  if (typeof window === "undefined" || !htmlString) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const paragraphs: Paragraph[] = [];

  const parseNodeToRuns = (node: Node): TextRun[] => {
    const runs: TextRun[] = [];

    node.childNodes.forEach((child) => {
      if (child.nodeName === "#text") {
        if (child.textContent) {
          runs.push(new TextRun({ text: child.textContent }));
        }
      } else if (child.nodeName === "STRONG" || child.nodeName === "B") {
        runs.push(new TextRun({ text: child.textContent || "", bold: true }));
      } else if (child.nodeName === "EM" || child.nodeName === "I") {
        runs.push(new TextRun({ text: child.textContent || "", italics: true }));
      } else if (child.nodeName === "U") {
        runs.push(new TextRun({ text: child.textContent || "", underline: {} }));
      } else if (child.nodeName === "BR") {
        runs.push(new TextRun({ break: 1 }));
      } else {
        runs.push(...parseNodeToRuns(child));
      }
    });

    return runs;
  };

  doc.body.childNodes.forEach((node) => {
    if (node.nodeName === "P") {
      const runs = parseNodeToRuns(node);
      if (runs.length > 0) {
        paragraphs.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
      }
    } else if (node.nodeName === "UL") {
      node.childNodes.forEach((li) => {
        if (li.nodeName === "LI") {
          const runs = parseNodeToRuns(li);
          paragraphs.push(
            new Paragraph({
              children: runs,
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
          );
        }
      });
    } else if (node.nodeName === "OL") {
      let idx = 1;
      node.childNodes.forEach((li) => {
        if (li.nodeName === "LI") {
          const runs = parseNodeToRuns(li);
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `${idx}. `, bold: true }), ...runs],
              spacing: { after: 80 },
            })
          );
          idx++;
        }
      });
    } else if (node.nodeName === "#text" && node.textContent?.trim()) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: node.textContent.trim() })],
          spacing: { after: 120 },
        })
      );
    }
  });

  return paragraphs;
};

// Helper to fetch logo safely as ArrayBuffer
const fetchLogoBuffer = async (logoUrl?: string): Promise<ArrayBuffer | null> => {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (err) {
    console.warn("Logo fetch failed, skipping logo in DOCX:", err);
    return null;
  }
};

/**
 * Generate Offering Letter DOCX
 */
export const generateDocx = async (data: OfferingLetterData, logoUrl: string = "/icon.png") => {
  try {
    const arrayBuffer = await fetchLogoBuffer(logoUrl);
    const children: any[] = [];

    // Header Logo (if available)
    if (arrayBuffer) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: arrayBuffer,
              transformation: { width: 90, height: 90 },
              type: "png",
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    // Title
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "OFFERING LETTER", bold: true, size: 32 }), // 16pt
        ],
        spacing: { after: 240, before: 120 },
      })
    );

    // Meta Info
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Nomor: ${data.nomorSurat}`, bold: true }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Tanggal: ${new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`,
          }),
        ],
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Kepada Yth," })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Sdr/i. ${data.namaKandidat}`, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun({ text: "Di Tempat" })],
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Berdasarkan hasil proses seleksi, kami mewakili manajemen ${data.namaPerusahaan} dengan senang hati menawarkan posisi pekerjaan kepada Anda dengan rincian sebagai berikut:`,
          }),
        ],
        spacing: { after: 160 },
      })
    );

    // Detail Summary Table
    const startDateStr = data.startDate ? new Date(data.startDate).toLocaleDateString("id-ID") : "-";
    const endDateStr = data.endDate ? new Date(data.endDate).toLocaleDateString("id-ID") : "-";

    const detailTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Posisi", bold: true })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              width: { size: 5, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: data.posisi })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Lokasi Penempatan", bold: true })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              width: { size: 5, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: data.lokasi })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Masa Kontrak", bold: true })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              width: { size: 5, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: `${startDateStr} s/d ${endDateStr} (${data.totalBulan} Bulan)` })] })],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
          ],
        }),
      ],
    });

    children.push(detailTable);
    children.push(new Paragraph({ spacing: { after: 180 } }));

    // Tasks & Responsibilities
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Tugas dan Tanggung Jawab:", bold: true, underline: {} }),
        ],
        spacing: { after: 120 },
      }),
      ...parseHtmlToDocx(data.tugasTanggungJawab),
      new Paragraph({ spacing: { after: 120 } })
    );

    // Rights & Facilities
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Hak dan Fasilitas:", bold: true, underline: {} }),
        ],
        spacing: { after: 120 },
      }),
      ...parseHtmlToDocx(data.hak),
      new Paragraph({ spacing: { after: 240 } })
    );

    // Closing
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Demikian surat penawaran ini kami sampaikan. Harap dipelajari dan ditandatangani sebagai bentuk persetujuan.",
          }),
        ],
        spacing: { after: 360 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Hormat Kami," })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "HR Department", bold: true, underline: {} })],
      }),
      new Paragraph({
        children: [new TextRun({ text: data.namaPerusahaan })],
      })
    );

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const blobResult = await Packer.toBlob(doc);
    saveAs(blobResult, `Offering_Letter_${data.namaKandidat.replace(/\s+/g, "_")}.docx`);
  } catch (error) {
    console.error("Error generating DOCX:", error);
    alert("Terjadi kesalahan saat membuat file DOCX.");
  }
};

/**
 * Generate Surat Pengantar MCU DOCX
 */
export const generateMcuDocx = async (data: McuLetterData, logoUrl: string = "/icon.png") => {
  try {
    const arrayBuffer = await fetchLogoBuffer(logoUrl);
    const children: any[] = [];

    if (arrayBuffer) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: arrayBuffer,
              transformation: { width: 90, height: 90 },
              type: "png",
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "SURAT PENGANTAR MEDICAL CHECK-UP (MCU)", bold: true, size: 28 }),
        ],
        spacing: { after: 240, before: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Nomor: ${data.nomorSurat}`, bold: true })],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Tanggal: ${new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`,
          }),
        ],
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Kepada Yth." })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `Pimpinan / Bagian Medical Check Up`, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun({ text: data.klinikTujuan, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun({ text: data.alamatKlinik || "Di Tempat" })],
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Dengan hormat,\nBersama ini kami hadapkan calon karyawan kami dari ${data.namaPerusahaan} untuk dapat dilakukan pemeriksaan kesehatan (Medical Check-Up) pra-penempatan kerja, dengan data sebagai berikut:`,
          }),
        ],
        spacing: { after: 160 },
      })
    );

    // Candidate Details Table
    const candidateTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Nama Calon Karyawan", bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.namaKandidat, bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "NIK / No. KTP", bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.nik || "-" })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Posisi yang Dituju", bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.posisi })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Tanggal Pemeriksaan", bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.tanggalPelaksanaan ? new Date(data.tanggalPelaksanaan).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-" })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Paket MCU", bold: true })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
            new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.paketPemeriksaan })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
          ],
        }),
      ],
    });

    children.push(candidateTable);
    children.push(new Paragraph({ spacing: { after: 180 } }));

    if (data.catatan) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Catatan & Persiapan Calon Karyawan:", bold: true })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: data.catatan })],
          spacing: { after: 180 },
        })
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Segala biaya atas pemeriksaan tersebut di atas agar ditagihkan langsung ke bagian HR/Finance ${data.namaPerusahaan}. Hasil pemeriksaan diharapkan dapat dikirimkan kepada kami setelah proses selesai.`,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya. Atas kerja samanya, kami ucapkan terima kasih." })],
        spacing: { after: 360 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Hormat Kami," })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "HR Department", bold: true, underline: {} })],
      }),
      new Paragraph({
        children: [new TextRun({ text: data.namaPerusahaan })],
      })
    );

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const blobResult = await Packer.toBlob(doc);
    saveAs(blobResult, `Surat_Pengantar_MCU_${data.namaKandidat.replace(/\s+/g, "_")}.docx`);
  } catch (error) {
    console.error("Error generating MCU DOCX:", error);
    alert("Terjadi kesalahan saat membuat file MCU DOCX.");
  }
};

/**
 * Generate PDF from DOM Element using an isolated sandbox iframe
 * Solves:
 * 1. Tailwind CSS v4 color parsing (oklch / modern CSS) crashing html2canvas.
 * 2. Cross-origin / tainted canvas errors from logo <img>.
 * 3. Element negative offset / zero opacity clipping issues.
 * 4. Multi-page A4 splitting.
 */
export const generatePdfFromElement = async (
  elementId: string,
  filename: string,
  logoUrl: string = "/icon.png"
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Template dokumen tidak ditemukan.");
    return;
  }

  // Pre-load logo as Base64 to ensure no CORS or tainted canvas issue
  let base64Logo = "";
  try {
    base64Logo = await getBase64FromUrl(logoUrl);
  } catch (err) {
    console.warn("Base64 logo load failed:", err);
  }

  // Create an isolated sandbox iframe that has no Tailwind CSS v4 stylesheets
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.width = "794px"; // Standard A4 width at 96 DPI
  iframe.style.height = "1123px";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  iframe.style.opacity = "0.01"; // Must be slightly visible to layout engine
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error("Gagal menginisialisasi sandbox dokumen PDF.");
    }

    // Extract HTML and substitute any relative logo paths with base64 data URI
    let elementHtml = element.innerHTML;
    if (base64Logo) {
      elementHtml = elementHtml.replace(/src=["']\/icon\.png["']/g, `src="${base64Logo}"`);
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #000000;
              background-color: #ffffff;
              width: 794px;
              padding: 48px;
              line-height: 1.5;
              font-size: 14px;
            }
            h1 {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 4px;
            }
            h2, h3 {
              font-size: 15px;
              font-weight: bold;
              margin-top: 12px;
              margin-bottom: 6px;
            }
            p {
              margin-bottom: 10px;
              text-align: justify;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
            }
            td {
              padding: 4px 6px;
              vertical-align: top;
            }
            ul, ol {
              padding-left: 24px;
              margin: 8px 0;
            }
            li {
              margin-bottom: 4px;
            }
            img {
              max-width: 80px;
              height: auto;
              display: block;
              margin: 0 auto 8px auto;
            }
            .header-bar {
              border-bottom: 2px solid #000000;
              padding-bottom: 12px;
              margin-bottom: 20px;
              text-align: center;
            }
            .meta-table {
              margin-bottom: 16px;
            }
            .content-box {
              border: 1px solid #cccccc;
              padding: 12px 16px;
              margin: 14px 0;
              background: #fafafa;
            }
            .signature-area {
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          ${elementHtml}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Allow iframe images and layout to settle
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Dynamically import libraries safely
    const html2canvasModule = await import("html2canvas");
    const html2canvas =
      typeof html2canvasModule.default === "function"
        ? html2canvasModule.default
        : (html2canvasModule as any);

    const jsPdfModule = await import("jspdf");
    const jsPDFClass =
      typeof jsPdfModule.jsPDF === "function"
        ? jsPdfModule.jsPDF
        : typeof jsPdfModule.default === "function"
        ? jsPdfModule.default
        : (jsPdfModule as any);

    if (typeof html2canvas !== "function") {
      throw new Error("Modul html2canvas tidak dapat dimuat.");
    }
    if (typeof jsPDFClass !== "function") {
      throw new Error("Modul jsPDF tidak dapat dimuat.");
    }

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL("image/png");
    if (!imgData || imgData === "data:,") {
      throw new Error("Gagal mengambil snapshot canvas dokumen.");
    }

    const pdf = new jsPDFClass({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First Page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Subsequent pages if document height exceeds single A4
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    alert(`Terjadi kesalahan saat membuat file PDF: ${error?.message || error}`);
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
};

/**
 * Print / Save as PDF using Native Browser Print Engine
 * Provides 100% crisp vector font rendering without canvas rasterization.
 */
export const printDocument = async (
  elementId: string,
  title: string,
  logoUrl: string = "/icon.png"
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Template dokumen tidak ditemukan.");
    return;
  }

  let base64Logo = "";
  try {
    base64Logo = await getBase64FromUrl(logoUrl);
  } catch (e) {}

  const printIframe = document.createElement("iframe");
  printIframe.style.position = "fixed";
  printIframe.style.right = "0";
  printIframe.style.bottom = "0";
  printIframe.style.width = "0";
  printIframe.style.height = "0";
  printIframe.style.border = "none";
  document.body.appendChild(printIframe);

  const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (!doc) return;

  let elementHtml = element.innerHTML;
  if (base64Logo) {
    elementHtml = elementHtml.replace(/src=["']\/icon\.png["']/g, `src="${base64Logo}"`);
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            background: #ffffff;
            font-size: 11pt;
            line-height: 1.5;
            padding: 10px;
          }
          h1 {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2pt;
          }
          h2, h3 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 10pt;
            margin-bottom: 4pt;
          }
          p {
            margin-bottom: 8pt;
            text-align: justify;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 8pt 0;
          }
          td {
            padding: 3pt 4pt;
            vertical-align: top;
          }
          ul, ol {
            padding-left: 18pt;
            margin: 6pt 0;
          }
          li {
            margin-bottom: 3pt;
          }
          img {
            max-width: 75px;
            height: auto;
            display: block;
            margin: 0 auto 6pt auto;
          }
          .border-b-2 {
            border-bottom: 2px solid #000000;
            padding-bottom: 8pt;
            margin-bottom: 12pt;
          }
        </style>
      </head>
      <body>
        ${elementHtml}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    printIframe.contentWindow?.focus();
    printIframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(printIframe)) {
        document.body.removeChild(printIframe);
      }
    }, 1000);
  }, 250);
};

/**
 * Generate Excel BAST Document
 */
export const generateBastExcel = (
  rows: any[],
  meta?: { customerName?: string; month?: string }
) => {
  if (!rows || rows.length === 0) {
    alert("Tidak ada data untuk diekspor ke Excel.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 6 },  // No
    { wch: 22 }, // No. Request
    { wch: 20 }, // No. Form B1
    { wch: 18 }, // Tanggal Terima B1
    { wch: 30 }, // Nama Kandidat
    { wch: 22 }, // NIK
    { wch: 25 }, // Posisi
    { wch: 18 }, // Status
    { wch: 18 }, // NRP DPP
    { wch: 25 }, // Area Kerja
    { wch: 16 }, // Awal Kontrak
    { wch: 16 }, // Akhir Kontrak
    { wch: 30 }, // Link Sertifikat
    { wch: 15 }, // Validasi
  ];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BAST Serah Terima");

  const cleanMonth = meta?.month ? meta.month.replace("-", "_") : "Report";
  const cleanCustomer = meta?.customerName ? meta.customerName.replace(/[^a-zA-Z0-9]/g, "_") : "All";
  XLSX.writeFile(wb, `BAST_${cleanCustomer}_${cleanMonth}.xlsx`);
};
