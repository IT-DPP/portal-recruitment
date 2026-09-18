"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { generateDocx, generatePdfFromElement } from "@/lib/document-generator";
import * as XLSX from "xlsx";


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

  // BAST States
  const [bastMonth, setBastMonth] = useState("");
  const [bastCustomerId, setBastCustomerId] = useState("");
  const [bastSelectedAreas, setBastSelectedAreas] = useState<string[]>([]);
  const [bastSelectedJobs, setBastSelectedJobs] = useState<string[]>([]);
  const [bastSelectedCandidates, setBastSelectedCandidates] = useState<string[]>([]);
  const [bastInputs, setBastInputs] = useState<any>({});
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);


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

    setCustomers(savedCustomers);
    setSites(savedSites);

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

  
  // --- BAST Logic ---
  const availableBastJobs = jobs.filter((j) => {
    if (!bastMonth || !bastCustomerId) return false;
    if (j.customerId !== bastCustomerId) return false;
    
    // Match month based on tanggalMasuk
    if (j.tanggalMasuk) {
      const jobMonth = j.tanggalMasuk.substring(0, 7); // YYYY-MM
      if (jobMonth !== bastMonth) return false;
    } else {
      return false;
    }

    if (bastSelectedAreas.length > 0) {
      if (!bastSelectedAreas.includes(j.siteId)) return false;
    }

    return true;
  });

  const availableBastCandidates = applications.filter((app) => {
    if (!bastSelectedJobs.includes(app.jobId)) return false;
    return ["stage_6", "stage_7", "Completed"].includes(app.currentStage);
  });

  const handleToggleArea = (siteId: string) => {
    setBastSelectedAreas((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const handleToggleJob = (jobId: string) => {
    setBastSelectedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleToggleCandidate = (appId: string) => {
    setBastSelectedCandidates((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleBastInputChange = (appId: string, field: string, value: string) => {
    setBastInputs((prev: any) => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {}),
        [field]: value,
      }
    }));
  };

  const handleDownloadExcelBAST = () => {
    if (bastSelectedCandidates.length === 0) {
      alert("Pilih minimal satu kandidat.");
      return;
    }

    const dataRows = bastSelectedCandidates.map((appId, index) => {
      const app = availableBastCandidates.find(a => a.id === appId);
      if (!app) return null;
      const job = jobs.find(j => j.id === app.jobId);
      const cand = candidates[app.candidateId];
      const inputs = bastInputs[appId] || {};
      const site = sites.find(s => s.id === job?.siteId);

      return {
        "No": index + 1,
        "No. Request": job?.noRegistrasi || "",
        "No. B1": job?.noB1 || "", 
        "Tanggal Terima B1": job?.tanggalMasuk ? new Date(job.tanggalMasuk).toLocaleDateString("id-ID") : "",
        "Nama": cand?.fullName || "",
        "NIK": cand?.nik || "",
        "Posisi": job?.posisi || "",
        "Status": inputs.status || "",
        "NRP DPP": inputs.nrp || "",
        "Area Kerja": site?.siteName || job?.location || "",
        "Awal Kontrak": inputs.start ? new Date(inputs.start).toLocaleDateString("id-ID") : "",
        "Akhir Kontrak": inputs.end ? new Date(inputs.end).toLocaleDateString("id-ID") : "",
        "Link Sertifikat": inputs.link || "",
        "Validasi": inputs.validasi || ""
      };
    }).filter(Boolean);

    const ws = XLSX.utils.json_to_sheet(dataRows);
    
    // Auto-size columns slightly
    const columnWidths = [
      { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, 
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, 
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }
    ];
    ws["!cols"] = columnWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BAST");
    XLSX.writeFile(wb, "BAST_Document.xlsx");
  };

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
          ) : documentType === "bast" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Bulan & Tahun</label>
                  <input
                    type="month"
                    value={bastMonth}
                    onChange={(e) => {
                      setBastMonth(e.target.value);
                      setBastSelectedJobs([]);
                      setBastSelectedCandidates([]);
                    }}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Customer / Perusahaan</label>
                  <select
                    value={bastCustomerId}
                    onChange={(e) => {
                      setBastCustomerId(e.target.value);
                      setBastSelectedAreas([]);
                      setBastSelectedJobs([]);
                      setBastSelectedCandidates([]);
                    }}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  >
                    <option value="">-- Pilih Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {bastCustomerId && (
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Filter Area (Opsional)</label>
                  <div className="flex flex-wrap gap-2">
                    {sites.filter(s => s.customerId === bastCustomerId).map((site) => (
                      <label key={site.id} className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-table-border text-sm cursor-pointer hover:bg-surface-container-high transition-colors">
                        <input
                          type="checkbox"
                          checked={bastSelectedAreas.includes(site.id)}
                          onChange={() => handleToggleArea(site.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/50 bg-surface-container-lowest border-table-border"
                        />
                        <span className="text-on-surface">{site.siteName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {bastMonth && bastCustomerId && (
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Pilih Lowongan</label>
                  {availableBastJobs.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic">Tidak ada lowongan di bulan & customer ini.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-table-border rounded-lg p-3 bg-surface-container-lowest">
                      {availableBastJobs.map(job => (
                        <label key={job.id} className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={bastSelectedJobs.includes(job.id)}
                            onChange={() => handleToggleJob(job.id)}
                            className="w-4 h-4 mt-1 rounded text-primary focus:ring-primary/50 bg-surface border-table-border"
                          />
                          <div>
                            <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{job.noRegistrasi} - {job.posisi}</p>
                            <p className="text-xs text-on-surface-variant">Tanggal: {new Date(job.tanggalMasuk).toLocaleDateString("id-ID")}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {bastSelectedJobs.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Daftar Kandidat (Hired)</label>
                  <div className="overflow-x-auto border border-table-border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low border-b border-table-border whitespace-nowrap">
                        <tr>
                          <th className="px-4 py-3"><input type="checkbox" onChange={(e) => setBastSelectedCandidates(e.target.checked ? availableBastCandidates.map(a => a.id) : [])} checked={bastSelectedCandidates.length === availableBastCandidates.length && availableBastCandidates.length > 0} className="w-4 h-4 rounded text-primary focus:ring-primary/50" /></th>
                          <th className="px-4 py-3">Lowongan</th>
                          <th className="px-4 py-3">Nama</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">NRP DPP</th>
                          <th className="px-4 py-3 min-w-[140px]">Awal Kontrak</th>
                          <th className="px-4 py-3 min-w-[140px]">Akhir Kontrak</th>
                          <th className="px-4 py-3">Link Sertifikat</th>
                          <th className="px-4 py-3">Validasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableBastCandidates.length === 0 ? (
                          <tr><td colSpan={9} className="px-4 py-4 text-center text-on-surface-variant italic">Tidak ada kandidat terpilih dari lowongan tersebut.</td></tr>
                        ) : availableBastCandidates.map(app => {
                          const job = jobs.find(j => j.id === app.jobId);
                          const cand = candidates[app.candidateId];
                          const inputs = bastInputs[app.id] || {};
                          const isSelected = bastSelectedCandidates.includes(app.id);
                          return (
                            <tr key={app.id} className="border-b border-table-border last:border-0 hover:bg-surface-container-lowest/50 bg-surface-container-lowest">
                              <td className="px-4 py-3">
                                <input type="checkbox" checked={isSelected} onChange={() => handleToggleCandidate(app.id)} className="w-4 h-4 rounded text-primary focus:ring-primary/50" />
                              </td>
                              <td className="px-4 py-3 text-on-surface whitespace-nowrap">{job?.noRegistrasi}</td>
                              <td className="px-4 py-3 text-on-surface whitespace-nowrap">{cand?.fullName}</td>
                              <td className="px-4 py-3"><input type="text" value={inputs.status || ""} onChange={e => handleBastInputChange(app.id, "status", e.target.value)} className="w-full min-w-[100px] bg-surface border border-table-border rounded px-2 py-1 text-xs outline-none focus:border-primary" /></td>
                              <td className="px-4 py-3"><input type="text" value={inputs.nrp || ""} onChange={e => handleBastInputChange(app.id, "nrp", e.target.value)} className="w-full min-w-[100px] bg-surface border border-table-border rounded px-2 py-1 text-xs outline-none focus:border-primary" /></td>
                              <td className="px-4 py-3"><input type="date" value={inputs.start || ""} onChange={e => handleBastInputChange(app.id, "start", e.target.value)} className="w-full bg-surface border border-table-border rounded px-2 py-1 text-xs outline-none focus:border-primary" /></td>
                              <td className="px-4 py-3"><input type="date" value={inputs.end || ""} onChange={e => handleBastInputChange(app.id, "end", e.target.value)} className="w-full bg-surface border border-table-border rounded px-2 py-1 text-xs outline-none focus:border-primary" /></td>
                              <td className="px-4 py-3"><input type="text" value={inputs.link || ""} onChange={e => handleBastInputChange(app.id, "link", e.target.value)} className="w-full min-w-[120px] bg-surface border border-table-border rounded px-2 py-1 text-xs outline-none focus:border-primary" /></td>
                              <td className="px-4 py-3">
                                <select value={inputs.validasi || ""} onChange={e => handleBastInputChange(app.id, "validasi", e.target.value)} className="w-full min-w-[100px] bg-surface border border-table-border rounded px-2 py-1 text-xs outline-none focus:border-primary">
                                  <option value="">-</option>
                                  <option value="Valid">Valid</option>
                                  <option value="Invalid">Invalid</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-table-border flex justify-end">
                <button
                  onClick={handleDownloadExcelBAST}
                  disabled={bastSelectedCandidates.length === 0}
                  className="px-6 py-2.5 text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Download Excel BAST
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-surface-container-lowest rounded-xl border border-dashed border-table-border">
              <p className="text-on-surface-variant text-lg font-semibold">
                Form for this template document not set yet.
              </p>
              <p className="text-on-surface-variant text-sm mt-2">
                Pilih "Offering Letter" atau "BAST" untuk melanjutkan.
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
