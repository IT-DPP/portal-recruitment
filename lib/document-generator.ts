import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
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

export interface McuBatchCandidate {
  no: number;
  nama: string;
  nik: string;
  posisi: string;
  kategori: string;
  paketMcu: string;
}

export interface McuBatchDocumentData {
  nomorSurat: string;
  perihal?: string;
  klinikNama: string;
  klinikAlamat: string;
  candidates: McuBatchCandidate[];
  picNama?: string;
  picJabatan?: string;
  picTelepon?: string;
  emails?: string[];
  billingPerusahaan?: string;
  billingUp?: string;
  billingAlamat?: string;
  kota?: string;
  tanggalSurat?: string;
  signeeNama?: string;
  signeeJabatan?: string;
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
 * Generate Batch Surat Pengantar MCU DOCX with candidate table matching official DPP format
 */
export const generateMcuBatchDocx = async (
  data: McuBatchDocumentData,
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

    // 2. No Surat & Perihal
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: "No. Surat", bold: true })] })],
                borders: tableNoBorders,
              }),
              new TableCell({
                width: { size: 3, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: ":" })] })],
                borders: tableNoBorders,
              }),
              new TableCell({
                width: { size: 82, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: data.nomorSurat, bold: true })] })],
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
                children: [new Paragraph({ children: [new TextRun({ text: data.perihal || "Surat Pengantar MCU", bold: true })] })],
                borders: tableNoBorders,
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 120 } })
    );

    // 3. Recipient
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Kepada Yth," })], spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: data.klinikNama, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: data.klinikAlamat, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: "Di-Tempat", bold: true })], spacing: { after: 140 } }),
      new Paragraph({ children: [new TextRun({ text: "Dengan Hormat," })], spacing: { after: 40 } }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Mohon untuk dapat diberikan pelayanan medis kepada karyawan PT. Dian Pandu Pratama, berikut :",
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // 4. Candidate Table
    const tableHeaderBorders = {
      top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    };

    const headerCells = [
      { text: "NO", width: 6 },
      { text: "NAMA", width: 24 },
      { text: "NIK", width: 20 },
      { text: "POSISI", width: 16 },
      { text: "KATEGORI", width: 14 },
      { text: "PAKET MCU", width: 20 },
    ].map(
      (col) =>
        new TableCell({
          width: { size: col.width, type: WidthType.PERCENTAGE },
          shading: { fill: "D5DFB5" },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: col.text, bold: true, size: 18 })],
            }),
          ],
          borders: tableHeaderBorders,
        })
    );

    const bodyRows = data.candidates.map((cand, idx) => {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), size: 18 })] })],
            borders: tableHeaderBorders,
          }),
          new TableCell({
            width: { size: 24, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cand.nama.toUpperCase(), bold: true, size: 18 })] })],
            borders: tableHeaderBorders,
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cand.nik, size: 18 })] })],
            borders: tableHeaderBorders,
          }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cand.posisi.toUpperCase(), size: 18 })] })],
            borders: tableHeaderBorders,
          }),
          new TableCell({
            width: { size: 14, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cand.kategori.toUpperCase(), size: 18 })] })],
            borders: tableHeaderBorders,
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cand.paketMcu, size: 16 })] })],
            borders: tableHeaderBorders,
          }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: headerCells }), ...bodyRows],
      }),
      new Paragraph({ spacing: { after: 120 } })
    );

    // 5. Follow-up Details
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Apabila yang bersangkutan memerlukan tindakan medis lebih lanjut harap segera menghubungi :",
          }),
        ],
        spacing: { after: 40 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Nama" })] })], borders: tableNoBorders }),
              new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: tableNoBorders }),
              new TableCell({ width: { size: 77, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.picNama || "Annisa Nur Cahya Rahmadani", bold: true })] })], borders: tableNoBorders }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Jabatan" })] })], borders: tableNoBorders }),
              new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: tableNoBorders }),
              new TableCell({ width: { size: 77, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.picJabatan || "Recruitment Staff" })] })], borders: tableNoBorders }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "No. Telepon" })] })], borders: tableNoBorders }),
              new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":" })] })], borders: tableNoBorders }),
              new TableCell({ width: { size: 77, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.picTelepon || "0895-2305-7314" })] })], borders: tableNoBorders }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 80 } }),
      new Paragraph({
        children: [new TextRun({ text: "Kemudian untuk hasil MCU (WAJIB) harap dikirimkan ke :" })],
        spacing: { after: 30 },
      })
    );

    const emailList = data.emails && data.emails.length > 0 ? data.emails : [
      "annisa.rahmadani@dpp.co.id",
      "indrajid.k@dpp.co.id",
      "RecruitmentTeam@dpp.co.id",
      "m.hidayat@dpp.co.id",
      "pretty.tm@dpp.co.id",
      "deo.felix@dpp.co.id",
    ];

    emailList.forEach((email) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `•  ${email}`, color: "0000EE", underline: {} })],
          indent: { left: 240 },
          spacing: { after: 20 },
        })
      );
    });

    // 6. Billing
    children.push(
      new Paragraph({ spacing: { after: 60 } }),
      new Paragraph({
        children: [new TextRun({ text: "Tagihan biaya resume medis harap dikirimkan ke:" })],
        indent: { left: 240 },
        spacing: { after: 20 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.billingPerusahaan || "PT. Dian Pandu Pratama", bold: true })],
        indent: { left: 280 },
        spacing: { after: 20 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Up : " }),
          new TextRun({ text: data.billingUp || "M Irfan Dzul Izzudin/ irfandzul@dpp.co.id" }),
        ],
        indent: { left: 280 },
        spacing: { after: 20 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: data.billingAlamat || "Jl. Jababeka Blok I Kawasan Industri Jababeka (Patria Pos 7) Desa Harja Mekar, Kec. Cikarang Utara, Kab. Bekasi, Jawa Barat, 17530",
          }),
        ],
        indent: { left: 280 },
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Atas perhatian dan kerjasamanya kami ucapkan terima kasih." })],
        spacing: { after: 120 },
      })
    );

    // 7. Closing & Signature
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${data.kota || "Cikarang"}, ${data.tanggalSurat || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` })],
        spacing: { after: 40 },
      }),
      new Paragraph({ children: [new TextRun({ text: "Hormat kami," })] }),
      new Paragraph({ children: [new TextRun({ text: "PT. Dian Pandu Pratama", bold: true })], spacing: { after: 450 } }),
      new Paragraph({ children: [new TextRun({ text: data.signeeNama || "Mursidi", bold: true, underline: {} })] }),
      new Paragraph({ children: [new TextRun({ text: data.signeeJabatan || "Recruitment & Development Dept. Head" })] })
    );

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    const cleanSuratNo = (data.nomorSurat || "MCU").replace(/[\/\\]/g, "_");
    const blobResult = await Packer.toBlob(doc);
    saveAs(blobResult, `Surat_Pengantar_MCU_${cleanSuratNo}.docx`);
  } catch (error) {
    console.error("Error generating Batch MCU DOCX:", error);
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
 * Build Excel BAST Workbook and return ArrayBuffer & Blob for downloading or archiving
 */
export const buildBastExcelWorkbook = async (
  rows: any[],
  meta?: BastExcelMeta
): Promise<{ buffer: ArrayBuffer; blob: Blob; fileName: string }> => {
  if (!rows || rows.length === 0) {
    throw new Error("Tidak ada data untuk diekspor ke Excel.");
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

  // 9. Generate Buffer
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanMonth = meta?.month ? meta.month.replace("-", "_") : "Report";
  const cleanCustomer = meta?.customerName
    ? meta.customerName.replace(/[^a-zA-Z0-9]/g, "_")
    : "All";
  const fileName = `BAST_${cleanCustomer}_${cleanMonth}.xlsx`;

  return { buffer, blob, fileName };
};

/**
 * Generate Excel BAST Document with official layout, kop surat, logo, and formatted table
 */
export const generateBastExcel = async (
  rows: any[],
  meta?: BastExcelMeta
) => {
  try {
    const { blob, fileName } = await buildBastExcelWorkbook(rows, meta);
    saveAs(blob, fileName);
  } catch (error: any) {
    console.error("Error generating Excel BAST:", error);
    alert(error?.message || "Terjadi kesalahan saat memproses file Excel BAST.");
  }
};

export interface BastStatementPdfMeta {
  nomorBast?: string;
  customerName?: string;
  month?: string;
  date?: string;
  logoUrl?: string;
  pihakPertamaName?: string;
  pihakPertamaTitle?: string;
  pihakKeduaName?: string;
  pihakKeduaTitle?: string;
}

/**
 * Format date to Indonesian formal wording
 */
const formatIndonesianDate = (dateObj: Date): string => {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Convert number to Indonesian words (terbilang)
 */
const angkaTerbilang = (n: number): string => {
  const words = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima",
    "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];
  if (n < 12) return words[n];
  if (n < 20) return `${angkaTerbilang(n - 10)} Belas`;
  if (n < 100) return `${angkaTerbilang(Math.floor(n / 10))} Puluh ${angkaTerbilang(n % 10)}`.trim();
  if (n < 200) return `Seratus ${angkaTerbilang(n - 100)}`.trim();
  if (n < 1000) return `${angkaTerbilang(Math.floor(n / 100))} Ratus ${angkaTerbilang(n % 100)}`.trim();
  return String(n);
};

/**
 * Build official Surat Pernyataan BAST Manpower Handover PDF Document
 */
export const buildBastStatementLetterPdfBlob = async (
  rows: any[],
  meta?: BastStatementPdfMeta
): Promise<{ blob: Blob; buffer: ArrayBuffer; fileName: string }> => {
  const jsPdfModule = await import("jspdf");
  const jsPDFClass =
    typeof jsPdfModule.jsPDF === "function"
      ? jsPdfModule.jsPDF
      : typeof jsPdfModule.default === "function"
      ? jsPdfModule.default
      : (jsPdfModule as any);

  const doc = new jsPDFClass({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  const now = new Date();
  const tanggalSurat = meta?.date || formatIndonesianDate(now);
  const cleanCustomer = meta?.customerName || "Customer Partner";
  const nomorBast = meta?.nomorBast?.trim() || "DPP/247/BASTMP/IX/2026";

  // Function to render Kop Surat Header
  const renderKopSurat = async (pageDoc: any) => {
    try {
      const logoUrl = meta?.logoUrl || "/logo_company.png";
      const logoB64 = await getBase64FromUrl(logoUrl);
      if (logoB64) {
        pageDoc.addImage(logoB64, "PNG", marginX, 10, 24, 18);
      }
    } catch (e) {
      console.warn("Logo embedding skipped:", e);
    }

    pageDoc.setFont("helvetica", "bold");
    pageDoc.setFontSize(13);
    pageDoc.setTextColor(15, 76, 129); // #0F4C81 DPP primary blue
    pageDoc.text("PT DIAN PANDU PRATAMA", marginX + 30, 16);

    pageDoc.setFont("helvetica", "normal");
    pageDoc.setFontSize(8.5);
    pageDoc.setTextColor(60, 60, 60);
    pageDoc.text(
      "Jl. Jababeka XII, Harja Mekar, Kec. Cikarang Utara, Kabupaten Bekasi, Jawa Barat 17530",
      marginX + 30,
      21
    );
    pageDoc.text(
      "No Telp: (021) 8935016 | Email: dpp.all@dpp.co.id | Website: www.dpp.co.id",
      marginX + 30,
      25.5
    );

    // Double divider line
    pageDoc.setDrawColor(15, 76, 129);
    pageDoc.setLineWidth(0.8);
    pageDoc.line(marginX, 31, marginX + contentWidth, 31);
    pageDoc.setLineWidth(0.2);
    pageDoc.line(marginX, 32.2, marginX + contentWidth, 32.2);
  };

  await renderKopSurat(doc);

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  const titleText = "SURAT PERNYATAAN & BERITA ACARA SERAH TERIMA MANPOWER";
  doc.text(titleText, pageWidth / 2, 40, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Nomor: ${nomorBast}`, pageWidth / 2, 45, { align: "center" });

  // Preamble
  let cursorY = 53;
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  const openingText =
    `Pada hari ini, ${tanggalSurat}, bertempat di Cikarang, Jawa Barat, kami yang bertanda tangan di bawah ini:`;
  doc.text(openingText, marginX, cursorY);
  cursorY += 6;

  // Pihak Pertama & Kedua Box
  doc.setFont("helvetica", "bold");
  doc.text("1.  PIHAK PERTAMA", marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(
    ":  PT DIAN PANDU PRATAMA, bertindak selaku Penyedia Jasa Manpower / Tenaga Kerja.",
    marginX + 36,
    cursorY
  );
  cursorY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("2.  PIHAK KEDUA", marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.text(
    `:  ${cleanCustomer.toUpperCase()}, bertindak selaku Pengguna Jasa Manpower (Client).`,
    marginX + 36,
    cursorY
  );
  cursorY += 8;

  // Pernyataan
  doc.setFont("helvetica", "bold");
  doc.text(
    "Dengan ini PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama menyatakan dan menyepakati bahwa:",
    marginX,
    cursorY
  );
  cursorY += 6;

  doc.setFont("helvetica", "normal");
  const clauses = [
    `1.  PIHAK PERTAMA telah melaksanakan dan menyelesaikan seluruh tahapan proses rekrutmen, seleksi administrasi, verifikasi keaslian sertifikasi kompetensi keahlian/BNSP, uji keahlian teknis, dan evaluasi medis (Medical Check-Up Fit to Work) terhadap calon tenaga kerja sesuai dengan kualifikasi standar yang disyaratkan oleh PIHAK KEDUA.`,
    `2.  PIHAK PERTAMA menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menerima secara resmi sejumlah ${rows.length} (${angkaTerbilang(rows.length)}) orang Tenaga Kerja terlampir untuk ditempatkan pada posisi dan lokasi operasional yang disepakati.`,
    `3.  Seluruh berkas dokumen pendukung berupa Sertifikat Kompetensi Asli milik kandidat serta Bukti Audit Validasi Sertifikat oleh Recruiter telah disertakan lengkap sebagai bagian yang tidak terpisahkan dari Berita Acara Serah Terima ini.`,
    `4.  Terhitung sejak tanggal awal kontrak/penempatan masing-masing tenaga kerja, maka proses operasional serta perhitungan biaya penagihan (billing rate / invoicing) atas penyediaan manpower ini resmi berlaku.`
  ];

  clauses.forEach((clause) => {
    const splitClause = doc.splitTextToSize(clause, contentWidth);
    doc.text(splitClause, marginX, cursorY);
    cursorY += splitClause.length * 4.3 + 2;
  });

  cursorY += 2;

  // Compact Summary Table of Manpower
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 76, 129);
  doc.text(`RINGKASAN TENAGA KERJA YANG DISERAH TERIMAKAN (${rows.length} ORANG):`, marginX, cursorY);
  cursorY += 5;

  // Table header
  const colX = [marginX, marginX + 8, marginX + 38, marginX + 88, marginX + 130, marginX + 155];
  const colWidths = [8, 30, 50, 42, 25, 19];

  doc.setFillColor(189, 215, 238); // Soft blue header
  doc.rect(marginX, cursorY, contentWidth, 6, "F");
  doc.setDrawColor(180, 180, 180);
  doc.rect(marginX, cursorY, contentWidth, 6, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("NO", colX[0] + 4, cursorY + 4.2, { align: "center" });
  doc.text("NRP DPP", colX[1] + 2, cursorY + 4.2);
  doc.text("NAMA LENGKAP", colX[2] + 2, cursorY + 4.2);
  doc.text("POSISI JABATAN", colX[3] + 2, cursorY + 4.2);
  doc.text("AREA / SITE", colX[4] + 2, cursorY + 4.2);
  doc.text("AWAL PKWT", colX[5] + 2, cursorY + 4.2);
  cursorY += 6;

  // Render first 8 candidates on Page 1 or summary
  const previewRows = rows.slice(0, 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  previewRows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, cursorY, contentWidth, 5, "F");
    }
    doc.setDrawColor(220, 220, 220);
    doc.rect(marginX, cursorY, contentWidth, 5, "S");

    const nama = (r.nama || "-").length > 25 ? (r.nama || "-").substring(0, 24) + ".." : r.nama || "-";
    const pos = (r.posisi || "-").length > 22 ? (r.posisi || "-").substring(0, 21) + ".." : r.posisi || "-";
    const site = (r.areaKerja || "-").length > 13 ? (r.areaKerja || "-").substring(0, 12) + ".." : r.areaKerja || "-";

    doc.text(String(idx + 1), colX[0] + 4, cursorY + 3.6, { align: "center" });
    doc.text(String(r.nrpDpp || "-"), colX[1] + 2, cursorY + 3.6);
    doc.text(nama.toUpperCase(), colX[2] + 2, cursorY + 3.6);
    doc.text(pos.toUpperCase(), colX[3] + 2, cursorY + 3.6);
    doc.text(site.toUpperCase(), colX[4] + 2, cursorY + 3.6);
    doc.text(formatExcelDate(r.awalKontrak), colX[5] + 2, cursorY + 3.6);
    cursorY += 5;
  });

  if (rows.length > 7) {
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, cursorY, contentWidth, 5, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `* Dan ${rows.length - 7} tenaga kerja lainnya sebagaimana tertera lengkap pada Dokumen Lampiran Excel BAST.`,
      marginX + 4,
      cursorY + 3.6
    );
    cursorY += 7;
  } else {
    cursorY += 3;
  }

  // Closing Sentence
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  const closingText =
    "Demikian Surat Pernyataan & Berita Acara Serah Terima Manpower ini dibuat dengan sebenar-benarnya dalam rangkap 2 (dua) bermaterai cukup dan mempunyai kekuatan hukum yang sama bagi Para Pihak.";
  const splitClosing = doc.splitTextToSize(closingText, contentWidth);
  doc.text(splitClosing, marginX, cursorY);
  cursorY += splitClosing.length * 4.2 + 6;

  // Signature Block
  const sigCol1X = marginX + 15;
  const sigCol2X = marginX + contentWidth - 65;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("PIHAK PERTAMA,", sigCol1X, cursorY);
  doc.text("PIHAK KEDUA,", sigCol2X, cursorY);
  cursorY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.text("PT Dian Pandu Pratama", sigCol1X, cursorY);
  doc.text(cleanCustomer, sigCol2X, cursorY);
  cursorY += 7;

  // Materai box on Pihak Pertama side
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1, 1], 0);
  doc.rect(sigCol1X + 2, cursorY, 24, 14, "S");
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text("MATERAI", sigCol1X + 14, cursorY + 6.5, { align: "center" });
  doc.text("Rp 10.000", sigCol1X + 14, cursorY + 10, { align: "center" });
  doc.setLineDashPattern([], 0); // reset dash

  cursorY += 20;

  // Signature lines & names
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  const pihak1Name = meta?.pihakPertamaName || "(  HR & Recruitment Manager  )";
  const pihak2Name = meta?.pihakKeduaName || "(  Authorized Site Representative  )";

  doc.text(pihak1Name, sigCol1X, cursorY);
  doc.text(pihak2Name, sigCol2X, cursorY);
  cursorY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  doc.text("PT Dian Pandu Pratama", sigCol1X, cursorY);
  doc.text(cleanCustomer, sigCol2X, cursorY);

  const cleanNum = nomorBast.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Surat_Pernyataan_BAST_${cleanNum}.pdf`;
  const buffer = doc.output("arraybuffer");
  const blob = new Blob([buffer], { type: "application/pdf" });

  return { blob, buffer, fileName };
};

/**
 * Generate and trigger download for Surat Pernyataan BAST PDF
 */
export const generateBastStatementLetterPDF = async (
  rows: any[],
  meta?: BastStatementPdfMeta
) => {
  try {
    const { blob, fileName } = await buildBastStatementLetterPdfBlob(rows, meta);
    saveAs(blob, fileName);
  } catch (error: any) {
    console.error("Error generating Surat Pernyataan BAST PDF:", error);
    alert(error?.message || "Terjadi kesalahan saat memproses Surat Pernyataan BAST PDF.");
  }
};

export interface BastCandidateItem {
  appId: string;
  nama: string;
  nik: string;
  nrp?: string;
  posisi?: string;
  areaKerja?: string;
}

export interface BastZipProgress {
  step: number;
  totalSteps: number;
  message: string;
  percent: number;
}

/**
 * Generate complete BAST ZIP Package containing:
 * 1. 01_Excel_BAST/ (Excel file with Kop Surat & Candidate Table)
 * 2. 02_Surat_Pernyataan/ (PDF Handover Statement Letter)
 * 3. 03_Dokumen_Sertifikat_Kandidat/ (Original candidate certificates)
 * 4. 04_Bukti_Validasi_Recruiter/ (Recruiter audit validation proofs)
 * 5. CATATAN_KELENGKAPAN_DOKUMEN.txt (Audit report for missing files if any)
 */
export const generateBastZipPackage = async (
  rows: any[],
  candidates: BastCandidateItem[],
  meta?: BastExcelMeta,
  onProgress?: (p: BastZipProgress) => void
) => {
  if (!rows || rows.length === 0) {
    throw new Error("Pilih minimal satu kandidat untuk diekspor ke paket BAST.");
  }

  const JSZipModule = await import("jszip");
  const JSZipClass = (JSZipModule as any).default || JSZipModule;
  const zip = new JSZipClass();

  const totalSteps = 5;
  const missingCertificates: string[] = [];
  const missingValidations: string[] = [];

  // Helper sanitization
  const sanitize = (str: string) =>
    (str || "Dokumen").replace(/[\/\\?%*:|"<>]/g, "_").trim();

  // STEP 1: Generate Excel BAST
  onProgress?.({
    step: 1,
    totalSteps,
    message: "Menyiapkan file spreadsheet Excel BAST...",
    percent: 15,
  });

  const { buffer: excelBuffer, fileName: excelFileName } =
    await buildBastExcelWorkbook(rows, meta);
  const excelFolder = zip.folder("01_Excel_BAST");
  excelFolder.file(excelFileName, excelBuffer);

  // STEP 2: Generate Surat Pernyataan BAST PDF
  onProgress?.({
    step: 2,
    totalSteps,
    message: "Membuat Surat Pernyataan Serah Terima Manpower (PDF)...",
    percent: 30,
  });

  const { buffer: pdfBuffer, fileName: pdfFileName } =
    await buildBastStatementLetterPdfBlob(rows, {
      nomorBast: meta?.nomorBast,
      customerName: meta?.customerName,
      month: meta?.month,
      logoUrl: meta?.logoUrl,
    });
  const pdfFolder = zip.folder("02_Surat_Pernyataan");
  pdfFolder.file(pdfFileName, pdfBuffer);

  // STEP 3: Download Candidate Certificates
  onProgress?.({
    step: 3,
    totalSteps,
    message: `Mengumpulkan berkas sertifikat kandidat (0/${candidates.length})...`,
    percent: 45,
  });

  const certFolder = zip.folder("03_Dokumen_Sertifikat_Kandidat");
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    const nrpTag = cand.nrp ? sanitize(cand.nrp) : `NIK_${sanitize(cand.nik)}`;
    const nameTag = sanitize(cand.nama);

    try {
      const res = await fetch(
        `/api/documents/bast-file-proxy?appId=${cand.appId}&docType=candidate_cert`
      );

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const cType = res.headers.get("content-type") || "";
        const ext = cType.includes("pdf") ? "pdf" : "jpg";
        const fname = `${nrpTag}_${nameTag}_Sertifikat.${ext}`;
        certFolder.file(fname, arrayBuf);
      } else {
        missingCertificates.push(
          `${cand.nama} (NRP: ${cand.nrp || "-"}, NIK: ${cand.nik}) - Belum ada sertifikat terunggah`
        );
      }
    } catch (e) {
      missingCertificates.push(
        `${cand.nama} (NRP: ${cand.nrp || "-"}, NIK: ${cand.nik}) - Gagal mengunduh berkas`
      );
    }

    const currentPercent = 45 + Math.round(((i + 1) / candidates.length) * 20);
    onProgress?.({
      step: 3,
      totalSteps,
      message: `Mengumpulkan berkas sertifikat kandidat (${i + 1}/${candidates.length})...`,
      percent: currentPercent,
    });
  }

  // STEP 4: Download Recruiter Validation Proofs
  onProgress?.({
    step: 4,
    totalSteps,
    message: `Mengumpulkan berkas bukti validasi recruiter (0/${candidates.length})...`,
    percent: 70,
  });

  const validFolder = zip.folder("04_Bukti_Validasi_Recruiter");
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    const nrpTag = cand.nrp ? sanitize(cand.nrp) : `NIK_${sanitize(cand.nik)}`;
    const nameTag = sanitize(cand.nama);

    try {
      const res = await fetch(
        `/api/documents/bast-file-proxy?appId=${cand.appId}&docType=recruiter_validation`
      );

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const cType = res.headers.get("content-type") || "";
        const ext = cType.includes("pdf") ? "pdf" : "jpg";
        const fname = `${nrpTag}_${nameTag}_BuktiValidasi.${ext}`;
        validFolder.file(fname, arrayBuf);
      } else {
        missingValidations.push(
          `${cand.nama} (NRP: ${cand.nrp || "-"}, NIK: ${cand.nik}) - Bukti validasi belum diunggah recruiter`
        );
      }
    } catch (e) {
      missingValidations.push(
        `${cand.nama} (NRP: ${cand.nrp || "-"}, NIK: ${cand.nik}) - Gagal mengunduh berkas validasi`
      );
    }

    const currentPercent = 70 + Math.round(((i + 1) / candidates.length) * 20);
    onProgress?.({
      step: 4,
      totalSteps,
      message: `Mengumpulkan berkas bukti validasi recruiter (${i + 1}/${candidates.length})...`,
      percent: currentPercent,
    });
  }

  // Audit text log if any documents were missing
  const reportLines = [
    "================================================================================",
    "CATATAN AUDIT KELENGKAPAN BERKAS PAKET BAST MANPOWER",
    "PT DIAN PANDU PRATAMA",
    "================================================================================",
    `Nomor BAST    : ${meta?.nomorBast || "-"}`,
    `Customer      : ${meta?.customerName || "-"}`,
    `Periode       : ${meta?.month || "-"}`,
    `Tanggal Unduh : ${new Date().toLocaleString("id-ID")}`,
    `Total Kandidat: ${candidates.length} orang`,
    "",
    "STATUS BERKAS SERTIFIKAT KANDIDAT:",
    missingCertificates.length === 0
      ? "  [OK] Seluruh kandidat memiliki berkas sertifikat lengkap."
      : missingCertificates.map((m) => `  [BELUM LENGKAP] ${m}`).join("\n"),
    "",
    "STATUS BUKTI VALIDASI SERTIFIKAT OLEH RECRUITER (STAGE ADMINISTRASI):",
    missingValidations.length === 0
      ? "  [OK] Seluruh kandidat memiliki bukti validasi lengkap."
      : missingValidations.map((m) => `  [BELUM LENGKAP] ${m}`).join("\n"),
    "",
    "================================================================================",
    "Catatan ini dihasilkan secara otomatis oleh sistem E-Recruitment PT Dian Pandu Pratama",
    "sebagai lampiran transparansi audit kelayakan dokumen serah terima manpower.",
    "================================================================================"
  ];
  zip.file("CATATAN_KELENGKAPAN_DOKUMEN.txt", reportLines.join("\n"));

  // STEP 5: Compression & Finalizing
  onProgress?.({
    step: 5,
    totalSteps,
    message: "Mengompresi berkas ke dalam format ZIP...",
    percent: 92,
  });

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata: { percent: number }) => {
      onProgress?.({
        step: 5,
        totalSteps,
        message: `Mengompresi berkas ZIP (${Math.round(metadata.percent)}%)...`,
        percent: 90 + Math.round(metadata.percent * 0.08),
      });
    }
  );

  onProgress?.({
    step: 5,
    totalSteps,
    message: "Pengunduhan selesai!",
    percent: 100,
  });

  const cleanMonth = meta?.month ? meta.month.replace("-", "_") : "Report";
  const cleanCustomer = meta?.customerName
    ? meta.customerName.replace(/[^a-zA-Z0-9]/g, "_")
    : "All";
  const zipFileName = `BAST_PACKAGE_${cleanCustomer}_${cleanMonth}.zip`;

  saveAs(zipBlob, zipFileName);

  return {
    success: true,
    totalCandidates: candidates.length,
    missingCertificatesCount: missingCertificates.length,
    missingValidationsCount: missingValidations.length,
  };
};
