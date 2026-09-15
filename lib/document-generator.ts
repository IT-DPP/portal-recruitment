import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } from "docx";
import { saveAs } from "file-saver";

export interface OfferingLetterData {
  nomorSurat: string;
  namaKandidat: string;
  posisi: string;
  namaPerusahaan: string;
  lokasi: string;
  startDate: Date | null;
  endDate: Date | null;
  totalBulan: number;
  tugasTanggungJawab: string; // HTML string
  hak: string; // HTML string
}

// Basic HTML to DOCX parser for Tiptap output
const parseHtmlToDocx = (htmlString: string): Paragraph[] => {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const paragraphs: Paragraph[] = [];

  doc.body.childNodes.forEach((node) => {
    if (node.nodeName === "P") {
      const textRuns: TextRun[] = [];
      node.childNodes.forEach((child) => {
        if (child.nodeName === "#text") {
          textRuns.push(new TextRun({ text: child.textContent || "" }));
        } else if (child.nodeName === "STRONG" || child.nodeName === "B") {
          textRuns.push(new TextRun({ text: child.textContent || "", bold: true }));
        } else if (child.nodeName === "EM" || child.nodeName === "I") {
          textRuns.push(new TextRun({ text: child.textContent || "", italics: true }));
        } else if (child.nodeName === "U") {
          textRuns.push(new TextRun({ text: child.textContent || "", underline: {} }));
        }
      });
      paragraphs.push(new Paragraph({ children: textRuns, spacing: { after: 120 } }));
    }
  });

  return paragraphs;
};

export const generateDocx = async (data: OfferingLetterData, logoUrl: string) => {
  try {
    // Fetch the logo and convert it to array buffer for the ImageRun
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Letterhead
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: { width: 100, height: 100 },
                  type: "png"
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "OFFERING LETTER", bold: true, size: 32 }), // 16pt
              ],
              spacing: { after: 240, before: 120 },
            }),
            
            // Meta Info
            new Paragraph({
              children: [
                new TextRun({ text: `Nomor: ${data.nomorSurat}`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Tanggal: ${new Date().toLocaleDateString("id-ID")}` }),
              ],
              spacing: { after: 240 },
            }),

            // Greeting
            new Paragraph({
              children: [
                new TextRun({ text: "Kepada Yth," }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Sdr/i. ${data.namaKandidat}`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Di Tempat" }),
              ],
              spacing: { after: 240 },
            }),

            // Opening
            new Paragraph({
              children: [
                new TextRun({ text: `Berdasarkan hasil proses seleksi, kami mewakili manajemen ${data.namaPerusahaan} dengan senang hati menawarkan posisi pekerjaan kepada Anda dengan rincian sebagai berikut:` }),
              ],
              spacing: { after: 120 },
            }),

            // Details
            new Paragraph({
              children: [
                new TextRun({ text: `Posisi: `, bold: true }),
                new TextRun({ text: data.posisi }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Lokasi Penempatan: `, bold: true }),
                new TextRun({ text: data.lokasi }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Masa Kontrak: `, bold: true }),
                new TextRun({ text: `${data.startDate?.toLocaleDateString("id-ID") || "-"} s/d ${data.endDate?.toLocaleDateString("id-ID") || "-"} (${data.totalBulan} Bulan)` }),
              ],
              spacing: { after: 240 },
            }),

            // Responsibilities Heading
            new Paragraph({
              children: [
                new TextRun({ text: "Tugas dan Tanggung Jawab:", bold: true, underline: {} }),
              ],
              spacing: { after: 120 },
            }),
            // Responsibilities Content
            ...parseHtmlToDocx(data.tugasTanggungJawab),

            new Paragraph({ spacing: { after: 120 } }), // spacer

            // Rights Heading
            new Paragraph({
              children: [
                new TextRun({ text: "Hak dan Fasilitas:", bold: true, underline: {} }),
              ],
              spacing: { after: 120 },
            }),
            // Rights Content
            ...parseHtmlToDocx(data.hak),

            new Paragraph({ spacing: { after: 360 } }), // spacer

            // Closing
            new Paragraph({
              children: [
                new TextRun({ text: "Demikian surat penawaran ini kami sampaikan. Harap dipelajari dan ditandatangani sebagai bentuk persetujuan." }),
              ],
              spacing: { after: 480 },
            }),

            // Signatures
            new Paragraph({
              children: [
                new TextRun({ text: "Hormat Kami," }),
              ],
              spacing: { after: 800 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "HR Department", bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: data.namaPerusahaan }),
              ],
            }),
          ],
        },
      ],
    });

    const blobResult = await Packer.toBlob(doc);
    saveAs(blobResult, `Offering_Letter_${data.namaKandidat.replace(/\s+/g, "_")}.docx`);
  } catch (error) {
    console.error("Error generating DOCX:", error);
    alert("Terjadi kesalahan saat membuat DOCX.");
  }
};

export const generatePdfFromElement = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    
    // A4 size in mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Terjadi kesalahan saat membuat PDF.");
  }
};
