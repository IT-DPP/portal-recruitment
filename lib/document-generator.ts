import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

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

export interface OfferingLetterDataV2 {
  type: "employee" | "internship";
  nomorSurat: string;
  perihal: string;
  nama: string;
  posisi: string;
  pointOfHire?: string;
  area: string;
  masaKontrak: string;
  rosterJamKerja?: string;
  tanggungJawab: string[];
  hak: string[];
  benefit: string[];
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
 * Generate Offering Letter DOCX (Employee & Internship)
 */
export const generateOfferingLetterDocx = async (
  data: OfferingLetterDataV2,
  logoUrl: string = "/logo_company.png"
) => {
  try {
    const arrayBuffer = await fetchLogoBuffer(logoUrl);
    const children: any[] = [];

    const tableNoBorders = {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    };

    // 1. Top Right Logo
    if (arrayBuffer) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              data: arrayBuffer,
              transformation: { width: 68, height: 55 },
              type: "png",
            }),
          ],
          spacing: { after: 30 },
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: "dian pandu pratama",
              bold: true,
              size: 18,
            }),
          ],
          spacing: { after: 140 },
        })
      );
    }

    // 2. Center Title (Only for internship OL)
    if (data.type === "internship") {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "SURAT PENAWARAN MAGANG",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 60, after: 30 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "(OFFERING LETTER)",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 160 },
        })
      );
    }

    // 3. Nomor & Perihal Table
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: "No.", bold: true })] })],
                borders: tableNoBorders,
              }),
              new TableCell({
                width: { size: 3, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
                borders: tableNoBorders,
              }),
              new TableCell({
                width: { size: 82, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: data.nomorSurat || "-", bold: true })] })],
                borders: tableNoBorders,
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: "Perihal", bold: true })] })],
                borders: tableNoBorders,
              }),
              new TableCell({
                width: { size: 3, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
                borders: tableNoBorders,
              }),
              new TableCell({
                width: { size: 82, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: data.perihal, bold: true })] })],
                borders: tableNoBorders,
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 120 } })
    );

    // 4. Opening Intro
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Sebagai tindak lanjut proses rekrutmen di PT Dian Pandu Pratama, berikut kami informasikan perincian hak dan benefit serta tugas dan tanggung jawab calon karyawan sebagaimana yang tercantum dalam kontrak kerja sebagai berikut:",
          }),
        ],
        spacing: { after: 120 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );

    // 5. Details Table
    const detailRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: "Nama", bold: true })] })],
            borders: tableNoBorders,
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
            borders: tableNoBorders,
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: data.nama })] })],
            borders: tableNoBorders,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: "Posisi", bold: true })] })],
            borders: tableNoBorders,
          }),
          new TableCell({
            width: { size: 3, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
            borders: tableNoBorders,
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: data.posisi })] })],
            borders: tableNoBorders,
          }),
        ],
      }),
    ];

    if (data.type === "employee") {
      detailRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Masa Kontrak", bold: true })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 3, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: data.masaKontrak || "-" })] })],
              borders: tableNoBorders,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Point Of Hire", bold: true })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 3, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: data.pointOfHire || "-" })] })],
              borders: tableNoBorders,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Area", bold: true })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 3, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: data.area || "-" })] })],
              borders: tableNoBorders,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Roster & Jam Kerja", bold: true })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 3, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: data.rosterJamKerja || "-" })],
                  alignment: AlignmentType.JUSTIFIED,
                }),
              ],
              borders: tableNoBorders,
            }),
          ],
        })
      );
    } else {
      // Internship
      detailRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Area", bold: true })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 3, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: data.area || "-" })] })],
              borders: tableNoBorders,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "Masa Kontrak", bold: true })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 3, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
              borders: tableNoBorders,
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: data.masaKontrak || "-" })] })],
              borders: tableNoBorders,
            }),
          ],
        })
      );
    }

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: detailRows,
      }),
      new Paragraph({ spacing: { after: 120 } })
    );

    // 6. Transition
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              data.type === "employee"
                ? "Kepada calon karyawan tersebut akan diberikan tanggung jawab dan memiliki Hak sebagai berikut:"
                : "Kepada calon Magang tersebut akan diberikan hak serta tugas dan tanggung jawab sebagai berikut:",
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // 7. Tanggung Jawab
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.type === "employee" ? "Tanggung Jawab:" : "Tugas dan Tanggung Jawab:",
            bold: true,
          }),
        ],
        spacing: { after: 40 },
      })
    );

    data.tanggungJawab.forEach((tj, idx) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${idx + 1}.  ${tj}` })],
          indent: { left: 360 },
          spacing: { after: 30 },
        })
      );
    });

    children.push(new Paragraph({ spacing: { after: 80 } }));

    // 8. Hak
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Hak:", bold: true })],
        spacing: { after: 40 },
      })
    );

    data.hak.forEach((h, idx) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${idx + 1}.  ${h}` })],
          indent: { left: 360 },
          spacing: { after: 30 },
        })
      );
    });

    // 9. Benefit (Internship & Employee if provided)
    if (data.benefit && data.benefit.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Benefit:", bold: true })],
          spacing: { before: 80, after: 40 },
        })
      );
      data.benefit.forEach((b, idx) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${idx + 1}.  ${b}` })],
            indent: { left: 360 },
            spacing: { after: 30 },
          })
        );
      });
    }

    // 10. BPJS Section (Employee only)
    if (data.type === "employee") {
      const bpjsPerusahaan = [
        "1. BPJS Ketenagakerjaan / JHT  : 3.7%",
        "2. BPJS Ketenagakerjaan / JKK  : 0.89%",
        "3. BPJS Ketenagakerjaan / JKM  : 0.3%",
        "4. BPJS Ketenagakerjaan / JP   : 2%",
        "5. BPJS Kesehatan              : 4%",
      ];
      const bpjsKaryawan = [
        "1. BPJS Ketenagakerjaan / JHT  : 2%",
        "2. BPJS Ketenagakerjaan / JP   : 1%",
        "3. BPJS Kesehatan              : 1%",
        "4. PPH21",
        "5. Potongan koperasi karyawan",
      ];

      children.push(
        new Paragraph({ spacing: { after: 60 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Ditanggung Perusahaan:", bold: true })],
                      spacing: { after: 40 },
                    }),
                    ...bpjsPerusahaan.map(
                      (item) =>
                        new Paragraph({
                          children: [new TextRun({ text: item, size: 20 })],
                          spacing: { after: 20 },
                        })
                    ),
                  ],
                  borders: tableNoBorders,
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Ditanggung Karyawan:", bold: true })],
                      spacing: { after: 40 },
                    }),
                    ...bpjsKaryawan.map(
                      (item) =>
                        new Paragraph({
                          children: [new TextRun({ text: item, size: 20 })],
                          spacing: { after: 20 },
                        })
                    ),
                  ],
                  borders: tableNoBorders,
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ spacing: { after: 100 } })
      );
    }

    // 11. Closing Paragraphs
    if (data.type === "employee") {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Demikian Surat Penawaran Kerja ini kami sampaikan." })],
          spacing: { before: 80, after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Atas perhatian dan kesediaan Saudara untuk bergabung bersama PT Dian Pandu Pratama, kami ucapkan terima kasih.",
            }),
          ],
          spacing: { after: 160 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Demikian Offering Letter ini kami sampaikan. Apabila Anda setuju dengan penawaran yang diberikan, silahkan tanda tangani offering letter ini di tempat yang sudah disediakan. Apabila masih ada hal-hal yang ingin ditanyakan seputar penawaran kerja ini, silahkan menghubungi tim recruitment untuk pertanyaan lebih lanjut. Atas perhatian dan Kerjasama kami ucapkan terima kasih.",
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, after: 160 },
        })
      );
    }

    // 12. Signatures Table
    const todayFormatted = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Cikarang, ${todayFormatted}` })],
        spacing: { after: 100 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Mengetahui," })], spacing: { after: 700 } }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: data.type === "employee" ? "Mursidi" : "Felix Deo Gratias",
                        bold: true,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text:
                          data.type === "employee"
                            ? "Recruitment & People Development Dept. Head"
                            : "Koordinator Recruitment HO",
                        size: 18,
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: tableNoBorders,
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: "Menyetujui," })],
                    spacing: { after: 700 },
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: data.nama, bold: true })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: data.type === "employee" ? "Calon Karyawan" : "Calon Karyawan Magang",
                        size: 18,
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: tableNoBorders,
              }),
            ],
          }),
        ],
      })
    );

    const doc = new Document({
      sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }],
    });

    const blobResult = await Packer.toBlob(doc);
    saveAs(blobResult, `Offering_Letter_${data.type === "internship" ? "Magang" : "Employee"}_${data.nama.replace(/\s+/g, "_")}.docx`);
  } catch (error) {
    console.error("Error generating Offering Letter DOCX:", error);
    alert("Terjadi kesalahan saat membuat file DOCX.");
  }
};

