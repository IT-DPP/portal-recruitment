"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  generateDocx,
  generateMcuDocx,
  generatePdfFromElement,
  printDocument,
  generateBastExcel,
  OfferingLetterData,
  McuLetterData,
} from "@/lib/document-generator";
import {
  saveCandidateDocumentData,
  batchSaveBastData,
  getDocumentGenerationData,
} from "@/app/actions/document";
import {
  FileText,
  FileSpreadsheet,
  HeartPulse,
  Download,
  Printer,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Search,
} from "lucide-react";

// Tiptap Toolbar Menu
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2 p-1.5 bg-surface-container-low rounded-lg border border-table-border">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          editor.isActive("bold")
            ? "bg-primary text-white"
            : "bg-surface hover:bg-surface-container-high text-on-surface"
        }`}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          editor.isActive("italic")
            ? "bg-primary text-white"
            : "bg-surface hover:bg-surface-container-high text-on-surface"
        }`}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          editor.isActive("bulletList")
            ? "bg-primary text-white"
            : "bg-surface hover:bg-surface-container-high text-on-surface"
        }`}
      >
        Bullet List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          editor.isActive("orderedList")
            ? "bg-primary text-white"
            : "bg-surface hover:bg-surface-container-high text-on-surface"
        }`}
      >
        Numbered List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="px-2 py-1 rounded text-xs bg-surface hover:bg-surface-container-high text-on-surface disabled:opacity-40"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="px-2 py-1 rounded text-xs bg-surface hover:bg-surface-container-high text-on-surface disabled:opacity-40"
      >
        Redo
      </button>
    </div>
  );
};

interface Props {
  initialData: {
    jobs: any[];
    applications: any[];
    customers: any[];
    sites: any[];
    stages: any[];
  };
  initialError?: string;
}

