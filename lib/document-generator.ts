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