/**
 * Generate Offering Letter DOCX (Legacy)
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
  logoUrl: string = "/logo_company.png"
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

    // Extract HTML and substitute any logo paths with base64 data URI
    let elementHtml = element.outerHTML;
    if (base64Logo) {
      elementHtml = elementHtml.replace(
        /src=["'][^"']*(logo_company|icon)\.png[^"']*["']/gi,
        `src="${base64Logo}"`
      );
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
              padding: 0;
              margin: 0;
              line-height: 1.5;
              font-size: 13px;
            }
            h1 {
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 2px;
            }
            h2, h3 {
              font-size: 14px;
              font-weight: bold;
              margin-top: 8px;
              margin-bottom: 4px;
            }
            p {
              margin: 0 0 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td {
              padding: 2px 4px;
              vertical-align: top;
            }
            ul, ol {
              padding-left: 20px;
              margin: 4px 0;
            }
            li {
              margin-bottom: 2px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${elementHtml}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Ensure all images in iframeDoc have completed loading before rendering
    const iframeImgs = Array.from(iframeDoc.getElementsByTagName("img"));
    await Promise.all(
      iframeImgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 200));

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

    const targetElement = iframeDoc.getElementById(elementId) || iframeDoc.body;
    const canvas = await html2canvas(targetElement, {
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
  logoUrl: string = "/logo_company.png"
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
    elementHtml = elementHtml.replace(
      /src=["'][^"']*(logo_company|icon)\.png[^"']*["']/gi,
      `src="${base64Logo}"`
    );
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
            margin: 10mm 15mm;
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
            padding: 0;
            margin: 0;
          }
          h1 {
            font-size: 15pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2pt;
          }
          h2, h3 {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 8pt;
            margin-bottom: 4pt;
          }
          p {
            margin-bottom: 4pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 2pt 4pt;
            vertical-align: top;
          }
          ul, ol {
            padding-left: 18pt;
            margin: 4pt 0;
          }
          li {
            margin-bottom: 2pt;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${elementHtml}
      </body>
    </html>
  `);
  doc.close();

  // Wait for all images inside print iframe to load
  const printImgs = Array.from(doc.getElementsByTagName("img"));
  await Promise.all(
    printImgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  setTimeout(() => {
    printIframe.contentWindow?.focus();
    printIframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(printIframe)) {
        document.body.removeChild(printIframe);
      }
    }, 1500);
  }, 200);
};

export interface BastExcelMeta {
  customerName?: string;
  month?: string;
  nomorBast?: string;
  logoUrl?: string;
}

/**
 * Format date value to M/D/YYYY (e.g., 8/5/2026, 8/28/2026) without timezone shift
 */
