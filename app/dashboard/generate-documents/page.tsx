"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { generateDocx, generatePdfFromElement } from "@/lib/document-generator";

// Simple Tiptap toolbar
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex gap-2 mb-2 p-2 bg-surface-container-low rounded-lg border border-table-border">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("bold") ? "bg-primary text-white text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"}`}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("italic") ? "bg-primary text-white text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"}`}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm ${editor.isActive("bulletList") ? "bg-primary text-white text-on-primary" : "bg-surface hover:bg-surface-container-high text-on-surface"}`}
      >
        Bullet List
      </button>
    </div>
  );
};

export default function GenerateDocumentsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any>({});

  const [documentType, setDocumentType] = useState("offering");
  const [nomorSurat, setNomorSurat] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [tugasHtml, setTugasHtml] = useState(
    "<p>1. Mematuhi peraturan K3LH yang berlaku di area operasi.</p><p>2. Mengoperasikan alat berat sesuai standar (SOP).</p>",
  );
  const [hakHtml, setHakHtml] = useState(
    "<p>1. Gaji pokok sebesar Rp X.XXX.XXX,-/bulan.</p><p>2. Tunjangan lokasi, akomodasi, dan tiket cuti sesuai kebijakan perusahaan.</p>",
  );

  const tugasEditor = useEditor({
    extensions: [StarterKit],
    content: tugasHtml,
    onUpdate: ({ editor }) => {
      setTugasHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base focus:outline-none min-h-[100px] border border-table-border rounded-lg p-3 bg-surface-container-lowest text-on-surface",
      },
    },
  });

  const hakEditor = useEditor({
    extensions: [StarterKit],
    content: hakHtml,
    onUpdate: ({ editor }) => {
      setHakHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base focus:outline-none min-h-[100px] border border-table-border rounded-lg p-3 bg-surface-container-lowest text-on-surface",
      },
    },
  });

  useEffect(() => {
    // Load local storage data
    const savedJobs = JSON.parse(localStorage.getItem("ugz_jobs") || "[]");
    const savedApps = JSON.parse(
      localStorage.getItem("ugz_applications") || "[]",
    );
    const savedCands = JSON.parse(
      localStorage.getItem("ugz_candidate_profiles") || "{}",
    );

    // Additional customer data to get company name
    const savedCustomers = JSON.parse(
      localStorage.getItem("ugz_master_customer") || "[]",
    );
    const savedSites = JSON.parse(
      localStorage.getItem("ugz_master_sites_operation") || "[]",
    );
    const savedCities = JSON.parse(
      localStorage.getItem("ugz_master_city") || "[]",
    );

    // Attach customerName and location to jobs for easier use later
    const enrichedJobs = savedJobs.map((j: any) => {
      const cust = savedCustomers.find((c: any) => c.id === j.customerId);
      const city = savedCities.find((c: any) => c.id === j.cityId);
      return {
        ...j,
        customerName: cust?.name || "Perusahaan",
        location: city?.name || "Site",
      };
    });

    setJobs(enrichedJobs);
    setApplications(savedApps);
    setCandidates(savedCands);
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // Get applications for the selected job that are "hired" (stage_6, stage_7, Completed)
  const hiredApplications = applications.filter((app) => {
    if (app.jobId !== selectedJobId) return false;
    return ["stage_6", "stage_7", "Completed"].includes(app.currentStage);
  });

  const selectedCandidateApp = hiredApplications.find(
    (app) => app.candidateId === selectedCandidateId,
  );
  const selectedCandidate = selectedCandidateApp
    ? candidates[selectedCandidateId]
    : null;

  // Calculate total months
  const calcTotalMonths = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;

    let months = (e.getFullYear() - s.getFullYear()) * 12;
    months -= s.getMonth();
    months += e.getMonth();
    return months <= 0 ? 0 : months;
  };

  const totalMonths = calcTotalMonths();

  const handleDownloadDocx = () => {
    if (!nomorSurat || !selectedJob || !selectedCandidate) {
      alert(
        "Harap lengkapi Nomor Surat, Lowongan Pekerjaan, dan Nama Kandidat.",
      );
      return;
    }

    const data = {
      nomorSurat,
      namaKandidat: selectedCandidate.fullName,
      posisi: selectedJob.posisi,
      namaPerusahaan: selectedJob.customerName,
      lokasi: selectedJob.location,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      totalBulan: totalMonths,
      tugasTanggungJawab: tugasHtml,
      hak: hakHtml,
    };

    generateDocx(data, "/icon.png");
  };

  const handleDownloadPdf = () => {
    if (!nomorSurat || !selectedJob || !selectedCandidate) {
      alert("Harap lengkapi form dengan benar.");
      return;
    }
    generatePdfFromElement(
      "pdf-template",
      `Offering_Letter_${selectedCandidate.fullName.replace(/\s+/g, "_")}`,
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-surface-container-lowest p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">
            Generate Documents
          </h1>
          <p className="text-sm text-on-surface-variant">
            Buat dan unduh dokumen Offering Letter untuk kandidat yang terpilih.
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-table-border shadow-sm space-y-6">
          {/* Tipe Dokumen */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">
              Tipe Dokumen
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full md:w-1/2 bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
            >
              <option value="offering">Offering Letter</option>
              <option value="bast">BAST</option>
              <option value="mcu">Pengantar MCU</option>
            </select>
          </div>

          {documentType === "offering" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nomor Surat */}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Nomor Surat
                  </label>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="001/HRD/OL/2026"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  />
                </div>

                {/* Lowongan Pekerjaan */}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Lowongan Pekerjaan
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      setSelectedCandidateId(""); // reset candidate
                    }}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  >
                    <option value="">-- Pilih Lowongan --</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.posisi} - {job.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama Kandidat */}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Nama Kandidat (Status Hired)
                  </label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    disabled={!selectedJobId || hiredApplications.length === 0}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface disabled:opacity-50"
                  >
                    <option value="">
                      {hiredApplications.length === 0 && selectedJobId
                        ? "-- Tidak ada kandidat hired --"
                        : "-- Pilih Kandidat --"}
                    </option>
                    {hiredApplications.map((app) => {
                      const cand = candidates[app.candidateId];
                      if (!cand) return null;
                      return (
                        <option key={cand.id} value={cand.id}>
                          {cand.fullName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Posisi (Auto) */}
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">
                    Posisi (Auto)
                  </label>
                  <input
                    type="text"
                    value={selectedJob ? selectedJob.posisi : ""}
                    readOnly
                    className="w-full bg-surface-container border border-table-border rounded-lg px-4 py-2.5 text-sm text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Masa Kontrak */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Masa Kontrak
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface sm:flex-1"
                  />
                  <span className="text-on-surface-variant hidden sm:inline">
                    s/d
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface sm:flex-1"
                  />
                  <div className="w-full sm:w-auto px-4 py-2.5 text-white bg-primary-container text-on-primary-container rounded-lg text-sm font-semibold text-center whitespace-nowrap">
                    Total: {totalMonths} Bulan
                  </div>
                </div>
              </div>

              {/* Tugas & Tanggung Jawab */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Tugas dan Tanggung Jawab
                </label>
                <MenuBar editor={tugasEditor} />
                <EditorContent editor={tugasEditor} />
              </div>

              {/* Hak */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Hak & Fasilitas
                </label>
                <MenuBar editor={hakEditor} />
                <EditorContent editor={hakEditor} />
              </div>

              <div className="pt-6 border-t border-table-border flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={handleDownloadPdf}
                  className="px-6 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadDocx}
                  className="px-6 py-2.5 text-white bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-primary/20 cursor-pointer"
                >
                  Download DOCX
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-surface-container-lowest rounded-xl border border-dashed border-table-border">
              <p className="text-on-surface-variant text-lg font-semibold">
                Form for this template document not set yet.
              </p>
              <p className="text-on-surface-variant text-sm mt-2">
                Pilih "Offering Letter" untuk melanjutkan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden PDF Template */}
      <div className="absolute opacity-0 -z-10 pointer-events-none w-[800px] left-[-9999px]">
        <div
          id="pdf-template"
          className="w-[800px] bg-white p-16 text-black font-serif"
        >
          <div className="flex flex-col items-center mb-10">
            <img
              src="/icon.png"
              alt="Logo"
              className="w-24 h-24 mb-4 object-contain"
            />
            <h1 className="text-2xl font-bold uppercase underline">
              Offering Letter
            </h1>
          </div>

          <div className="flex justify-between mb-8 text-[15px]">
            <div>
              <p>
                Nomor:{" "}
                <span className="font-bold">{nomorSurat || "......"}</span>
              </p>
            </div>
            <div>
              <p>Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
            </div>
          </div>

          <div className="mb-6 text-[15px]">
            <p>Kepada Yth,</p>
            <p className="font-bold">
              Sdr/i. {selectedCandidate?.fullName || "............"}
            </p>
            <p>Di Tempat</p>
          </div>

          <div className="mb-6 text-[15px]">
            <p className="text-justify leading-relaxed">
              Berdasarkan hasil proses seleksi, kami mewakili manajemen{" "}
              <strong>{selectedJob?.customerName || "............"}</strong>{" "}
              dengan senang hati menawarkan posisi pekerjaan kepada Anda dengan
              rincian sebagai berikut:
            </p>
          </div>

          <div className="mb-6 ml-4 text-[15px]">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr>
                  <td className="py-1 w-1/4 font-semibold align-top">Posisi</td>
                  <td className="py-1 w-4 align-top">:</td>
                  <td className="py-1 align-top">
                    {selectedJob?.posisi || "............"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold align-top">
                    Lokasi Penempatan
                  </td>
                  <td className="py-1 align-top">:</td>
                  <td className="py-1 align-top">
                    {selectedJob?.location || "............"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 font-semibold align-top">Masa Kontrak</td>
                  <td className="py-1 align-top">:</td>
                  <td className="py-1 align-top">
                    {startDate
                      ? new Date(startDate).toLocaleDateString("id-ID")
                      : "..."}{" "}
                    s/d{" "}
                    {endDate
                      ? new Date(endDate).toLocaleDateString("id-ID")
                      : "..."}{" "}
                    ({totalMonths} Bulan)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6 text-[15px]">
            <h3 className="font-bold underline mb-2">
              Tugas dan Tanggung Jawab:
            </h3>
            <div
              dangerouslySetInnerHTML={{ __html: tugasHtml }}
              className="text-black leading-relaxed prose-export"
            />
          </div>

          <div className="mb-8 text-[15px]">
            <h3 className="font-bold underline mb-2">Hak dan Fasilitas:</h3>
            <div
              dangerouslySetInnerHTML={{ __html: hakHtml }}
              className="text-black leading-relaxed prose-export"
            />
          </div>

          <div className="mb-12 text-[15px]">
            <p className="text-justify leading-relaxed">
              Demikian surat penawaran ini kami sampaikan. Harap dipelajari dan
              ditandatangani sebagai bentuk persetujuan.
            </p>
          </div>

          <div className="flex justify-end text-[15px]">
            <div className="text-center">
              <p className="mb-24">Hormat Kami,</p>
              <p className="font-bold underline mt-6">HR Department</p>
              <p>{selectedJob?.customerName || "Perusahaan"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