export default function GenerateDocumentsClient({ initialData, initialError }: Props) {
  // Database States
  const [jobs, setJobs] = useState<any[]>(initialData?.jobs || []);
  const [applications, setApplications] = useState<any[]>(initialData?.applications || []);
  const [customers, setCustomers] = useState<any[]>(initialData?.customers || []);
  const [sites, setSites] = useState<any[]>(initialData?.sites || []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    initialError ? { type: "error", text: initialError } : null
  );

  // Active Document Tab
  const [documentType, setDocumentType] = useState<"offering" | "bast" | "mcu">("offering");

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // -------------------------------------------------------------------------
  // 1. OFFERING LETTER STATES
  // -------------------------------------------------------------------------
  const [nomorSurat, setNomorSurat] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const defaultTugasHtml =
    "<p>1. Mematuhi peraturan Keselamatan & Kesehatan Kerja serta Lingkungan Hidup (K3LH) yang berlaku di area operasi.</p><p>2. Menjalankan tugas dan tanggung jawab operasional sesuai Standard Operating Procedure (SOP) perusahaan.</p><p>3. Berkoordinasi aktif dengan pengawas dan tim kerja untuk mencapai target produktivitas yang ditentukan.</p>";

  const defaultHakHtml =
    "<p>1. Gaji pokok dan tunjangan operasional sesuai kesepakatan penempatan kerja.</p><p>2. Fasilitas akomodasi/mess, konsumsi, dan transportasi operasional di site.</p><p>3. Perlindungan jaminan sosial ketenagakerjaan dan kesehatan (BPJS Ketenagakerjaan & BPJS Kesehatan).</p><p>4. Hak cuti periodik dan tiket perjalanan sesuai ketentuan roster kerja yang berlaku.</p>";

  const [tugasHtml, setTugasHtml] = useState(defaultTugasHtml);
  const [hakHtml, setHakHtml] = useState(defaultHakHtml);

  const tugasEditor = useEditor({
    extensions: [StarterKit],
    content: tugasHtml,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setTugasHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm focus:outline-none min-h-[120px] max-h-[250px] overflow-y-auto border border-table-border rounded-lg p-3 bg-surface-container-lowest text-on-surface",
      },
    },
  });

  const hakEditor = useEditor({
    extensions: [StarterKit],
    content: hakHtml,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHakHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm focus:outline-none min-h-[120px] max-h-[250px] overflow-y-auto border border-table-border rounded-lg p-3 bg-surface-container-lowest text-on-surface",
      },
    },
  });

  // -------------------------------------------------------------------------
  // 2. BAST STATES
  // -------------------------------------------------------------------------
  const [bastMonth, setBastMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [bastCustomerId, setBastCustomerId] = useState("");
  const [bastSelectedAreas, setBastSelectedAreas] = useState<string[]>([]);
  const [bastSelectedJobs, setBastSelectedJobs] = useState<string[]>([]);
  const [bastSelectedApps, setBastSelectedApps] = useState<string[]>([]);
  const [bastSearchQuery, setBastSearchQuery] = useState("");
  const [bastInputs, setBastInputs] = useState<Record<string, any>>({});
  const [isSavingBast, setIsSavingBast] = useState(false);

  // -------------------------------------------------------------------------
  // 3. MCU STATES
  // -------------------------------------------------------------------------
  const [mcuNomorSurat, setMcuNomorSurat] = useState("");
  const [mcuJobId, setMcuJobId] = useState("");
  const [mcuAppId, setMcuAppId] = useState("");
  const [mcuKlinik, setMcuKlinik] = useState("Klinik Kimia Farma");
  const [mcuAlamatKlinik, setMcuAlamatKlinik] = useState("");
  const [mcuTanggal, setMcuTanggal] = useState("");
  const [mcuPaket, setMcuPaket] = useState(
    "Paket MCU Standard (Fisik Lengkap, Darah Rutin, Urine, Rontgen Thorax, Bebas Narkoba 5 Parameter)"
  );
  const [mcuCatatan, setMcuCatatan] = useState(
    "1. Calon karyawan wajib berpuasa minimal 10-12 jam sebelum pengambilan darah (hanya diperbolehkan minum air putih).\n2. Membawa KTP / Kartu Identitas asli dan hadir 15 menit sebelum waktu pemeriksaan.\n3. Istirahat cukup pada malam hari sebelum pemeriksaan."
  );

  // Auto-generate surat numbers on load or change
  useEffect(() => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const rMonth = romanMonths[month - 1] || "I";

    if (!nomorSurat) {
      setNomorSurat(`001/HRD-DPP/OL/${rMonth}/${year}`);
    }
    if (!mcuNomorSurat) {
      setMcuNomorSurat(`001/HRD-DPP/MCU/${rMonth}/${year}`);
    }
  }, []);

  // Refresh DB data handler
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await getDocumentGenerationData();
      if (res.success && res.jobs) {
        setJobs(res.jobs);
        setApplications(res.applications || []);
        setCustomers(res.customers || []);
        setSites(res.sites || []);
        setFeedbackMsg({ type: "success", text: "Data database berhasil dimuat ulang." });
      } else {
        setFeedbackMsg({ type: "error", text: res.error || "Gagal memuat data." });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err?.message || "Koneksi database bermasalah." });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // -------------------------------------------------------------------------
  // OFFERING DERIVED DATA
  // -------------------------------------------------------------------------
  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  const jobApplications = useMemo(() => {
    if (!selectedJobId) return [];
    return applications.filter((app) => app.jobId === selectedJobId);
  }, [applications, selectedJobId]);

  const hiredJobApplications = useMemo(() => {
    return jobApplications.filter((app) => {
      const stageId = app.currentStageId || "";
      return app.status === "HIRED" || stageId === "stage_6" || stageId === "stage_7";
    });
  }, [jobApplications]);

  const candidateOptions = hiredJobApplications.length > 0 ? hiredJobApplications : jobApplications;

  const selectedApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId);
  }, [applications, selectedAppId]);

  const selectedCandidateProfile = selectedApp?.candidateProfile;
  const candidateFullName =
    selectedCandidateProfile?.user?.name || selectedCandidateProfile?.nik || "Kandidat Terpilih";

  // Pre-fill existing offering data if saved in DB
  useEffect(() => {
    if (selectedApp?.stageData) {
      try {
        const sd =
          typeof selectedApp.stageData === "string"
            ? JSON.parse(selectedApp.stageData)
            : selectedApp.stageData;
        if (sd.offering) {
          if (sd.offering.nomorSurat) setNomorSurat(sd.offering.nomorSurat);
          if (sd.offering.startDate) setStartDate(sd.offering.startDate);
          if (sd.offering.endDate) setEndDate(sd.offering.endDate);
          if (sd.offering.tugasHtml && tugasEditor) {
            tugasEditor.commands.setContent(sd.offering.tugasHtml);
            setTugasHtml(sd.offering.tugasHtml);
          }
          if (sd.offering.hakHtml && hakEditor) {
            hakEditor.commands.setContent(sd.offering.hakHtml);
            setHakHtml(sd.offering.hakHtml);
          }
        }
      } catch (e) {}
    }
  }, [selectedAppId]);

  // Contract duration calculation
  const totalMonths = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    let months = (e.getFullYear() - s.getFullYear()) * 12;
    months -= s.getMonth();
    months += e.getMonth();
    return months <= 0 ? 0 : months;
  }, [startDate, endDate]);

  const handleSaveOfferingToDb = async () => {
    if (!selectedAppId) {
      alert("Pilih kandidat terlebih dahulu.");
      return;
    }
    const res = await saveCandidateDocumentData(selectedAppId, "offering", {
      nomorSurat,
      startDate,
      endDate,
      totalMonths,
      tugasHtml,
      hakHtml,
    });
    if (res.success) {
      setFeedbackMsg({ type: "success", text: "Data Offering Letter tersimpan di database." });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Gagal menyimpan ke database." });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // -------------------------------------------------------------------------
  // BAST LOGIC
  // -------------------------------------------------------------------------
  const availableBastJobs = useMemo(() => {
    if (!bastCustomerId) return [];

    return jobs.filter((j) => {
      if (j.customerId !== bastCustomerId) return false;

      if (bastMonth && j.tanggalMasuk) {
        const dateStr =
          typeof j.tanggalMasuk === "string"
            ? j.tanggalMasuk.substring(0, 7)
            : new Date(j.tanggalMasuk).toISOString().substring(0, 7);
        if (dateStr !== bastMonth) return false;
      }

      if (bastSelectedAreas.length > 0) {
        if (!bastSelectedAreas.includes(j.siteId)) return false;
      }

      return true;
    });
  }, [jobs, bastCustomerId, bastMonth, bastSelectedAreas]);

  const availableBastCandidates = useMemo(() => {
    if (bastSelectedJobs.length === 0) return [];

    return applications.filter((app) => {
      if (!bastSelectedJobs.includes(app.jobId)) return false;
      return (
        app.status === "HIRED" ||
        app.currentStageId === "stage_6" ||
        app.currentStageId === "stage_7" ||
        !app.currentStageId
      );
    });
  }, [applications, bastSelectedJobs]);

  const filteredBastCandidates = useMemo(() => {
    if (!bastSearchQuery) return availableBastCandidates;
    const q = bastSearchQuery.toLowerCase();
    return availableBastCandidates.filter((app) => {
      const name = app.candidateProfile?.user?.name?.toLowerCase() || "";
      const nik = app.candidateProfile?.nik || "";
      const job = jobs.find((j) => j.id === app.jobId);
      const pos = (job?.posisi || "").toLowerCase();
      return name.includes(q) || nik.includes(q) || pos.includes(q);
    });
  }, [availableBastCandidates, bastSearchQuery, jobs]);

  useEffect(() => {
    const newInputs: Record<string, any> = { ...bastInputs };
    availableBastCandidates.forEach((app) => {
      if (!newInputs[app.id]) {
        let initialData: any = {};
        if (app.stageData) {
          try {
            const sd =
              typeof app.stageData === "string" ? JSON.parse(app.stageData) : app.stageData;
            if (sd.bast) initialData = sd.bast;
          } catch (e) {}
        }
        newInputs[app.id] = {
          status: initialData.status || "Diterima / Lolos",
          nrp: initialData.nrp || "",
          start: initialData.start || "",
          end: initialData.end || "",
          link: initialData.link || "",
          validasi: initialData.validasi || "Valid",
        };
      }
    });
    setBastInputs(newInputs);
  }, [availableBastCandidates]);

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

  const handleToggleSelectAllJobs = () => {
    if (bastSelectedJobs.length === availableBastJobs.length) {
      setBastSelectedJobs([]);
    } else {
      setBastSelectedJobs(availableBastJobs.map((j) => j.id));
    }
  };

  const handleToggleCandidate = (appId: string) => {
    setBastSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleToggleSelectAllCandidates = () => {
    if (bastSelectedApps.length === filteredBastCandidates.length) {
      setBastSelectedApps([]);
    } else {
      setBastSelectedApps(filteredBastCandidates.map((a) => a.id));
    }
  };

  const handleBastInputChange = (appId: string, field: string, value: string) => {
    setBastInputs((prev) => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {}),
        [field]: value,
      },
    }));
  };

  const handleBatchSaveBast = async () => {
    if (bastSelectedApps.length === 0) {
      alert("Centang minimal 1 kandidat untuk disimpan.");
      return;
    }
    setIsSavingBast(true);
    const payload = bastSelectedApps.map((appId) => ({
      appId,
      data: bastInputs[appId] || {},
    }));

    const res = await batchSaveBastData(payload);
    setIsSavingBast(false);

    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: `Data BAST untuk ${bastSelectedApps.length} kandidat berhasil disimpan di database.`,
      });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Gagal menyimpan data BAST." });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDownloadExcelBAST = () => {
    if (bastSelectedApps.length === 0) {
      alert("Pilih minimal satu kandidat yang ingin disertakan dalam BAST.");
      return;
    }

    const currentCustomer = customers.find((c) => c.id === bastCustomerId);

    const rows = bastSelectedApps
      .map((appId, index) => {
        const app = applications.find((a) => a.id === appId);
        if (!app) return null;
        const job = jobs.find((j) => j.id === app.jobId);
        const cand = app.candidateProfile;
        const inputs = bastInputs[appId] || {};
        const site = sites.find((s) => s.id === job?.siteId);

        return {
          No: index + 1,
          "No. Request": job?.noRegistrasi || "-",
          "No. B1": job?.noB1 || "-",
          "Tanggal Terima B1": job?.tanggalMasuk
            ? new Date(job.tanggalMasuk).toLocaleDateString("id-ID")
            : "-",
          Nama: cand?.user?.name || cand?.nik || "-",
          NIK: cand?.nik || "-",
          Posisi: job?.posisi || "-",
          Status: inputs.status || "Diterima / Lolos",
          "NRP DPP": inputs.nrp || "-",
          "Area Kerja": site?.name || job?.location || "-",
          "Awal Kontrak": inputs.start
            ? new Date(inputs.start).toLocaleDateString("id-ID")
            : "-",
          "Akhir Kontrak": inputs.end
            ? new Date(inputs.end).toLocaleDateString("id-ID")
            : "-",
          "Link Sertifikat": inputs.link || "-",
          Validasi: inputs.validasi || "Valid",
        };
      })
      .filter(Boolean);

    generateBastExcel(rows, {
      customerName: currentCustomer?.name || "Customer",
      month: bastMonth,
    });
  };

  // -------------------------------------------------------------------------
  // MCU LOGIC
  // -------------------------------------------------------------------------
  const selectedMcuJob = useMemo(() => {
    return jobs.find((j) => j.id === mcuJobId);
  }, [jobs, mcuJobId]);

  const mcuJobApplications = useMemo(() => {
    if (!mcuJobId) return [];
    return applications.filter((app) => app.jobId === mcuJobId);
  }, [applications, mcuJobId]);

  const selectedMcuApp = useMemo(() => {
    return applications.find((a) => a.id === mcuAppId);
  }, [applications, mcuAppId]);

  const selectedMcuCand = selectedMcuApp?.candidateProfile;

  useEffect(() => {
    if (selectedMcuApp?.stageData) {
      try {
        const sd =
          typeof selectedMcuApp.stageData === "string"
            ? JSON.parse(selectedMcuApp.stageData)
            : selectedMcuApp.stageData;
        if (sd.mcu) {
          if (sd.mcu.nomorSurat) setMcuNomorSurat(sd.mcu.nomorSurat);
          if (sd.mcu.klinik) setMcuKlinik(sd.mcu.klinik);
          if (sd.mcu.alamatKlinik) setMcuAlamatKlinik(sd.mcu.alamatKlinik);
          if (sd.mcu.tanggal) setMcuTanggal(sd.mcu.tanggal);
          if (sd.mcu.paket) setMcuPaket(sd.mcu.paket);
          if (sd.mcu.catatan) setMcuCatatan(sd.mcu.catatan);
        }
      } catch (e) {}
    }
  }, [mcuAppId]);

  const handleSaveMcuToDb = async () => {
    if (!mcuAppId) {
      alert("Pilih kandidat terlebih dahulu.");
      return;
    }
    const res = await saveCandidateDocumentData(mcuAppId, "mcu", {
      nomorSurat: mcuNomorSurat,
      klinik: mcuKlinik,
      alamatKlinik: mcuAlamatKlinik,
      tanggal: mcuTanggal,
      paket: mcuPaket,
      catatan: mcuCatatan,
    });
    if (res.success) {
      setFeedbackMsg({ type: "success", text: "Data Pengantar MCU tersimpan di database." });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Gagal menyimpan ke database." });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // -------------------------------------------------------------------------
  // DOWNLOAD & PRINT HANDLERS
  // -------------------------------------------------------------------------
  const handleDownloadOfferingDocx = () => {
    if (!nomorSurat || !selectedJob || !selectedCandidateProfile) {
      alert("Harap lengkapi Nomor Surat, Lowongan, dan Kandidat.");
      return;
    }
    const data: OfferingLetterData = {
      nomorSurat,
      namaKandidat: candidateFullName,
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

  const handleDownloadOfferingPdf = async () => {
    if (!nomorSurat || !selectedJob || !selectedCandidateProfile) {
      alert("Harap lengkapi form dengan benar.");
      return;
    }
    setIsDownloading(true);
    await generatePdfFromElement(
      "offering-pdf-template",
      `Offering_Letter_${candidateFullName.replace(/\s+/g, "_")}`
    );
    setIsDownloading(false);
  };

  const handlePrintOffering = () => {
    if (!nomorSurat || !selectedJob || !selectedCandidateProfile) {
      alert("Harap lengkapi form dengan benar.");
      return;
    }
    printDocument(
      "offering-pdf-template",
      `Offering Letter - ${candidateFullName}`
    );
  };

  const handleDownloadMcuDocx = () => {
    if (!mcuNomorSurat || !selectedMcuJob || !selectedMcuCand) {
      alert("Harap lengkapi form MCU dengan benar.");
      return;
    }
    const data: McuLetterData = {
      nomorSurat: mcuNomorSurat,
      namaKandidat: selectedMcuCand.user?.name || "Kandidat",
      nik: selectedMcuCand.nik || "-",
      posisi: selectedMcuJob.posisi,
      namaPerusahaan: selectedMcuJob.customerName,
      klinikTujuan: mcuKlinik,
      alamatKlinik: mcuAlamatKlinik,
      tanggalPelaksanaan: mcuTanggal ? new Date(mcuTanggal) : null,
      paketPemeriksaan: mcuPaket,
      catatan: mcuCatatan,
    };
    generateMcuDocx(data, "/icon.png");
  };

  const handleDownloadMcuPdf = async () => {
    if (!mcuNomorSurat || !selectedMcuJob || !selectedMcuCand) {
      alert("Harap lengkapi form MCU dengan benar.");
      return;
    }
    setIsDownloading(true);
    await generatePdfFromElement(
      "mcu-pdf-template",
      `Surat_Pengantar_MCU_${(selectedMcuCand.user?.name || "Kandidat").replace(/\s+/g, "_")}`
    );
    setIsDownloading(false);
  };

  const handlePrintMcu = () => {
    if (!mcuNomorSurat || !selectedMcuJob || !selectedMcuCand) {
      alert("Harap lengkapi form MCU dengan benar.");
      return;
    }
    printDocument(
      "mcu-pdf-template",
      `Surat Pengantar MCU - ${selectedMcuCand.user?.name || "Kandidat"}`
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-surface-container-lowest p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-table-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-on-surface">Generate Documents</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Full-Stack DB
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Kelola dan terbitkan Offering Letter, Berita Acara Serah Terima (BAST), dan Surat
              Pengantar MCU secara otomatis dari database.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl transition-colors shadow-xs"
              title="Perbarui data langsung dari database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              <span>{isRefreshing ? "Menyinkronkan..." : "Sync DB"}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all animate-fadeIn ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium">{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setDocumentType("offering")}
            className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
              documentType === "offering"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-surface text-on-surface border-table-border hover:bg-surface-container-low"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Offering Letter</span>
          </button>

          <button
            onClick={() => setDocumentType("bast")}
            className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
              documentType === "bast"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-surface text-on-surface border-table-border hover:bg-surface-container-low"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>BAST Serah Terima (Excel)</span>
          </button>

          <button
            onClick={() => setDocumentType("mcu")}
            className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
              documentType === "mcu"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-surface text-on-surface border-table-border hover:bg-surface-container-low"
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Surat Pengantar MCU</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-surface p-6 rounded-2xl border border-table-border shadow-xs space-y-6">
          {/* ========================================================================= */}
          {/* 1. OFFERING LETTER TAB */}
          {/* ========================================================================= */}
          {documentType === "offering" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-table-border">
                <div>
                  <h2 className="text-base font-semibold text-on-surface">Form Offering Letter</h2>
                  <p className="text-xs text-on-surface-variant">
                    Pilih lowongan dan kandidat yang telah lolos untuk menghasilkan dokumen offering resmi.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveOfferingToDb}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border hover:bg-surface-container text-on-surface rounded-lg transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan ke DB</span>
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={!selectedJob || !selectedCandidateProfile}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border hover:bg-surface-container text-on-surface rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nomor Surat */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Nomor Surat
                  </label>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Contoh: 001/HRD-DPP/OL/III/2026"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>

                {/* Pilih Lowongan */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Lowongan Pekerjaan (Database)
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      setSelectedAppId("");
                    }}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  >
                    <option value="">-- Pilih Lowongan Pekerjaan --</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.noRegistrasi} - {job.posisi} ({job.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilih Kandidat */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-on-surface uppercase">
                      Kandidat Terpilih
                    </label>
                    {selectedJobId && (
                      <span className="text-[11px] text-on-surface-variant font-medium">
                        {hiredJobApplications.length} kandidat siap offering
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    disabled={!selectedJobId || candidateOptions.length === 0}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedJobId
                        ? "-- Pilih Lowongan Terlebih Dahulu --"
                        : candidateOptions.length === 0
                        ? "-- Tidak ada kandidat pada lowongan ini --"
                        : "-- Pilih Kandidat --"}
                    </option>
                    {candidateOptions.map((app) => {
                      const name = app.candidateProfile?.user?.name || "Kandidat";
                      const stageName = app.currentStage?.name || app.status;
                      const nik = app.candidateProfile?.nik ? ` - NIK: ${app.candidateProfile.nik}` : "";
                      return (
                        <option key={app.id} value={app.id}>
                          {name} ({stageName}){nik}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Posisi (Auto) */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Posisi & Perusahaan (Auto)
                  </label>
                  <input
                    type="text"
                    value={
                      selectedJob
                        ? `${selectedJob.posisi} — ${selectedJob.customerName} (${selectedJob.location})`
                        : ""
                    }
                    readOnly
                    placeholder="Pilih lowongan untuk mengisi otomatis"
                    className="w-full bg-surface-container border border-table-border rounded-lg px-3.5 py-2 text-sm text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Masa Kontrak */}
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-table-border space-y-2">
                <label className="block text-xs font-semibold text-on-surface uppercase">
                  Masa Kontrak Kerja
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:flex-1">
                    <span className="block text-[11px] text-on-surface-variant mb-1 font-medium">
                      Tanggal Mulai:
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface border border-table-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                    />
                  </div>
                  <span className="text-on-surface-variant font-medium hidden sm:inline pt-4">s/d</span>
                  <div className="w-full sm:flex-1">
                    <span className="block text-[11px] text-on-surface-variant mb-1 font-medium">
                      Tanggal Selesai:
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-surface border border-table-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                    />
                  </div>
                  <div className="w-full sm:w-auto pt-4 sm:pt-4">
                    <div className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm font-bold text-center whitespace-nowrap">
                      Durasi: {totalMonths} Bulan
                    </div>
                  </div>
                </div>
              </div>

              {/* Tugas & Tanggung Jawab */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface uppercase">
                    Tugas & Tanggung Jawab (Rich Text)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (tugasEditor) {
                        tugasEditor.commands.setContent(defaultTugasHtml);
                        setTugasHtml(defaultTugasHtml);
                      }
                    }}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Reset Template Default
                  </button>
                </div>
                <MenuBar editor={tugasEditor} />
                <EditorContent editor={tugasEditor} />
              </div>

              {/* Hak & Fasilitas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface uppercase">
                    Hak & Fasilitas (Rich Text)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (hakEditor) {
                        hakEditor.commands.setContent(defaultHakHtml);
                        setHakHtml(defaultHakHtml);
                      }
                    }}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    Reset Template Default
                  </button>
                </div>
                <MenuBar editor={hakEditor} />
                <EditorContent editor={hakEditor} />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-table-border flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={!selectedJob || !selectedCandidateProfile}
                  className="px-4 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={handlePrintOffering}
                  disabled={!selectedJob || !selectedCandidateProfile}
                  className="px-4 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  title="Cetak langsung atau simpan via browser print engine"
                >
                  <Printer className="w-4 h-4 text-neutral-600" />
                  <span>Cetak / Print</span>
                </button>
                <button
                  onClick={handleDownloadOfferingPdf}
                  disabled={!selectedJob || !selectedCandidateProfile || isDownloading}
                  className="px-5 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-red-600" />
                  <span>{isDownloading ? "Memproses PDF..." : "Download PDF"}</span>
                </button>
                <button
                  onClick={handleDownloadOfferingDocx}
                  disabled={!selectedJob || !selectedCandidateProfile}
                  className="px-6 py-2.5 text-white bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-blue-200" />
                  <span>Download DOCX (Word)</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. BAST TAB */}
          {/* ========================================================================= */}
          {documentType === "bast" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-table-border">
                <div>
                  <h2 className="text-base font-semibold text-on-surface">
                    Filter & Export Berita Acara Serah Terima (BAST)
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Saring data lowongan berdasarkan periode, customer, dan area kerja untuk mengunduh
                    dokumen serah terima kandidat dalam format Excel.
                  </p>
                </div>
                {bastSelectedApps.length > 0 && (
                  <button
                    onClick={handleBatchSaveBast}
                    disabled={isSavingBast}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingBast ? "Menyimpan..." : `Simpan ${bastSelectedApps.length} Data ke DB`}</span>
                  </button>
                )}
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Periode Bulan & Tahun (Tanggal Masuk Lowongan)
                  </label>
                  <input
                    type="month"
                    value={bastMonth}
                    onChange={(e) => {
                      setBastMonth(e.target.value);
                      setBastSelectedJobs([]);
                      setBastSelectedApps([]);
                    }}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Customer / Perusahaan Mitra
                  </label>
                  <select
                    value={bastCustomerId}
                    onChange={(e) => {
                      setBastCustomerId(e.target.value);
                      setBastSelectedAreas([]);
                      setBastSelectedJobs([]);
                      setBastSelectedApps([]);
                    }}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  >
                    <option value="">-- Pilih Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.code ? `(${c.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area / Sites Filter Chips */}
              {bastCustomerId && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-2">
                    Filter Area / Site Operasional ({sites.filter((s) => s.customerId === bastCustomerId).length} Site)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sites
                      .filter((s) => s.customerId === bastCustomerId)
                      .map((site) => {
                        const isChecked = bastSelectedAreas.includes(site.id);
                        return (
                          <button
                            type="button"
                            key={site.id}
                            onClick={() => handleToggleArea(site.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              isChecked
                                ? "bg-primary text-white border-primary"
                                : "bg-surface-container hover:bg-surface-container-high text-on-surface border-table-border"
                            }`}
                          >
                            <span>{site.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Jobs Checklist */}
              {bastCustomerId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-on-surface uppercase">
                      Pilih Lowongan ({availableBastJobs.length} Lowongan Ditemukan)
                    </label>
                    {availableBastJobs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAllJobs}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        {bastSelectedJobs.length === availableBastJobs.length
                          ? "Batal Pilih Semua"
                          : "Pilih Semua Lowongan"}
                      </button>
                    )}
                  </div>

                  {availableBastJobs.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-table-border text-center text-xs text-on-surface-variant">
                      Tidak ada lowongan untuk customer dan periode {bastMonth || "-"}.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-table-border rounded-xl p-3 bg-surface-container-lowest">
                      {availableBastJobs.map((job) => (
                        <label
                          key={job.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={bastSelectedJobs.includes(job.id)}
                              onChange={() => handleToggleJob(job.id)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary/40 bg-surface border-table-border"
                            />
                            <div>
                              <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {job.noRegistrasi} — {job.posisi}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                Site: {job.location} | Form B1: {job.noB1}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            {job.tanggalMasuk ? new Date(job.tanggalMasuk).toLocaleDateString("id-ID") : "-"}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Candidates Table */}
              {bastSelectedJobs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-on-surface uppercase">
                        Kandidat Lolos / Hired ({availableBastCandidates.length} Orang)
                      </label>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        {bastSelectedApps.length} Terpilih
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                        <input
                          type="text"
                          value={bastSearchQuery}
                          onChange={(e) => setBastSearchQuery(e.target.value)}
                          placeholder="Cari nama / NIK..."
                          className="pl-8 pr-3 py-1 bg-surface-container-lowest border border-table-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary text-on-surface w-44"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-table-border rounded-xl shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-on-surface-variant uppercase bg-surface-container-low border-b border-table-border whitespace-nowrap">
                        <tr>
                          <th className="px-3 py-3 w-8">
                            <input
                              type="checkbox"
                              checked={
                                bastSelectedApps.length === filteredBastCandidates.length &&
                                filteredBastCandidates.length > 0
                              }
                              onChange={handleToggleSelectAllCandidates}
                              className="w-4 h-4 rounded text-primary focus:ring-primary/40 cursor-pointer"
                            />
                          </th>
                          <th className="px-3 py-3 font-semibold">Lowongan & No. B1</th>
                          <th className="px-3 py-3 font-semibold">Nama Kandidat</th>
                          <th className="px-3 py-3 font-semibold">NIK</th>
                          <th className="px-3 py-3 font-semibold">Posisi</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold min-w-[120px]">NRP DPP</th>
                          <th className="px-3 py-3 font-semibold min-w-[130px]">Awal Kontrak</th>
                          <th className="px-3 py-3 font-semibold min-w-[130px]">Akhir Kontrak</th>
                          <th className="px-3 py-3 font-semibold min-w-[150px]">Link Sertifikat</th>
                          <th className="px-3 py-3 font-semibold min-w-[100px]">Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-table-border">
                        {filteredBastCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="px-4 py-8 text-center text-on-surface-variant italic">
                              Tidak ada kandidat lolos pada lowongan yang dipilih.
                            </td>
                          </tr>
                        ) : (
                          filteredBastCandidates.map((app) => {
                            const job = jobs.find((j) => j.id === app.jobId);
                            const cand = app.candidateProfile;
                            const inputs = bastInputs[app.id] || {};
                            const isSelected = bastSelectedApps.includes(app.id);

                            return (
                              <tr
                                key={app.id}
                                className={`hover:bg-surface-container-low/60 transition-colors ${
                                  isSelected ? "bg-primary/5" : "bg-surface-container-lowest"
                                }`}
                              >
                                <td className="px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleCandidate(app.id)}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary/40 cursor-pointer"
                                  />
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap font-medium text-on-surface">
                                  <div>{job?.noRegistrasi}</div>
                                  <div className="text-[10px] text-on-surface-variant">B1: {job?.noB1}</div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-on-surface">
                                  {cand?.user?.name || cand?.nik || "-"}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap font-mono text-on-surface-variant">
                                  {cand?.nik || "-"}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-on-surface">
                                  {job?.posisi || "-"}
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={inputs.status || ""}
                                    onChange={(e) => handleBastInputChange(app.id, "status", e.target.value)}
                                    className="w-28 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                    placeholder="Status"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={inputs.nrp || ""}
                                    onChange={(e) => handleBastInputChange(app.id, "nrp", e.target.value)}
                                    className="w-28 bg-surface border border-table-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
                                    placeholder="NRP Pegawai"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="date"
                                    value={inputs.start || ""}
                                    onChange={(e) => handleBastInputChange(app.id, "start", e.target.value)}
                                    className="w-32 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="date"
                                    value={inputs.end || ""}
                                    onChange={(e) => handleBastInputChange(app.id, "end", e.target.value)}
                                    className="w-32 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={inputs.link || ""}
                                    onChange={(e) => handleBastInputChange(app.id, "link", e.target.value)}
                                    className="w-36 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                    placeholder="https://..."
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <select
                                    value={inputs.validasi || "Valid"}
                                    onChange={(e) => handleBastInputChange(app.id, "validasi", e.target.value)}
                                    className="w-24 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary font-medium"
                                  >
                                    <option value="Valid">Valid</option>
                                    <option value="Invalid">Invalid</option>
                                    <option value="-">-</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons for BAST */}
              <div className="pt-4 border-t border-table-border flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-medium">
                  {bastSelectedApps.length} kandidat siap diekspor ke Excel BAST
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBatchSaveBast}
                    disabled={bastSelectedApps.length === 0 || isSavingBast}
                    className="px-4 py-2 bg-surface border border-table-border hover:bg-surface-container text-on-surface rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan ke DB</span>
                  </button>
                  <button
                    onClick={handleDownloadExcelBAST}
                    disabled={bastSelectedApps.length === 0}
                    className="px-5 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download Excel BAST (.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SURAT PENGANTAR MCU TAB */}
          {/* ========================================================================= */}
          {documentType === "mcu" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-table-border">
                <div>
                  <h2 className="text-base font-semibold text-on-surface">
                    Form Surat Pengantar Medical Check-Up (MCU)
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Terbitkan surat rujukan resmi pemeriksaan kesehatan bagi calon karyawan ke klinik
                    atau laboratorium rekanan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveMcuToDb}
                    disabled={!mcuAppId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border hover:bg-surface-container text-on-surface rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan ke DB</span>
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={!selectedMcuJob || !selectedMcuCand}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border hover:bg-surface-container text-on-surface rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Nomor Surat Pengantar
                  </label>
                  <input
                    type="text"
                    value={mcuNomorSurat}
                    onChange={(e) => setMcuNomorSurat(e.target.value)}
                    placeholder="Contoh: 001/HRD-DPP/MCU/III/2026"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Lowongan Pekerjaan (Database)
                  </label>
                  <select
                    value={mcuJobId}
                    onChange={(e) => {
                      setMcuJobId(e.target.value);
                      setMcuAppId("");
                    }}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  >
                    <option value="">-- Pilih Lowongan Pekerjaan --</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.noRegistrasi} - {job.posisi} ({job.customerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Kandidat untuk MCU
                  </label>
                  <select
                    value={mcuAppId}
                    onChange={(e) => setMcuAppId(e.target.value)}
                    disabled={!mcuJobId || mcuJobApplications.length === 0}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface disabled:opacity-50"
                  >
                    <option value="">
                      {!mcuJobId
                        ? "-- Pilih Lowongan Terlebih Dahulu --"
                        : mcuJobApplications.length === 0
                        ? "-- Tidak ada kandidat pada lowongan ini --"
                        : "-- Pilih Kandidat --"}
                    </option>
                    {mcuJobApplications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.candidateProfile?.user?.name || "Kandidat"} ({app.currentStage?.name || app.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Tanggal Pelaksanaan MCU
                  </label>
                  <input
                    type="date"
                    value={mcuTanggal}
                    onChange={(e) => setMcuTanggal(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Klinik / RS Rekanan Rujukan
                  </label>
                  <input
                    type="text"
                    value={mcuKlinik}
                    onChange={(e) => setMcuKlinik(e.target.value)}
                    placeholder="Contoh: Klinik Kimia Farma / RS Siloam / Prodia"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Alamat / Lokasi Klinik (Opsional)
                  </label>
                  <input
                    type="text"
                    value={mcuAlamatKlinik}
                    onChange={(e) => setMcuAlamatKlinik(e.target.value)}
                    placeholder="Contoh: Jl. Ahmad Yani No. 12, Balikpapan"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                  Paket Pemeriksaan MCU
                </label>
                <input
                  type="text"
                  value={mcuPaket}
                  onChange={(e) => setMcuPaket(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                  Catatan & Persiapan Calon Karyawan
                </label>
                <textarea
                  rows={3}
                  value={mcuCatatan}
                  onChange={(e) => setMcuCatatan(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-table-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                />
              </div>

              {/* Action Buttons for MCU */}
              <div className="pt-4 border-t border-table-border flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  disabled={!selectedMcuJob || !selectedMcuCand}
                  className="px-4 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={handlePrintMcu}
                  disabled={!selectedMcuJob || !selectedMcuCand}
                  className="px-4 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  title="Cetak langsung atau simpan via browser print engine"
                >
                  <Printer className="w-4 h-4 text-neutral-600" />
                  <span>Cetak / Print</span>
                </button>
                <button
                  onClick={handleDownloadMcuPdf}
                  disabled={!selectedMcuJob || !selectedMcuCand || isDownloading}
                  className="px-5 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-red-600" />
                  <span>{isDownloading ? "Memproses PDF..." : "Download PDF"}</span>
                </button>
                <button
                  onClick={handleDownloadMcuDocx}
                  disabled={!selectedMcuJob || !selectedMcuCand}
                  className="px-6 py-2.5 text-white bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-blue-200" />
                  <span>Download DOCX (Word)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LIVE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-table-border">
            <div className="flex items-center justify-between p-4 border-b border-table-border">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-on-surface">
                  {documentType === "offering" ? "Preview Offering Letter" : "Preview Surat Pengantar MCU"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {documentType === "offering" ? (
                  <>
                    <button
                      onClick={handlePrintOffering}
                      className="px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border text-on-surface rounded-lg hover:bg-surface-container flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                    <button
                      onClick={handleDownloadOfferingPdf}
                      disabled={isDownloading}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? "Memproses..." : "PDF"}</span>
                    </button>
                    <button
                      onClick={handleDownloadOfferingDocx}
                      className="px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border text-on-surface rounded-lg hover:bg-surface-container flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOCX</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handlePrintMcu}
                      className="px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border text-on-surface rounded-lg hover:bg-surface-container flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                    <button
                      onClick={handleDownloadMcuPdf}
                      disabled={isDownloading}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? "Memproses..." : "PDF"}</span>
                    </button>
                    <button
                      onClick={handleDownloadMcuDocx}
                      className="px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border text-on-surface rounded-lg hover:bg-surface-container flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOCX</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 flex justify-center">
              {documentType === "offering" ? (
                /* Offering Letter Visual Document */
                <div className="w-[720px] bg-white p-12 text-black font-serif shadow-md border rounded-sm">
                  <div className="flex flex-col items-center mb-8 border-b-2 border-black pb-4 text-center">
                    <img src="/icon.png" alt="Logo" className="w-20 h-20 mb-2 object-contain" />
                    <h1 className="text-xl font-bold uppercase tracking-wide">OFFERING LETTER</h1>
                    <p className="text-xs text-neutral-600 font-sans">
                      PT DUA PERMATA PERSADA — RECRUITMENT & TALENT MANAGEMENT
                    </p>
                  </div>

                  <div className="flex justify-between mb-6 text-sm">
                    <div>
                      <p>
                        Nomor: <span className="font-bold">{nomorSurat || "......"}</span>
                      </p>
                    </div>
                    <div>
                      <p>
                        Tanggal:{" "}
                        {new Date().toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 text-sm leading-relaxed">
                    <p>Kepada Yth,</p>
                    <p className="font-bold text-base">{candidateFullName}</p>
                    <p>Di Tempat</p>
                  </div>

                  <div className="mb-6 text-sm leading-relaxed text-justify">
                    <p>
                      Berdasarkan hasil proses seleksi, kami mewakili manajemen{" "}
                      <strong>{selectedJob?.customerName || "Perusahaan"}</strong> dengan senang hati menawarkan
                      posisi pekerjaan kepada Anda dengan rincian sebagai berikut:
                    </p>
                  </div>

                  <div className="mb-6 text-sm border border-neutral-300 rounded p-4 bg-neutral-50/50">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-neutral-200">
                        <tr>
                          <td className="py-2 w-1/3 font-semibold text-neutral-700">Posisi</td>
                          <td className="py-2 w-4">:</td>
                          <td className="py-2 font-bold">{selectedJob?.posisi || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-neutral-700">Lokasi Penempatan</td>
                          <td className="py-2">:</td>
                          <td className="py-2">{selectedJob?.location || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-neutral-700">Masa Kontrak</td>
                          <td className="py-2">:</td>
                          <td className="py-2">
                            {startDate ? new Date(startDate).toLocaleDateString("id-ID") : "-"} s/d{" "}
                            {endDate ? new Date(endDate).toLocaleDateString("id-ID") : "-"}{" "}
                            <strong>({totalMonths} Bulan)</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mb-6 text-sm">
                    <h3 className="font-bold underline mb-2">Tugas dan Tanggung Jawab:</h3>
                    <div
                      dangerouslySetInnerHTML={{ __html: tugasHtml }}
                      className="text-black leading-relaxed prose-export pl-2"
                    />
                  </div>

                  <div className="mb-8 text-sm">
                    <h3 className="font-bold underline mb-2">Hak dan Fasilitas:</h3>
                    <div
                      dangerouslySetInnerHTML={{ __html: hakHtml }}
                      className="text-black leading-relaxed prose-export pl-2"
                    />
                  </div>

                  <div className="mb-12 text-sm text-justify leading-relaxed">
                    <p>
                      Demikian surat penawaran ini kami sampaikan. Harap dipelajari dan ditandatangani sebagai
                      bentuk persetujuan.
                    </p>
                  </div>

                  <div className="flex justify-between items-end text-sm pt-4">
                    <div className="text-center">
                      <p className="mb-20">Menyetujui,</p>
                      <p className="font-bold underline">{candidateFullName}</p>
                      <p className="text-xs text-neutral-600 font-sans">Kandidat</p>
                    </div>
                    <div className="text-center">
                      <p className="mb-20">Hormat Kami,</p>
                      <p className="font-bold underline">HR Department</p>
                      <p className="text-xs text-neutral-600 font-sans">
                        {selectedJob?.customerName || "Perusahaan"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* MCU Letter Visual Document */
                <div className="w-[720px] bg-white p-12 text-black font-serif shadow-md border rounded-sm">
                  <div className="flex flex-col items-center mb-8 border-b-2 border-black pb-4 text-center">
                    <img src="/icon.png" alt="Logo" className="w-20 h-20 mb-2 object-contain" />
                    <h1 className="text-xl font-bold uppercase tracking-wide text-center">
                      SURAT PENGANTAR MEDICAL CHECK-UP (MCU)
                    </h1>
                    <p className="text-xs text-neutral-600 font-sans">
                      PT DUA PERMATA PERSADA — HUMAN CAPITAL DIVISION
                    </p>
                  </div>

                  <div className="flex justify-between mb-6 text-sm">
                    <div>
                      <p>
                        Nomor: <span className="font-bold">{mcuNomorSurat || "......"}</span>
                      </p>
                    </div>
                    <div>
                      <p>
                        Tanggal:{" "}
                        {new Date().toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 text-sm leading-relaxed">
                    <p>Kepada Yth,</p>
                    <p className="font-bold">Pimpinan / Petugas Laboratorium MCU</p>
                    <p className="font-bold text-base">{mcuKlinik}</p>
                    <p>{mcuAlamatKlinik || "Di Tempat"}</p>
                  </div>

                  <div className="mb-6 text-sm leading-relaxed text-justify">
                    <p>
                      Dengan hormat, bersama surat ini kami menghadapkan calon karyawan dari{" "}
                      <strong>{selectedMcuJob?.customerName || "Perusahaan"}</strong> untuk dapat dilakukan
                      pemeriksaan kesehatan pra-penempatan kerja:
                    </p>
                  </div>

                  <div className="mb-6 text-sm border border-neutral-300 rounded p-4 bg-neutral-50/50">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-neutral-200">
                        <tr>
                          <td className="py-2 w-1/3 font-semibold text-neutral-700">Nama Calon Karyawan</td>
                          <td className="py-2 w-4">:</td>
                          <td className="py-2 font-bold">{selectedMcuCand?.user?.name || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-neutral-700">NIK / No. KTP</td>
                          <td className="py-2">:</td>
                          <td className="py-2 font-mono">{selectedMcuCand?.nik || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-neutral-700">Posisi yang Dituju</td>
                          <td className="py-2">:</td>
                          <td className="py-2">{selectedMcuJob?.posisi || "-"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-neutral-700">Tanggal Pemeriksaan</td>
                          <td className="py-2">:</td>
                          <td className="py-2">
                            {mcuTanggal
                              ? new Date(mcuTanggal).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-semibold text-neutral-700">Paket MCU</td>
                          <td className="py-2">:</td>
                          <td className="py-2 font-medium">{mcuPaket}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {mcuCatatan && (
                    <div className="mb-6 text-sm">
                      <h3 className="font-bold underline mb-1">Catatan Persiapan Calon Karyawan:</h3>
                      <p className="whitespace-pre-line text-neutral-800 leading-relaxed bg-amber-50/50 p-3 rounded border border-amber-200 text-xs font-sans">
                        {mcuCatatan}
                      </p>
                    </div>
                  )}

                  <div className="mb-10 text-sm leading-relaxed text-justify">
                    <p>
                      Segala biaya pemeriksaan agar ditagihkan langsung ke bagian HR/Finance{" "}
                      {selectedMcuJob?.customerName || "Perusahaan"}. Hasil pemeriksaan diharapkan dapat dikirimkan
                      kepada kami segera setelah proses verifikasi selesai.
                    </p>
                  </div>

                  <div className="flex justify-end text-sm pt-4">
                    <div className="text-center">
                      <p className="mb-20">Hormat Kami,</p>
                      <p className="font-bold underline">HR & Recruitment Dept.</p>
                      <p className="text-xs text-neutral-600 font-sans">
                        {selectedMcuJob?.customerName || "PT Dua Permata Persada"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN TEMPLATES FOR PDF CONVERSION (Captured via isolated sandbox iframe) */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "794px",
          zIndex: -9999,
          opacity: 0.01,
          pointerEvents: "none",
        }}
      >
        {/* Offering Letter HTML Template */}
        <div id="offering-pdf-template" style={{ width: "794px", backgroundColor: "#ffffff", padding: "48px" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "12px", marginBottom: "20px" }}>
            <img src="/icon.png" alt="Logo" style={{ width: "80px", height: "80px", margin: "0 auto 8px auto" }} />
            <h1 style={{ fontSize: "20px", fontWeight: "bold", textTransform: "uppercase" }}>OFFERING LETTER</h1>
            <p style={{ fontSize: "11px", color: "#555555" }}>
              PT DUA PERMATA PERSADA — RECRUITMENT & TALENT MANAGEMENT
            </p>
          </div>

          <table style={{ width: "100%", marginBottom: "16px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", padding: "4px 0" }}>
                  Nomor: <strong>{nomorSurat || "......"}</strong>
                </td>
                <td style={{ width: "50%", textAlign: "right", padding: "4px 0" }}>
                  Tanggal:{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginBottom: "16px" }}>
            <p>Kepada Yth,</p>
            <p style={{ fontWeight: "bold", fontSize: "15px" }}>{candidateFullName}</p>
            <p>Di Tempat</p>
          </div>

          <p style={{ marginBottom: "14px" }}>
            Berdasarkan hasil proses seleksi, kami mewakili manajemen{" "}
            <strong>{selectedJob?.customerName || "Perusahaan"}</strong> dengan senang hati menawarkan posisi
            pekerjaan kepada Anda dengan rincian sebagai berikut:
          </p>

          <table style={{ width: "100%", border: "1px solid #cccccc", padding: "8px", marginBottom: "16px" }}>
            <tbody>
              <tr>
                <td style={{ width: "30%", fontWeight: "bold", padding: "6px" }}>Posisi</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px", fontWeight: "bold" }}>{selectedJob?.posisi || "-"}</td>
              </tr>
              <tr>
                <td style={{ width: "30%", fontWeight: "bold", padding: "6px" }}>Lokasi Penempatan</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px" }}>{selectedJob?.location || "-"}</td>
              </tr>
              <tr>
                <td style={{ width: "30%", fontWeight: "bold", padding: "6px" }}>Masa Kontrak</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px" }}>
                  {startDate ? new Date(startDate).toLocaleDateString("id-ID") : "-"} s/d{" "}
                  {endDate ? new Date(endDate).toLocaleDateString("id-ID") : "-"} ({totalMonths} Bulan)
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ textDecoration: "underline", fontWeight: "bold", marginBottom: "6px" }}>
              Tugas dan Tanggung Jawab:
            </h3>
            <div dangerouslySetInnerHTML={{ __html: tugasHtml }} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ textDecoration: "underline", fontWeight: "bold", marginBottom: "6px" }}>
              Hak dan Fasilitas:
            </h3>
            <div dangerouslySetInnerHTML={{ __html: hakHtml }} />
          </div>

          <p style={{ marginBottom: "30px" }}>
            Demikian surat penawaran ini kami sampaikan. Harap dipelajari dan ditandatangani sebagai bentuk
            persetujuan.
          </p>

          <table style={{ width: "100%", marginTop: "30px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", textAlign: "center", paddingBottom: "70px" }}>Menyetujui,</td>
                <td style={{ width: "50%", textAlign: "center", paddingBottom: "70px" }}>Hormat Kami,</td>
              </tr>
              <tr>
                <td style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: "bold", textDecoration: "underline" }}>{candidateFullName}</p>
                  <p style={{ fontSize: "11px", color: "#555" }}>Kandidat</p>
                </td>
                <td style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: "bold", textDecoration: "underline" }}>HR Department</p>
                  <p style={{ fontSize: "11px", color: "#555" }}>{selectedJob?.customerName || "Perusahaan"}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MCU HTML Template */}
        <div id="mcu-pdf-template" style={{ width: "794px", backgroundColor: "#ffffff", padding: "48px" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "12px", marginBottom: "20px" }}>
            <img src="/icon.png" alt="Logo" style={{ width: "80px", height: "80px", margin: "0 auto 8px auto" }} />
            <h1 style={{ fontSize: "18px", fontWeight: "bold", textTransform: "uppercase" }}>
              SURAT PENGANTAR MEDICAL CHECK-UP (MCU)
            </h1>
            <p style={{ fontSize: "11px", color: "#555555" }}>
              PT DUA PERMATA PERSADA — HUMAN CAPITAL DIVISION
            </p>
          </div>

          <table style={{ width: "100%", marginBottom: "16px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", padding: "4px 0" }}>
                  Nomor: <strong>{mcuNomorSurat || "......"}</strong>
                </td>
                <td style={{ width: "50%", textAlign: "right", padding: "4px 0" }}>
                  Tanggal:{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginBottom: "16px" }}>
            <p>Kepada Yth,</p>
            <p style={{ fontWeight: "bold" }}>Pimpinan / Petugas Laboratorium MCU</p>
            <p style={{ fontWeight: "bold" }}>{mcuKlinik}</p>
            <p>{mcuAlamatKlinik || "Di Tempat"}</p>
          </div>

          <p style={{ marginBottom: "14px" }}>
            Dengan hormat, bersama surat ini kami menghadapkan calon karyawan dari{" "}
            <strong>{selectedMcuJob?.customerName || "Perusahaan"}</strong> untuk dapat dilakukan pemeriksaan
            kesehatan pra-penempatan kerja:
          </p>

          <table style={{ width: "100%", border: "1px solid #cccccc", padding: "8px", marginBottom: "16px" }}>
            <tbody>
              <tr>
                <td style={{ width: "32%", fontWeight: "bold", padding: "6px" }}>Nama Calon Karyawan</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px", fontWeight: "bold" }}>{selectedMcuCand?.user?.name || "-"}</td>
              </tr>
              <tr>
                <td style={{ width: "32%", fontWeight: "bold", padding: "6px" }}>NIK / No. KTP</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px" }}>{selectedMcuCand?.nik || "-"}</td>
              </tr>
              <tr>
                <td style={{ width: "32%", fontWeight: "bold", padding: "6px" }}>Posisi yang Dituju</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px" }}>{selectedMcuJob?.posisi || "-"}</td>
              </tr>
              <tr>
                <td style={{ width: "32%", fontWeight: "bold", padding: "6px" }}>Tanggal Pemeriksaan</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px" }}>
                  {mcuTanggal
                    ? new Date(mcuTanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </td>
              </tr>
              <tr>
                <td style={{ width: "32%", fontWeight: "bold", padding: "6px" }}>Paket MCU</td>
                <td style={{ width: "4%", padding: "6px" }}>:</td>
                <td style={{ padding: "6px" }}>{mcuPaket}</td>
              </tr>
            </tbody>
          </table>

          {mcuCatatan && (
            <div style={{ marginBottom: "16px", padding: "10px", border: "1px solid #e5e5e5", backgroundColor: "#fafafa" }}>
              <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: "4px" }}>
                Catatan Persiapan Calon Karyawan:
              </p>
              <p style={{ whiteSpace: "pre-line", fontSize: "12px" }}>{mcuCatatan}</p>
            </div>
          )}

          <p style={{ marginBottom: "30px" }}>
            Segala biaya pemeriksaan agar ditagihkan langsung ke bagian HR/Finance{" "}
            {selectedMcuJob?.customerName || "Perusahaan"}. Hasil pemeriksaan diharapkan dapat dikirimkan kepada kami
            segera setelah proses verifikasi selesai.
          </p>

          <table style={{ width: "100%", marginTop: "30px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%" }}></td>
                <td style={{ width: "50%", textAlign: "center", paddingBottom: "70px" }}>Hormat Kami,</td>
              </tr>
              <tr>
                <td></td>
                <td style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: "bold", textDecoration: "underline" }}>HR & Recruitment Dept.</p>
                  <p style={{ fontSize: "11px", color: "#555" }}>
                    {selectedMcuJob?.customerName || "PT Dua Permata Persada"}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