const formatExcelDate = (val: any): string => {
  if (!val) return "-";
  if (typeof val === "string") {
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

/**
 * Generate Excel BAST Document with official layout, kop surat, logo, and formatted table
 */
export const generateBastExcel = async (
  rows: any[],
  meta?: BastExcelMeta
) => {
  if (!rows || rows.length === 0) {
    alert("Tidak ada data untuk diekspor ke Excel.");
    return;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "PT Dian Pandu Pratama";
  wb.created = new Date();

  const ws = wb.addWorksheet("BAST Serah Terima", {
    views: [{ showGridLines: true }],
  });

  // Set explicit column widths matching official layout
  ws.columns = [
    { key: "no", width: 6 },
    { key: "noRequest", width: 23 },
    { key: "noB1", width: 10 },
    { key: "tanggalTerimaB1", width: 18 },
    { key: "nama", width: 28 },
    { key: "nik", width: 22 },
    { key: "posisi", width: 22 },
    { key: "status", width: 14 },
    { key: "nrpDpp", width: 16 },
    { key: "areaKerja", width: 18 },
    { key: "awalKontrak", width: 16 },
    { key: "akhirKontrak", width: 16 },
    { key: "linkSertifikat", width: 44 },
    { key: "validasi", width: 12 },
  ];

  // 1. Fetch & Embed Logo
  const logoUrl = meta?.logoUrl || "/logo_company.png";
  const logoBuffer = await fetchLogoBuffer(logoUrl);
  if (logoBuffer) {
    try {
      const imageId = wb.addImage({
        buffer: logoBuffer,
        extension: "png",
      });
      ws.addImage(imageId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: 56, height: 42 },
        editAs: "oneCell",
      });
    } catch (e) {
      console.warn("Could not add logo to Excel sheet:", e);
    }
  }

  // 2. Company Subtitle below logo
  ws.mergeCells("A3:B3");
  const logoText = ws.getCell("A3");
  logoText.value = "dian pandu pratama";
  logoText.font = { name: "Calibri", size: 8, color: { argb: "595959" }, bold: true };
  logoText.alignment = { horizontal: "center", vertical: "middle" };

  // 3. Header Kop Surat (Centered over columns C to N)
  ws.mergeCells("C1:N1");
  const h1 = ws.getCell("C1");
  h1.value = "PT DIAN PANDU PRATAMA";
  h1.font = { name: "Calibri", size: 14, bold: true, color: { argb: "000000" } };
  h1.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("C2:N2");
  const h2 = ws.getCell("C2");
  h2.value = "Jl. Jababeka XII, Harja Mekar, Kec. Cikarang Utara, Kabupaten Bekasi, Jawa Barat 17530";
  h2.font = { name: "Calibri", size: 9.5, color: { argb: "000000" } };
  h2.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("C3:N3");
  const h3 = ws.getCell("C3");
  h3.value = "No Telp: (021) 8935016 | Email: dpp.all@dpp.co.id | Web: dpp.co.id";
  h3.font = { name: "Calibri", size: 9.5, color: { argb: "000000" } };
  h3.alignment = { horizontal: "center", vertical: "middle" };

  // Row Heights for Kop Surat
  ws.getRow(1).height = 24;
  ws.getRow(2).height = 18;
  ws.getRow(3).height = 18;
  ws.getRow(4).height = 12;

  // Bottom double border under Kop Surat (spanning columns A to N)
  for (let c = 1; c <= 14; c++) {
    const cell = ws.getRow(3).getCell(c);
    cell.border = {
      ...cell.border,
      bottom: { style: "double", color: { argb: "000000" } },
    };
  }

  // 4. Document Title Section
  ws.mergeCells("A5:N5");
  const t1 = ws.getCell("A5");
  t1.value = "LAMPIRAN BAST";
  t1.font = { name: "Calibri", size: 12, bold: true, color: { argb: "000000" } };
  t1.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(5).height = 20;

  ws.mergeCells("A6:N6");
  const t2 = ws.getCell("A6");
  t2.value = "PT Dian Pandu Pratama";
  t2.font = { name: "Calibri", size: 11, bold: true, color: { argb: "000000" } };
  t2.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(6).height = 18;

  ws.mergeCells("A7:N7");
  const t3 = ws.getCell("A7");
  t3.value = meta?.nomorBast?.trim() || "DPP/247/BASTMP/IX/2026";
  t3.font = { name: "Calibri", size: 11, bold: true, color: { argb: "000000" } };
  t3.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(7).height = 18;

  ws.getRow(8).height = 12;

  // 5. Introduction Paragraph
  ws.mergeCells("A9:N9");
  const introCell = ws.getCell("A9");
  introCell.value =
    "Pada hari ini telah diselesaikan proses Recruitment dari PT Dian Pandu Pratama atas permintaan Manpower yang telah diajukan sebelumnya oleh Pelanggan. Dengan ini kami menyerahkan Manpower ini sepenuhnya kepada pelanggan karena telah memenuhi standar dan kualifikasi yang diinginkan, dengan rincian sebagai berikut:";
  introCell.font = { name: "Calibri", size: 9.5, color: { argb: "000000" } };
  introCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  ws.getRow(9).height = 32;

  ws.getRow(10).height = 12;

  // 6. Table Header Row
  const headers = [
    "No",
    "No. Request",
    "No. B1",
    "Tanggal Terima B1",
    "Nama",
    "NIK",
    "Posisi",
    "Status",
    "NRP DPP",
    "Area Kerja",
    "Awal Kontrak",
    "Akhir Kontrak",
    "Link Sertifikat",
    "Validasi",
  ];

  const headerRow = ws.getRow(11);
  headerRow.height = 26;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "000000" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "BDD7EE" }, // Slate blue accent
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "000000" } },
      left: { style: "thin", color: { argb: "000000" } },
      bottom: { style: "thin", color: { argb: "000000" } },
      right: { style: "thin", color: { argb: "000000" } },
    };
  });

  // 7. Table Data Rows
  rows.forEach((row, idx) => {
    const rowNum = 12 + idx;
    const r = ws.getRow(rowNum);
    r.height = 21;

    // Normalizing values supporting both object structures
    const no = row.no ?? row["No"] ?? idx + 1;
    const noRequest = row.noRequest ?? row["No. Request"] ?? "-";
    const noB1 = row.noB1 ?? row["No. B1"] ?? row["No. Form B1"] ?? "-";
    const rawTglB1 = row.tanggalTerimaB1 ?? row["Tanggal Terima B1"] ?? "-";
    const nama = (row.nama ?? row["Nama"] ?? row["Nama Kandidat"] ?? "-").toUpperCase();
    const nik = String(row.nik ?? row["NIK"] ?? "-");
    const posisi = (row.posisi ?? row["Posisi"] ?? "-").toUpperCase();
    const status = (row.status ?? row["Status"] ?? "LOKAL").toUpperCase();
    const nrpDpp = String(row.nrpDpp ?? row["NRP DPP"] ?? "-");
    const areaKerja = (row.areaKerja ?? row["Area Kerja"] ?? "-").toUpperCase();
    const rawAwal = row.awalKontrak ?? row["Awal Kontrak"] ?? "-";
    const rawAkhir = row.akhirKontrak ?? row["Akhir Kontrak"] ?? "-";
    const linkSertifikat = row.linkSertifikat ?? row["Link Sertifikat"] ?? "-";
    const validasi = (row.validasi ?? row["Validasi"] ?? "VALID").toUpperCase();

    const values = [
      no,
      noRequest,
      noB1,
      formatExcelDate(rawTglB1),
      nama,
      nik,
      posisi,
      status,
      nrpDpp,
      areaKerja,
      formatExcelDate(rawAwal),
      formatExcelDate(rawAkhir),
      linkSertifikat,
      validasi,
    ];

    values.forEach((val, cIdx) => {
      const cell = r.getCell(cIdx + 1);

      // Handle Hyperlink for Certificate Link (Col 13)
      if (cIdx === 12 && val && val !== "-") {
        const strVal = String(val).trim();
        const isUrl = /^https?:\/\//i.test(strVal);

        if (isUrl) {
          let label = strVal;
          try {
            const urlObj = new URL(strVal);
            const pathParts = urlObj.pathname.split("/");
            const fn = pathParts[pathParts.length - 1];
            if (fn) label = decodeURIComponent(fn);
          } catch {}
          cell.value = {
            text: label,
            hyperlink: strVal,
          };
        } else {
          cell.value = strVal;
        }

        cell.font = {
          name: "Calibri",
          size: 10,
          color: { argb: "0563C1" },
          underline: true,
        };
      } else {
        cell.value = val;
        cell.font = { name: "Calibri", size: 10, color: { argb: "000000" } };
      }

      // Explicit string format for NIK & NRP to prevent scientific notation
      if (cIdx === 5 || cIdx === 8) {
        cell.numFmt = "@";
      }

      // Solid yellow fill as per requested BAST template layout
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF00" },
      };

      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "000000" } },
        left: { style: "thin", color: { argb: "000000" } },
        bottom: { style: "thin", color: { argb: "000000" } },
        right: { style: "thin", color: { argb: "000000" } },
      };
    });
  });

  // 8. Closing Paragraph
  const closingRowIndex = 12 + rows.length + 1;
  ws.getRow(closingRowIndex - 1).height = 12; // Spacing row

  ws.mergeCells(`A${closingRowIndex}:N${closingRowIndex}`);
  const closingCell = ws.getCell(`A${closingRowIndex}`);
  closingCell.value = {
    richText: [
      {
        text: "Demikian atas Surat Pernyataan & Berita Acara Serah Terima Manpower ini dibuat dengan sebenar - benarnya, selanjutnya untuk proses penagihan atas Manpower ini dimulai sejak ",
        font: { name: "Calibri", size: 9.5, color: { argb: "000000" } },
      },
      {
        text: "Awal Kontrak PKWT Dibuat.",
        font: { name: "Calibri", size: 9.5, bold: true, color: { argb: "000000" } },
      },
    ],
  };
  closingCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  ws.getRow(closingRowIndex).height = 26;

  // 9. Generate & Trigger Download via file-saver
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanMonth = meta?.month ? meta.month.replace("-", "_") : "Report";
  const cleanCustomer = meta?.customerName
    ? meta.customerName.replace(/[^a-zA-Z0-9]/g, "_")
    : "All";
  saveAs(blob, `BAST_${cleanCustomer}_${cleanMonth}.xlsx`);
};
