"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  generateOfferingLetterDocx,
  generatePdfFromElement,
  printDocument,
  generateMcuDocx,
  generateMcuBatchDocx,
  generateBastExcel,
  getBase64FromUrl,
  McuLetterData,
  McuBatchDocumentData,
  OfferingLetterDataV2,
} from "@/lib/document-generator";
import {
  saveCandidateDocumentData,
  batchSaveBastData,
  getDocumentGenerationData,
} from "@/app/actions/document";
import McuDocumentTemplate from "@/components/dashboard/documents/McuDocumentTemplate";
import {
  MCU_CLINICS,
  McuClinic,
  McuCandidateRow,
  DEFAULT_MCU_CONTACT,
  MOCK_MCU_CANDIDATES,
} from "@/lib/mcu-clinics";
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
  Plus,
  Trash2,
  Loader2,
  Building2,
  MapPin,
  Users,
  Filter,
  CheckSquare,
  Square,
  Info,
  Sparkles,
  Building,
  Briefcase,
  ExternalLink,
} from "lucide-react";


// -------------------------------------------------------------------------
// Reusable Repeatable Field Component
// -------------------------------------------------------------------------
const RepeatableField = ({
  label,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) => {
  const handleAdd = () => onChange([...items, ""]);
  const handleRemove = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx));
  const handleChange = (idx: number, val: string) =>
    onChange(items.map((item, i) => (i === idx ? val : item)));

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-on-surface uppercase">
          {label}
        </label>
        {items.length > 0 && (
          <span className="text-[11px] text-on-surface-variant font-medium">
            {items.length} butir
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-3 bg-surface-container-low rounded-lg border border-dashed border-table-border text-center mb-2">
          <p className="text-xs text-on-surface-variant italic">
            Belum ada {label.toLowerCase()} yang ditambahkan. Klik tombol di bawah untuk menambah.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs font-semibold text-on-surface-variant mt-2.5 min-w-[24px] text-right">
                {idx + 1}.
              </span>
              <textarea
                rows={2}
                value={item}
                onChange={(e) => handleChange(idx, e.target.value)}
                placeholder={placeholder || `Isi ${label.toLowerCase()} ke-${idx + 1}`}
                className="flex-1 bg-surface-container-lowest border border-table-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface resize-none"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="mt-1.5 p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                title={`Hapus butir ${label.toLowerCase()} ke-${idx + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 border border-dashed border-primary/30 rounded-lg transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{addLabel}</span>
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
    clinics?: any[];
    provinces?: any[];
  };
  initialError?: string;
}

export default function GenerateDocumentsClient({
  initialData,
  initialError,
}: Props) {
  // Database States
  const [jobs, setJobs] = useState<any[]>(initialData?.jobs || []);
  const [applications, setApplications] = useState<any[]>(
    initialData?.applications || [],
  );
  const [customers, setCustomers] = useState<any[]>(
    initialData?.customers || [],
  );
  const [sites, setSites] = useState<any[]>(initialData?.sites || []);
  const [clinics, setClinics] = useState<any[]>(initialData?.clinics || []);
  const [provinces, setProvinces] = useState<any[]>(initialData?.provinces || []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(initialError ? { type: "error", text: initialError } : null);

  // Active Document Tab
  const [documentType, setDocumentType] = useState<"offering" | "bast" | "mcu">(
    "offering",
  );

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("/logo_company.png");

  // -------------------------------------------------------------------------
  // 1. OFFERING LETTER STATES
  // -------------------------------------------------------------------------
  const [olType, setOlType] = useState<"employee" | "internship">("employee");
  const [nomorSurat, setNomorSurat] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [pointOfHire, setPointOfHire] = useState("Lokal");
  const [masaKontrak, setMasaKontrak] = useState("1 Tahun");
  const [rosterJamKerja, setRosterJamKerja] = useState(
    "Mengikuti sistem roster & jam kerja yang berlaku pada area atau lokasi penempatan sesuai dengan kebutuhan operasional/customer dan kebijakan PT Dian Pandu Pratama.",
  );

  // Repeatable fields initialized with Employee template defaults
  const [tanggungJawab, setTanggungJawab] = useState<string[]>([
    "Melaksanakan pekerjaan sesuai dengan jabatan dan uraian pekerjaan yang diberikan oleh perusahaan.",
    "Mematuhi seluruh peraturan, prosedur kerja, standar keselamatan kerja, serta kebijakan perusahaan.",
    "Menunjukkan sikap profesional, disiplin, bertanggung jawab, serta menjaga etika kerja selama menjalankan tugas.",
  ]);
  const [hak, setHak] = useState<string[]>([
    "Upah : Rp 6.033.000 (UMSK Kab. Bekasi 2026)",
    "Tunjangan Lembur : Dibayarkan sesuai jam lembur actual",
    "Kompensasi PKWT : Dibayarkan sesuai kontrak kerja",
    "Tunjangan Hari Raya",
  ]);
  const [benefit, setBenefit] = useState<string[]>([]);

  // Function to apply standard templates matching official documents
  const applyDefaultTemplate = (type: "employee" | "internship", jobPosisi?: string) => {
    const pos = jobPosisi || selectedJob?.posisi || "";
    if (type === "employee") {
      setPointOfHire("Lokal");
      setMasaKontrak("1 Tahun");
      setRosterJamKerja(
        "Mengikuti sistem roster & jam kerja yang berlaku pada area atau lokasi penempatan sesuai dengan kebutuhan operasional/customer dan kebijakan PT Dian Pandu Pratama.",
      );
      setTanggungJawab([
        pos
          ? `Melaksanakan pekerjaan sesuai dengan jabatan ${pos} dan uraian pekerjaan yang diberikan oleh perusahaan.`
          : "Melaksanakan pekerjaan sesuai dengan jabatan dan uraian pekerjaan yang diberikan oleh perusahaan.",
        "Mematuhi seluruh peraturan, prosedur kerja, standar keselamatan kerja, serta kebijakan perusahaan.",
        "Menunjukkan sikap profesional, disiplin, bertanggung jawab, serta menjaga etika kerja selama menjalankan tugas.",
      ]);
      setHak([
        "Upah : Rp 6.033.000 (UMSK Kab. Bekasi 2026)",
        "Tunjangan Lembur : Dibayarkan sesuai jam lembur actual",
        "Kompensasi PKWT : Dibayarkan sesuai kontrak kerja",
        "Tunjangan Hari Raya",
      ]);
      setBenefit([]);
    } else {
      setPointOfHire("");
      setMasaKontrak("3 (Tiga) Bulan");
      setRosterJamKerja("");
      setTanggungJawab([
        pos
          ? `Bertanggung jawab dan menjalani tugas sebagai ${pos}`
          : "Bertanggung jawab dan menjalani tugas sebagai posisi magang yang ditugaskan",
      ]);
      setHak(["Uang Saku : Rp. 1.250.000,00."]);
      setBenefit([
        "BPJS Ketenaga Kerjaan (selama Magang)",
        "Makan Siang (Natura)",
      ]);
    }
  };

  const handleSelectOlType = (type: "employee" | "internship") => {
    setOlType(type);
    applyDefaultTemplate(type, selectedJob?.posisi);
  };

  // -------------------------------------------------------------------------
  // 2. BAST STATES
  // -------------------------------------------------------------------------
  const [bastNomorSurat, setBastNomorSurat] = useState("");
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
  const [isGeneratingBastExcel, setIsGeneratingBastExcel] = useState(false);

  // -------------------------------------------------------------------------
  // 3. MCU STATES (Prototype Surat Pengantar MCU Batch)
  // -------------------------------------------------------------------------
  const [mcuNomorSurat, setMcuNomorSurat] = useState("");
  const [mcuProvinceId, setMcuProvinceId] = useState<string>("");
  const [mcuClinicId, setMcuClinicId] = useState<string>("");
  const [mcuFilterPosisi, setMcuFilterPosisi] = useState<string>("");
  const [mcuFilterSite, setMcuFilterSite] = useState<string>("");
  const [mcuFilterCustomer, setMcuFilterCustomer] = useState<string>("");
  const [mcuSearchQuery, setMcuSearchQuery] = useState<string>("");
  const [mcuSelectedCandIds, setMcuSelectedCandIds] = useState<string[]>([
    "mock-mcu-1",
    "mock-mcu-2",
  ]);
  const [mcuCandidateOverrides, setMcuCandidateOverrides] = useState<
    Record<string, { kategori?: string; paketMcu?: string }>
  >({});

  // Auto-select initial clinic and province when clinics load
  useEffect(() => {
    if (clinics.length > 0 && !mcuClinicId) {
      const firstClinic = clinics[0];
      if (firstClinic.provinceId) {
        setMcuProvinceId(firstClinic.provinceId);
      }
      setMcuClinicId(firstClinic.id);
    }
  }, [clinics, mcuClinicId]);

  const handleProvinceChange = (provId: string) => {
    setMcuProvinceId(provId);
    const matching = provId
      ? clinics.filter((c) => c.provinceId === provId)
      : clinics;
    if (matching.length > 0) {
      setMcuClinicId(matching[0].id);
    } else {
      setMcuClinicId("");
    }
  };

  // Auto-generate surat numbers on load
  useEffect(() => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const romanMonths = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    const rMonth = romanMonths[month - 1] || "X";

    if (!nomorSurat) {
      setNomorSurat(`DPP/750/OL/${rMonth}/${year}`);
    }
    if (!mcuNomorSurat) {
      setMcuNomorSurat(`DPP/807/SKE/${rMonth}/${year}`);
    }
    if (!bastNomorSurat) {
      setBastNomorSurat(`DPP/247/BASTMP/${rMonth}/${year}`);
    }


    if (typeof window !== "undefined") {
      getBase64FromUrl("/logo_company.png").then((b64) => {
        if (b64) setLogoBase64(b64);
      });
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
        if (res.clinics) setClinics(res.clinics);
        if (res.provinces) setProvinces(res.provinces);
        setFeedbackMsg({
          type: "success",
          text: "Data database berhasil dimuat ulang.",
        });
      } else {
        setFeedbackMsg({
          type: "error",
          text: res.error || "Gagal memuat data.",
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: err?.message || "Koneksi database bermasalah.",
      });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // -------------------------------------------------------------------------
  // OFFERING DERIVED DATA
  // -------------------------------------------------------------------------
  // Perihal is auto-derived from OL type
  const perihal = useMemo(() => {
    return olType === "internship"
      ? "Surat Penawaran Magang"
      : "Surat Penawaran Kerja";
  }, [olType]);

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  // Helper to determine if candidate is at offering stage or above
  const isOfferingOrAbove = (app: any) => {
    const stageId = (app.currentStageId || "").toLowerCase();
    const stageName = (app.currentStage?.name || "").toLowerCase();
    const orderIndex = app.currentStage?.orderIndex;
    return (
      app.status === "HIRED" ||
      stageId === "stage_6" ||
      stageId === "stage_7" ||
      (typeof orderIndex === "number" && orderIndex >= 6) ||
      stageName.includes("offering") ||
      stageName.includes("mcu") ||
      stageName.includes("hired")
    );
  };

  // Only show jobs that have at least one candidate at offering letter stage or above
  const eligibleJobs = useMemo(() => {
    return jobs.filter((job) => {
      const jobApps = applications.filter((app) => app.jobId === job.id);
      return jobApps.some(isOfferingOrAbove);
    });
  }, [jobs, applications]);

  const jobApplications = useMemo(() => {
    if (!selectedJobId) return [];
    return applications.filter((app) => app.jobId === selectedJobId);
  }, [applications, selectedJobId]);

  // Filter only candidates at offering letter stage or above
  const eligibleCandidates = useMemo(() => {
    return jobApplications.filter(isOfferingOrAbove);
  }, [jobApplications]);

  const selectedApp = useMemo(() => {
    return applications.find((a) => a.id === selectedAppId);
  }, [applications, selectedAppId]);

  const selectedCandidateProfile = selectedApp?.candidateProfile;
  const candidateFullName =
    selectedCandidateProfile?.user?.name ||
    selectedCandidateProfile?.nik ||
    "Kandidat Terpilih";

  // Area auto-derived from selected job's site
  const selectedArea = useMemo(() => {
    if (!selectedJob) return "";
    return selectedJob.site?.name || selectedJob.location || "";
  }, [selectedJob]);

  // Offering Letter form data assembled
  const olFormData = useMemo((): OfferingLetterDataV2 | null => {
    if (!selectedJob || !selectedCandidateProfile) return null;
    return {
      type: olType,
      nomorSurat,
      perihal,
      nama: candidateFullName,
      posisi: selectedJob.posisi,
      pointOfHire: olType === "employee" ? pointOfHire : "",
      area: selectedArea,
      masaKontrak,
      rosterJamKerja: olType === "employee" ? rosterJamKerja : "",
      tanggungJawab: tanggungJawab.filter((t) => t.trim() !== ""),
      hak: hak.filter((h) => h.trim() !== ""),
      benefit: benefit.filter((b) => b.trim() !== ""),
    };
  }, [
    olType,
    nomorSurat,
    perihal,
    candidateFullName,
    selectedJob,
    selectedCandidateProfile,
    pointOfHire,
    selectedArea,
    masaKontrak,
    rosterJamKerja,
    tanggungJawab,
    hak,
    benefit,
  ]);

  // Fixed BPJS values for employee OL type
  const bpjsPerusahaan = [
    { label: "BPJS Ketenagakerjaan / JHT", value: "3,7%" },
    { label: "BPJS Ketenagakerjaan / JKK", value: "0,89%" },
    { label: "BPJS Ketenagakerjaan / JKM", value: "0,3%" },
    { label: "BPJS Ketenagakerjaan / JP", value: "2%" },
    { label: "BPJS Kesehatan", value: "4%" },
  ];

  const bpjsKaryawan = [
    { label: "BPJS Ketenagakerjaan / JHT", value: "2%" },
    { label: "BPJS Ketenagakerjaan / JP", value: "1%" },
    { label: "BPJS Kesehatan", value: "1%" },
    { label: "PPH21", value: "" },
    { label: "Potongan koperasi karyawan", value: "" },
  ];

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
              typeof app.stageData === "string"
                ? JSON.parse(app.stageData)
                : app.stageData;
            if (sd.bast) initialData = sd.bast;
          } catch (e) {}
        }
        newInputs[app.id] = {
          status: initialData.status || "LOKAL",
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
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId],
    );
  };

  const handleToggleJob = (jobId: string) => {
    setBastSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
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
      prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId],
    );
  };

  const handleToggleSelectAllCandidates = () => {
    if (bastSelectedApps.length === filteredBastCandidates.length) {
      setBastSelectedApps([]);
    } else {
      setBastSelectedApps(filteredBastCandidates.map((a) => a.id));
    }
  };

  const handleBastInputChange = (
    appId: string,
    field: string,
    value: string,
  ) => {
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
      setFeedbackMsg({
        type: "error",
        text: res.error || "Gagal menyimpan data BAST.",
      });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDownloadExcelBAST = async () => {
    if (bastSelectedApps.length === 0) {
      alert("Pilih minimal satu kandidat yang ingin disertakan dalam BAST.");
      return;
    }

    setIsGeneratingBastExcel(true);
    try {
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
            no: index + 1,
            noRequest: job?.noRegistrasi || "-",
            noB1: job?.noB1 || "-",
            tanggalTerimaB1: job?.tanggalMasuk || "-",
            nama: cand?.user?.name || cand?.nik || "-",
            nik: cand?.nik || "-",
            posisi: job?.posisi || "-",
            status: inputs.status || "LOKAL",
            nrpDpp: inputs.nrp || "-",
            areaKerja: site?.name || job?.location || "-",
            awalKontrak: inputs.start || "-",
            akhirKontrak: inputs.end || "-",
            linkSertifikat: inputs.link || "-",
            validasi: inputs.validasi || "Valid",
          };
        })
        .filter(Boolean);

      await generateBastExcel(rows, {
        customerName: currentCustomer?.name || "Customer",
        month: bastMonth,
        nomorBast: bastNomorSurat,
        logoUrl: "/logo_company.png",
      });
    } catch (err) {
      console.error("Error generating Excel BAST:", err);
      alert("Terjadi kesalahan saat memproses file Excel BAST.");
    } finally {
      setIsGeneratingBastExcel(false);
    }
  };

  // -------------------------------------------------------------------------
  // MCU LOGIC (Prototype Surat Pengantar MCU Batch)
  // -------------------------------------------------------------------------
  // Clinics filtered by selected province
  const availableMcuClinics = useMemo(() => {
    if (!mcuProvinceId) return clinics;
    return clinics.filter((c) => c.provinceId === mcuProvinceId);
  }, [clinics, mcuProvinceId]);

  const selectedClinic: McuClinic = useMemo(() => {
    const found = clinics.find((c) => c.id === mcuClinicId);
    if (found) {
      return {
        id: found.id,
        code: found.code,
        name: found.name,
        nama: found.name,
        address: found.address,
        alamat: found.address,
        provinceId: found.provinceId,
        province: found.province,
        wilayah: found.province?.name || "-",
        site: "-",
      };
    }
    if (clinics.length > 0) {
      const first = clinics[0];
      return {
        id: first.id,
        code: first.code,
        name: first.name,
        nama: first.name,
        address: first.address,
        alamat: first.address,
        provinceId: first.provinceId,
        province: first.province,
        wilayah: first.province?.name || "-",
        site: "-",
      };
    }
    return (
      MCU_CLINICS.find((c) => c.id === mcuClinicId) || MCU_CLINICS[0]
    );
  }, [clinics, mcuClinicId]);

  // Helper to determine if an application reached MCU stage
  const isCandidateAtMcuStage = (app: any) => {
    const stageId = (app.currentStageId || "").toLowerCase();
    const stageName = (app.currentStage?.name || "").toLowerCase();
    const orderIndex = app.currentStage?.orderIndex;
    const inHistory = app.history?.some(
      (h: any) =>
        (h.stageId || "").toLowerCase() === "stage_7" ||
        (h.stage?.name || "").toLowerCase().includes("mcu")
    );
    return (
      stageId === "stage_7" ||
      stageName.includes("mcu") ||
      (typeof orderIndex === "number" && orderIndex >= 7) ||
      inHistory ||
      app.status === "HIRED"
    );
  };

  // Build full pool of candidates at MCU stage (combining active DB applications + mock prototype candidates)
  const allMcuCandidates = useMemo(() => {
    const dbCandidates: McuCandidateRow[] = applications
      .filter(isCandidateAtMcuStage)
      .map((app) => {
        const job = jobs.find((j) => j.id === app.jobId);
        const cand = app.candidateProfile;
        const site = sites.find((s) => s.id === job?.siteId);
        const customer = customers.find((c) => c.id === job?.customerId);
        return {
          id: app.id,
          nama: (cand?.user?.name || cand?.nik || "Kandidat").toUpperCase(),
          nik: cand?.nik || "-",
          posisi: (job?.posisi || "WELDER").toUpperCase(),
          kategori: "PRE EMPLOYEE",
          paketMcu: site?.mcuPackage || "Paket Standar OHS Tambang - Fit to Work",
          site: site?.name || job?.location || "Head Office / Cikarang",
          customer: customer?.name || job?.customerName || "PT. Dian Pandu Pratama",
          jobOpeningId: job?.id,
          applicationId: app.id,
        };
      });

    // Merge with prototype mock candidates so it is immediately interactive out of the box
    const existingIds = new Set(dbCandidates.map((c) => c.id));
    const merged = [...dbCandidates];
    for (const mock of MOCK_MCU_CANDIDATES) {
      if (!existingIds.has(mock.id)) {
        merged.push(mock);
      }
    }
    return merged;
  }, [applications, jobs, sites, customers]);

  // Unique Filter Options
  const mcuPositions = useMemo(() => {
    const pos = Array.from(new Set(allMcuCandidates.map((c) => c.posisi))).filter(Boolean);
    return pos.sort();
  }, [allMcuCandidates]);

  const mcuSites = useMemo(() => {
    const sts = Array.from(new Set(allMcuCandidates.map((c) => c.site))).filter(Boolean);
    return sts.sort();
  }, [allMcuCandidates]);

  const mcuCustomers = useMemo(() => {
    const custs = Array.from(new Set(allMcuCandidates.map((c) => c.customer))).filter(Boolean);
    return custs.sort();
  }, [allMcuCandidates]);

  // Filtered Candidate List
  const filteredMcuCandidates = useMemo(() => {
    return allMcuCandidates.filter((cand) => {
      if (mcuFilterPosisi && cand.posisi !== mcuFilterPosisi) return false;
      if (mcuFilterSite && cand.site !== mcuFilterSite) return false;
      if (mcuFilterCustomer && cand.customer !== mcuFilterCustomer) return false;
      if (mcuSearchQuery) {
        const q = mcuSearchQuery.toLowerCase();
        const matchName = cand.nama.toLowerCase().includes(q);
        const matchNik = cand.nik.toLowerCase().includes(q);
        const matchPos = cand.posisi.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchPos) return false;
      }
      return true;
    });
  }, [
    allMcuCandidates,
    mcuFilterPosisi,
    mcuFilterSite,
    mcuFilterCustomer,
    mcuSearchQuery,
  ]);

  // Selected candidates prepared for document rendering
  const selectedMcuCandidatesList = useMemo(() => {
    return mcuSelectedCandIds
      .map((id) => allMcuCandidates.find((c) => c.id === id))
      .filter((c): c is McuCandidateRow => Boolean(c))
      .map((cand, idx) => {
        const overrides = mcuCandidateOverrides[cand.id] || {};
        return {
          id: cand.id,
          no: idx + 1,
          nama: cand.nama,
          nik: cand.nik,
          posisi: cand.posisi,
          kategori: overrides.kategori || cand.kategori || "PRE EMPLOYEE",
          paketMcu:
            overrides.paketMcu || cand.paketMcu || "Paket Standar OHS Tambang - Fit to Work",
          site: cand.site,
          customer: cand.customer,
        };
      });
  }, [
    mcuSelectedCandIds,
    allMcuCandidates,
    mcuCandidateOverrides,
  ]);

  const handleToggleSelectCandidate = (id: string) => {
    setMcuSelectedCandIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredMcuCandidates.map((c) => c.id);
    setMcuSelectedCandIds((prev) =>
      Array.from(new Set([...prev, ...filteredIds]))
    );
  };

  const handleDeselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredMcuCandidates.map((c) => c.id));
    setMcuSelectedCandIds((prev) =>
      prev.filter((id) => !filteredIdSet.has(id))
    );
  };

  const handleUpdateCandidateOverride = (
    id: string,
    field: "kategori" | "paketMcu",
    value: string
  ) => {
    setMcuCandidateOverrides((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // -------------------------------------------------------------------------
  // DOWNLOAD & PRINT HANDLERS
  // -------------------------------------------------------------------------
  const handleDownloadOfferingDocx = () => {
    if (!olFormData) {
      alert("Harap lengkapi Nomor Surat, Lowongan, dan Kandidat.");
      return;
    }
    generateOfferingLetterDocx(olFormData, "/logo_company.png");
  };

  const handleDownloadOfferingPdf = async () => {
    if (!olFormData) {
      alert("Harap lengkapi form dengan benar.");
      return;
    }
    setIsDownloading(true);
    await generatePdfFromElement(
      "offering-pdf-template",
      `Offering_Letter_${candidateFullName.replace(/\s+/g, "_")}`,
      "/logo_company.png"
    );
    setIsDownloading(false);
  };

  const handlePrintOffering = () => {
    if (!olFormData) {
      alert("Harap lengkapi form dengan benar.");
      return;
    }
    printDocument(
      "offering-pdf-template",
      `Offering Letter - ${candidateFullName}`,
      "/logo_company.png"
    );
  };

  const handleDownloadMcuDocx = () => {
    if (!mcuNomorSurat) {
      alert("Harap isi Nomor Surat terlebih dahulu.");
      return;
    }
    if (selectedMcuCandidatesList.length === 0) {
      alert("Pilih minimal satu kandidat yang sudah mencapai tahap MCU.");
      return;
    }
    const batchData: McuBatchDocumentData = {
      nomorSurat: mcuNomorSurat,
      perihal: "Surat Pengantar MCU",
      klinikNama: selectedClinic.name || selectedClinic.nama || "Klinik Rekanan MCU",
      klinikAlamat: selectedClinic.address || selectedClinic.alamat || "-",
      candidates: selectedMcuCandidatesList.map((c, i) => ({
        no: i + 1,
        nama: c.nama,
        nik: c.nik,
        posisi: c.posisi,
        kategori: c.kategori,
        paketMcu: c.paketMcu,
      })),
      picNama: DEFAULT_MCU_CONTACT.picName,
      picJabatan: DEFAULT_MCU_CONTACT.picJabatan,
      picTelepon: DEFAULT_MCU_CONTACT.picPhone,
      emails: DEFAULT_MCU_CONTACT.resultEmails,
      billingPerusahaan: DEFAULT_MCU_CONTACT.billing.company,
      billingUp: DEFAULT_MCU_CONTACT.billing.up,
      billingAlamat: DEFAULT_MCU_CONTACT.billing.address,
      kota: DEFAULT_MCU_CONTACT.signee.city,
      tanggalSurat: formattedDate,
      signeeNama: DEFAULT_MCU_CONTACT.signee.name,
      signeeJabatan: DEFAULT_MCU_CONTACT.signee.title,
    };
    generateMcuBatchDocx(batchData, "/logo_company.png");
  };

  const handleDownloadMcuPdf = async () => {
    if (!mcuNomorSurat) {
      alert("Harap isi Nomor Surat terlebih dahulu.");
      return;
    }
    if (selectedMcuCandidatesList.length === 0) {
      alert("Pilih minimal satu kandidat yang sudah mencapai tahap MCU.");
      return;
    }
    setIsDownloading(true);
    const cleanSurat = mcuNomorSurat.replace(/[\/\\]/g, "_");
    await generatePdfFromElement(
      "mcu-pdf-template",
      `Surat_Pengantar_MCU_${cleanSurat}`,
      "/logo_company.png"
    );
    setIsDownloading(false);
  };

  const handlePrintMcu = () => {
    if (!mcuNomorSurat) {
      alert("Harap isi Nomor Surat terlebih dahulu.");
      return;
    }
    if (selectedMcuCandidatesList.length === 0) {
      alert("Pilih minimal satu kandidat yang sudah mencapai tahap MCU.");
      return;
    }
    printDocument(
      "mcu-pdf-template",
      `Surat Pengantar MCU - ${mcuNomorSurat}`,
      "/logo_company.png"
    );
  };


  // Current formatted date
  const formattedDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Compute document title for the OL type
  const olDocTitle = olType === "internship"
    ? "SURAT PENAWARAN MAGANG"
    : "SURAT PENAWARAN KERJA";

  const olDocSubtitle = "(OFFERING LETTER)";

  return (
    <div className="flex-1 h-full overflow-y-auto bg-surface-container-lowest p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-table-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-on-surface">
                Generate Documents
              </h1>
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Kelola dan terbitkan Offering Letter, Berita Acara Serah Terima
              (BAST), dan Surat Pengantar MCU secara otomatis dari database.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl transition-colors shadow-xs"
              title="Perbarui data langsung dari database"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
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
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs hover:opacity-75"
            >
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
                  <h2 className="text-base font-semibold text-on-surface">
                    Form Offering Letter
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Pilih tipe OL, lowongan, dan kandidat yang telah mencapai tahap offering letter atau di atasnya.
                  </p>
                </div>
                <div className="flex items-center gap-2">
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

              {/* OL Type Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-on-surface uppercase">
                    Tipe Offering Letter
                  </label>
                  <button
                    type="button"
                    onClick={() => applyDefaultTemplate(olType, selectedJob?.posisi)}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    title="Muat ulang teks template resmi sesuai dokumen acuan"
                  >
                    Muat Ulang Teks Template Standar
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectOlType("employee")}
                    className={`flex-1 p-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                      olType === "employee"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-table-border bg-surface text-on-surface-variant hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${olType === "employee" ? "border-primary bg-primary" : "border-gray-300"}`} />
                      <span>Employee (Karyawan)</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectOlType("internship")}
                    className={`flex-1 p-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                      olType === "internship"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-table-border bg-surface text-on-surface-variant hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-3 h-3 rounded-full border-2 ${olType === "internship" ? "border-primary bg-primary" : "border-gray-300"}`} />
                      <span>Internship (Magang)</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nomor Surat */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    No. Surat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nomorSurat}
                    onChange={(e) => setNomorSurat(e.target.value)}
                    placeholder="Contoh: DPP/750/OL/IX/2026"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>

                {/* Perihal (auto-derived) */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Perihal (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={perihal}
                    readOnly
                    className="w-full bg-surface-container border border-table-border rounded-lg px-3.5 py-2 text-sm text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>

                {/* Pilih Lowongan */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Lowongan Pekerjaan <span className="text-red-500">*</span>
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
                    {eligibleJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.noRegistrasi} - {job.posisi} ({job.customerName})
                      </option>
                    ))}
                  </select>
                  {eligibleJobs.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Belum ada lowongan dengan kandidat di tahap Offering Letter atau di atasnya.
                    </p>
                  )}
                </div>

                {/* Pilih Kandidat */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-on-surface uppercase">
                      Kandidat <span className="text-red-500">*</span>
                    </label>
                    {selectedJobId && (
                      <span className="text-[11px] text-on-surface-variant font-medium">
                        {eligibleCandidates.length} kandidat eligible
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedAppId}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    disabled={!selectedJobId || eligibleCandidates.length === 0}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedJobId
                        ? "-- Pilih Lowongan Terlebih Dahulu --"
                        : eligibleCandidates.length === 0
                          ? "-- Tidak ada kandidat eligible --"
                          : "-- Pilih Kandidat --"}
                    </option>
                    {eligibleCandidates.map((app) => {
                      const name =
                        app.candidateProfile?.user?.name || "Kandidat";
                      const stageName = app.currentStage?.name || app.status;
                      const nik = app.candidateProfile?.nik
                        ? ` - NIK: ${app.candidateProfile.nik}`
                        : "";
                      return (
                        <option key={app.id} value={app.id}>
                          {name} ({stageName}){nik}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Nama (autofill, disabled) */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Nama (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={selectedCandidateProfile ? candidateFullName : ""}
                    readOnly
                    placeholder="Pilih kandidat untuk mengisi otomatis"
                    className="w-full bg-surface-container border border-table-border rounded-lg px-3.5 py-2 text-sm text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>

                {/* Posisi (autofill, disabled) */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Posisi (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={selectedJob ? selectedJob.posisi : ""}
                    readOnly
                    placeholder="Pilih lowongan untuk mengisi otomatis"
                    className="w-full bg-surface-container border border-table-border rounded-lg px-3.5 py-2 text-sm text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>

                {/* Point of Hire - only for employee */}
                {olType === "employee" && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                      Point of Hire
                    </label>
                    <input
                      type="text"
                      value={pointOfHire}
                      onChange={(e) => setPointOfHire(e.target.value)}
                      placeholder="Contoh: Lokal"
                      className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                    />
                  </div>
                )}

                {/* Area (autofill, disabled) */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Area (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={selectedArea}
                    readOnly
                    placeholder="Terisi otomatis dari area lowongan"
                    className="w-full bg-surface-container border border-table-border rounded-lg px-3.5 py-2 text-sm text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>

                {/* Masa Kontrak */}
                <div className={olType === "employee" ? "" : "md:col-span-2"}>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Masa Kontrak <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={masaKontrak}
                    onChange={(e) => setMasaKontrak(e.target.value)}
                    placeholder={olType === "internship" ? "Contoh: 3 (Tiga) Bulan" : "Contoh: 1 Tahun"}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface"
                  />
                </div>
              </div>

              {/* Roster & Jam Kerja - only for employee */}
              {olType === "employee" && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Roster & Jam Kerja (Otomatis)
                  </label>
                  <textarea
                    rows={3}
                    value={rosterJamKerja}
                    readOnly
                    className="w-full bg-surface-container border border-table-border rounded-lg p-3 text-sm text-on-surface-variant cursor-not-allowed outline-none resize-none"
                  />
                </div>
              )}

              {/* Repeatable: Tanggung Jawab */}
              <RepeatableField
                label="Tanggung Jawab"
                items={tanggungJawab}
                onChange={setTanggungJawab}
                addLabel="Tambah Tanggung Jawab"
                placeholder={olType === "internship"
                  ? `Contoh: Bertanggung jawab dan menjalani tugas sebagai ${selectedJob?.posisi || "Internship"}`
                  : `Contoh: Melaksanakan pekerjaan sesuai dengan jabatan ${selectedJob?.posisi || "posisi"} dan uraian pekerjaan yang diberikan oleh perusahaan.`
                }
              />

              {/* Repeatable: Hak */}
              <RepeatableField
                label="Hak"
                items={hak}
                onChange={setHak}
                addLabel="Tambah Hak"
                placeholder={olType === "internship"
                  ? "Contoh: Uang Saku : Rp. 1.250.000,00,."
                  : "Contoh: Upah : Rp 6.033.000 (UMSK Kab. Bekasi 2026)"
                }
              />

              {/* Repeatable: Benefit */}
              <RepeatableField
                label="Benefit"
                items={benefit}
                onChange={setBenefit}
                addLabel="Tambah Benefit"
                placeholder={olType === "internship"
                  ? "Contoh: BPJS Ketenaga Kerjaan (selama Magang)"
                  : "Contoh: Tunjangan Lembur : Dibayarkan sesuai jam lembur actual"
                }
              />

              {/* Fixed BPJS Section - Only for Employee */}
              {olType === "employee" && (
                <div className="p-4 bg-surface-container-lowest rounded-xl border border-table-border space-y-4">
                  <h3 className="text-xs font-semibold text-on-surface uppercase">
                    Potongan BPJS & Pajak (Nilai Tetap)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ditanggung Perusahaan */}
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-800 mb-2">
                        Ditanggung Perusahaan:
                      </p>
                      <div className="space-y-1">
                        {bpjsPerusahaan.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-emerald-700">
                            <span>{idx + 1}. {item.label}</span>
                            <span className="font-semibold">: {item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Ditanggung Karyawan */}
                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                      <p className="text-xs font-bold text-amber-800 mb-2">
                        Ditanggung Karyawan:
                      </p>
                      <div className="space-y-1">
                        {bpjsKaryawan.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-amber-700">
                            <span>{idx + 1}. {item.label}</span>
                            {item.value && (
                              <span className="font-semibold">: {item.value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={
                    !selectedJob || !selectedCandidateProfile || isDownloading
                  }
                  className="px-5 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-red-600" />
                  <span>
                    {isDownloading ? "Memproses PDF..." : "Download PDF"}
                  </span>
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
                    Saring data lowongan berdasarkan periode, customer, dan area
                    kerja untuk mengunduh dokumen serah terima kandidat dalam
                    format Excel.
                  </p>
                </div>
                {bastSelectedApps.length > 0 && (
                  <button
                    onClick={handleBatchSaveBast}
                    disabled={isSavingBast}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {isSavingBast
                        ? "Menyimpan..."
                        : `Simpan ${bastSelectedApps.length} Data ke DB`}
                    </span>
                  </button>
                )}
              </div>

              {/* Form & Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Nomor Dokumen BAST
                  </label>
                  <input
                    type="text"
                    value={bastNomorSurat}
                    onChange={(e) => setBastNomorSurat(e.target.value)}
                    placeholder="Contoh: DPP/247/BASTMP/IX/2026"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface font-mono"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Nomor surat resmi lampiran BAST yang dicantumkan pada judul Excel.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-1.5">
                    Periode Bulan & Tahun (Tanggal Masuk)
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
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Filter lowongan berdasarkan bulan masuk.
                  </p>
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
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Perusahaan mitra penerima serah terima.
                  </p>
                </div>
              </div>

              {/* Area / Sites Filter Chips */}
              {bastCustomerId && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface uppercase mb-2">
                    Filter Area / Site Operasional (
                    {
                      sites.filter((s) => s.customerId === bastCustomerId)
                        .length
                    }{" "}
                    Site)
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
                      Pilih Lowongan ({availableBastJobs.length} Lowongan
                      Ditemukan)
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
                      Tidak ada lowongan untuk customer dan periode{" "}
                      {bastMonth || "-"}.
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
                            {job.tanggalMasuk
                              ? new Date(job.tanggalMasuk).toLocaleDateString(
                                  "id-ID",
                                )
                              : "-"}
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
                        Kandidat Lolos / Hired ({availableBastCandidates.length}{" "}
                        Orang)
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
                                bastSelectedApps.length ===
                                  filteredBastCandidates.length &&
                                filteredBastCandidates.length > 0
                              }
                              onChange={handleToggleSelectAllCandidates}
                              className="w-4 h-4 rounded text-primary focus:ring-primary/40 cursor-pointer"
                            />
                          </th>
                          <th className="px-3 py-3 font-semibold">
                            Lowongan & No. B1
                          </th>
                          <th className="px-3 py-3 font-semibold">
                            Nama Kandidat
                          </th>
                          <th className="px-3 py-3 font-semibold">NIK</th>
                          <th className="px-3 py-3 font-semibold">Posisi</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold min-w-[120px]">
                            NRP DPP
                          </th>
                          <th className="px-3 py-3 font-semibold min-w-[130px]">
                            Awal Kontrak
                          </th>
                          <th className="px-3 py-3 font-semibold min-w-[130px]">
                            Akhir Kontrak
                          </th>
                          <th className="px-3 py-3 font-semibold min-w-[150px]">
                            Link Sertifikat
                          </th>
                          <th className="px-3 py-3 font-semibold min-w-[100px]">
                            Validasi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-table-border">
                        {filteredBastCandidates.length === 0 ? (
                          <tr>
                            <td
                              colSpan={11}
                              className="px-4 py-8 text-center text-on-surface-variant italic"
                            >
                              Tidak ada kandidat lolos pada lowongan yang
                              dipilih.
                            </td>
                          </tr>
                        ) : (
                          filteredBastCandidates.map((app) => {
                            const job = jobs.find((j) => j.id === app.jobId);
                            const cand = app.candidateProfile;
                            const inputs = bastInputs[app.id] || {};
                            const isSelected = bastSelectedApps.includes(
                              app.id,
                            );

                            return (
                              <tr
                                key={app.id}
                                className={`hover:bg-surface-container-low/60 transition-colors ${
                                  isSelected
                                    ? "bg-primary/5"
                                    : "bg-surface-container-lowest"
                                }`}
                              >
                                <td className="px-3 py-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      handleToggleCandidate(app.id)
                                    }
                                    className="w-4 h-4 rounded text-primary focus:ring-primary/40 cursor-pointer"
                                  />
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap font-medium text-on-surface">
                                  <div>{job?.noRegistrasi}</div>
                                  <div className="text-[10px] text-on-surface-variant">
                                    B1: {job?.noB1}
                                  </div>
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
                                    onChange={(e) =>
                                      handleBastInputChange(
                                        app.id,
                                        "status",
                                        e.target.value,
                                      )
                                    }
                                    className="w-28 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                    placeholder="Status"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={inputs.nrp || ""}
                                    onChange={(e) =>
                                      handleBastInputChange(
                                        app.id,
                                        "nrp",
                                        e.target.value,
                                      )
                                    }
                                    className="w-28 bg-surface border border-table-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary"
                                    placeholder="NRP Pegawai"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="date"
                                    value={inputs.start || ""}
                                    onChange={(e) =>
                                      handleBastInputChange(
                                        app.id,
                                        "start",
                                        e.target.value,
                                      )
                                    }
                                    className="w-32 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="date"
                                    value={inputs.end || ""}
                                    onChange={(e) =>
                                      handleBastInputChange(
                                        app.id,
                                        "end",
                                        e.target.value,
                                      )
                                    }
                                    className="w-32 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input
                                    type="text"
                                    value={inputs.link || ""}
                                    onChange={(e) =>
                                      handleBastInputChange(
                                        app.id,
                                        "link",
                                        e.target.value,
                                      )
                                    }
                                    className="w-36 bg-surface border border-table-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
                                    placeholder="https://..."
                                  />
                                </td>
                                <td className="px-3 py-2.5">
                                  <select
                                    value={inputs.validasi || "Valid"}
                                    onChange={(e) =>
                                      handleBastInputChange(
                                        app.id,
                                        "validasi",
                                        e.target.value,
                                      )
                                    }
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
                    disabled={bastSelectedApps.length === 0 || isGeneratingBastExcel}
                    className="px-5 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isGeneratingBastExcel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyiapkan Excel BAST...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Download Excel BAST (.xlsx)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SURAT PENGANTAR MCU TAB (Prototype DPP Site Operations) */}
          {/* ========================================================================= */}
          {documentType === "mcu" && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-table-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-on-surface">
                      Form Surat Pengantar Medical Check-Up (MCU)
                    </h2>
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                      Multi-Candidate
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Pilih klinik rujukan site operations dan centang kandidat yang telah mencapai tahap seleksi MCU untuk diterbitkan dokumen pengantar resmi.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={selectedMcuCandidatesList.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface border border-table-border hover:bg-surface-container text-on-surface rounded-lg transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span>Live Preview</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] rounded-full font-bold">
                      {selectedMcuCandidatesList.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Form Input: No. Surat & Cascading Filter Provinsi -> Klinik */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. No Surat */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-on-surface uppercase">
                      No. Surat Pengantar <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Free Text
                    </span>
                  </div>
                  <input
                    type="text"
                    value={mcuNomorSurat}
                    onChange={(e) => setMcuNomorSurat(e.target.value)}
                    placeholder="Contoh: DPP/807/SKE/X/2026"
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface font-mono"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Format penomoran dokumen resmi Head Office / Site.
                  </p>
                </div>

                {/* 2. Dropdown Provinsi Klinik (Master Data) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-on-surface uppercase">
                      Provinsi Klinik <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Master Wilayah
                    </span>
                  </div>
                  <select
                    value={mcuProvinceId}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface font-medium cursor-pointer"
                  >
                    <option value="">-- Semua Provinsi --</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name} ({prov.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Pilih provinsi untuk memfilter daftar klinik rujukan.
                  </p>
                </div>

                {/* 3. Dropdown Opsi Klinik berdasarkan Provinsi */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-on-surface uppercase">
                      Pilihan Klinik MCU <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {availableMcuClinics.length} klinik tersedia
                    </span>
                  </div>
                  <select
                    value={mcuClinicId}
                    onChange={(e) => setMcuClinicId(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface font-medium cursor-pointer"
                  >
                    {availableMcuClinics.length === 0 ? (
                      <option value="">Belum ada klinik di provinsi terpilih</option>
                    ) : (
                      availableMcuClinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name || clinic.nama} {clinic.code ? `(${clinic.code})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Klinik tujuan pelaksanaan pemeriksaan kesehatan kandidat.
                  </p>
                </div>
              </div>

              {/* Detail Info Card Klinik Terpilih */}
              <div className="bg-surface-container-low border border-table-border rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-on-surface">
                      {selectedClinic.name || selectedClinic.nama}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <MapPin className="w-3 h-3" />
                      Provinsi: {selectedClinic.province?.name || selectedClinic.wilayah || "-"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Sparkles className="w-3 h-3" />
                      Paket MCU: Dari Site Operations
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs pt-1 border-t border-table-border/60">
                  <div className="md:col-span-8">
                    <span className="font-semibold text-on-surface-variant block mb-0.5">
                      Alamat Lengkap Klinik (Dicetak pada Surat Pengantar):
                    </span>
                    <p className="text-on-surface leading-relaxed">
                      {selectedClinic.address || selectedClinic.alamat}
                    </p>
                  </div>
                  <div className="md:col-span-4">
                    <span className="font-semibold text-on-surface-variant block mb-0.5">
                      Ketentuan Paket Pemeriksaan:
                    </span>
                    <div className="p-2 bg-surface-container-lowest rounded border border-table-border/80 text-on-surface text-[11px] leading-relaxed">
                      <p className="text-on-surface-variant text-[11px]">
                        Standar paket MCU masing-masing kandidat terkonfigurasi secara dinamis sesuai ketentuan penempatan <strong>Site Operations</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* SECTION: SELEKSI KANDIDAT STAGE MCU */}
              {/* ===================================================================== */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold text-on-surface">
                        Pilih Kandidat (Khusus Stage: MCU)
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                        {allMcuCandidates.length} Kandidat Tersedia
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Dapat memilih kandidat dari berbagai area, posisi, dan customer asalkan telah mencapai tahap seleksi MCU.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-surface border border-table-border text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                    >
                      Pilih Semua ({filteredMcuCandidates.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFiltered}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-surface border border-table-border text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                {/* Filter Bar (Posisi, Site Operations, Customer, & Search) */}
                <div className="bg-surface-container-low p-3 rounded-xl border border-table-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Filter Posisi */}
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Filter Posisi / Job
                    </label>
                    <select
                      value={mcuFilterPosisi}
                      onChange={(e) => setMcuFilterPosisi(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Semua Posisi ({mcuPositions.length})</option>
                      {mcuPositions.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Site Operations */}
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Filter Site Operations
                    </label>
                    <select
                      value={mcuFilterSite}
                      onChange={(e) => setMcuFilterSite(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Semua Site ({mcuSites.length})</option>
                      {mcuSites.map((site) => (
                        <option key={site} value={site}>
                          {site}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Customer */}
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Filter Customer
                    </label>
                    <select
                      value={mcuFilterCustomer}
                      onChange={(e) => setMcuFilterCustomer(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-table-border rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Semua Customer ({mcuCustomers.length})</option>
                      {mcuCustomers.map((cust) => (
                        <option key={cust} value={cust}>
                          {cust}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Query */}
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Cari Nama / NIK
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={mcuSearchQuery}
                        onChange={(e) => setMcuSearchQuery(e.target.value)}
                        placeholder="Ketik nama atau NIK..."
                        className="w-full bg-surface-container-lowest border border-table-border rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Candidate Selection Table */}
                <div className="border border-table-border rounded-xl overflow-hidden bg-surface">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low text-on-surface-variant uppercase font-semibold sticky top-0 border-b border-table-border z-10">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredMcuCandidates.length > 0 &&
                                filteredMcuCandidates.every((c) =>
                                  mcuSelectedCandIds.includes(c.id)
                                )
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleSelectAllFiltered();
                                } else {
                                  handleDeselectAllFiltered();
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              title="Pilih semua yang sedang difilter"
                            />
                          </th>
                          <th className="p-3 w-12 text-center">NO</th>
                          <th className="p-3 min-w-[200px]">NAMA & NIK</th>
                          <th className="p-3 min-w-[150px]">POSISI</th>
                          <th className="p-3 min-w-[160px]">SITE & CUSTOMER</th>
                          <th className="p-3 min-w-[130px]">KATEGORI</th>
                          <th className="p-3 min-w-[240px]">PAKET MCU</th>
                          <th className="p-3 w-24 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-table-border/60">
                        {filteredMcuCandidates.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="p-8 text-center text-on-surface-variant italic"
                            >
                              Tidak ada kandidat di stage MCU yang sesuai dengan kriteria filter saat ini.
                            </td>
                          </tr>
                        ) : (
                          filteredMcuCandidates.map((cand, idx) => {
                            const isSelected = mcuSelectedCandIds.includes(cand.id);
                            const overrides = mcuCandidateOverrides[cand.id] || {};
                            const currentKategori =
                              overrides.kategori || cand.kategori || "PRE EMPLOYEE";
                            const currentPaket =
                              overrides.paketMcu ||
                              cand.paketMcu ||
                              "Paket Standar OHS Tambang - Fit to Work";

                            return (
                              <tr
                                key={cand.id}
                                className={`transition-colors hover:bg-surface-container-low/60 ${
                                  isSelected ? "bg-primary/5" : ""
                                }`}
                              >
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectCandidate(cand.id)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-center font-medium text-on-surface-variant">
                                  {idx + 1}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-on-surface">
                                    {cand.nama}
                                  </div>
                                  <div className="text-[11px] font-mono text-on-surface-variant">
                                    NIK: {cand.nik}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="inline-block px-2 py-0.5 font-semibold text-[11px] rounded bg-surface-container border border-table-border text-on-surface">
                                    {cand.posisi}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-on-surface">
                                    {cand.site}
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant">
                                    {cand.customer}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <select
                                    value={currentKategori}
                                    onChange={(e) =>
                                      handleUpdateCandidateOverride(
                                        cand.id,
                                        "kategori",
                                        e.target.value
                                      )
                                    }
                                    className="bg-surface-container-lowest border border-table-border rounded px-2 py-1 text-xs text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-full"
                                  >
                                    <option value="PRE EMPLOYEE">PRE EMPLOYEE</option>
                                    <option value="EMPLOYEE">EMPLOYEE</option>
                                    <option value="INTERNSHIP">INTERNSHIP</option>
                                  </select>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={currentPaket}
                                    onChange={(e) =>
                                      handleUpdateCandidateOverride(
                                        cand.id,
                                        "paketMcu",
                                        e.target.value
                                      )
                                    }
                                    className="w-full bg-surface-container-lowest border border-table-border rounded px-2 py-1 text-[11px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Paket MCU kandidat..."
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    MCU Stage
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Candidate Selection Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-container-low rounded-xl border border-table-border">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-on-surface">
                      {selectedMcuCandidatesList.length} dari {allMcuCandidates.length} kandidat dipilih untuk dicetak pada Surat Pengantar MCU
                    </span>
                  </div>

                  {selectedMcuCandidatesList.length === 0 && (
                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Centang minimal 1 kandidat di atas untuk mengaktifkan download.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons for MCU */}
              <div className="pt-4 border-t border-table-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    Template resmi PT Dian Pandu Pratama — Sesuai format layout aktual site.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    disabled={selectedMcuCandidatesList.length === 0}
                    className="px-4 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow-xs"
                  >
                    <Eye className="w-4 h-4 text-primary" />
                    <span>Live Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintMcu}
                    disabled={selectedMcuCandidatesList.length === 0}
                    className="px-4 py-2.5 bg-surface border border-table-border hover:bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 shadow-xs"
                    title="Cetak langsung atau simpan via browser print engine (Vector Crisp)"
                  >
                    <Printer className="w-4 h-4 text-neutral-600" />
                    <span>Cetak / Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMcuPdf}
                    disabled={selectedMcuCandidatesList.length === 0 || isDownloading}
                    className="px-5 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuat PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Dokumen PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMcuDocx}
                    disabled={selectedMcuCandidatesList.length === 0}
                    className="px-5 py-2.5 text-white bg-primary hover:bg-primary/90 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <Download className="w-4 h-4 text-blue-200" />
                    <span>Download DOCX (Word)</span>
                  </button>
                </div>
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
                  {documentType === "offering"
                    ? `Preview Offering Letter (${olType === "internship" ? "Magang" : "Employee"})`
                    : "Preview Surat Pengantar MCU"}
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
                /* ===== OFFERING LETTER PREVIEW ===== */
                <OfferingLetterPreview
                  olType={olType}
                  nomorSurat={nomorSurat}
                  perihal={perihal}
                  candidateFullName={candidateFullName}
                  posisi={selectedJob?.posisi || "-"}
                  pointOfHire={pointOfHire}
                  area={selectedArea}
                  masaKontrak={masaKontrak}
                  rosterJamKerja={rosterJamKerja}
                  tanggungJawab={tanggungJawab.filter((t) => t.trim() !== "")}
                  hak={hak.filter((h) => h.trim() !== "")}
                  benefit={benefit.filter((b) => b.trim() !== "")}
                  bpjsPerusahaan={bpjsPerusahaan}
                  bpjsKaryawan={bpjsKaryawan}
                  formattedDate={formattedDate}
                  olDocTitle={olDocTitle}
                  olDocSubtitle={olDocSubtitle}
                  logoSrc={logoBase64}
                />
              ) : (
                /* MCU Letter Visual Document (Batch Candidates DPP Official Format) */
                <div className="bg-white shadow-xl rounded border border-neutral-300 overflow-hidden">
                  <McuDocumentTemplate
                    id="mcu-preview-document"
                    nomorSurat={mcuNomorSurat}
                    perihal="Surat Pengantar MCU"
                    klinik={selectedClinic}
                    candidates={selectedMcuCandidatesList}
                    tanggalSurat={formattedDate}
                    logoSrc={logoBase64 || "/logo_company.png"}
                    showSignature={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIDDEN TEMPLATES FOR PDF CONVERSION */}
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
        {/* Offering Letter HTML Template for PDF */}
        <div
          id="offering-pdf-template"
          style={{
            width: "794px",
            backgroundColor: "#ffffff",
            padding: "24px 44px 32px 44px",
            fontFamily: "'Times New Roman', Times, serif",
            color: "#000000",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          {/* Header with Logo (Top Right) */}
          <table style={{ width: "100%", marginBottom: "8px", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ textAlign: "right", padding: 0 }}>
                  <div style={{ display: "inline-block", textAlign: "center" }}>
                    <img
                      src={logoBase64 || "/logo_company.png"}
                      alt="Logo PT Dian Pandu Pratama"
                      style={{
                        width: "56px",
                        height: "45px",
                        margin: "0 auto 2px auto",
                        display: "block",
                        objectFit: "contain",
                      }}
                    />
                    <p style={{ fontSize: "11px", fontWeight: "bold", textTransform: "lowercase", letterSpacing: "0.5px", margin: 0, color: "#111" }}>
                      dian pandu pratama
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Title (Only for internship OL) */}
          {olType === "internship" && (
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
              <h1 style={{ fontSize: "15px", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 2px 0" }}>
                SURAT PENAWARAN MAGANG
              </h1>
              <p style={{ fontSize: "12px", fontWeight: "bold", margin: 0 }}>
                (OFFERING LETTER)
              </p>
            </div>
          )}

          {/* Nomor & Perihal */}
          <table style={{ width: "100%", marginBottom: "12px" }}>
            <tbody>
              <tr>
                <td style={{ width: "70px", padding: "1px 0", verticalAlign: "top" }}>No.</td>
                <td style={{ width: "15px", padding: "1px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1px 0", fontWeight: "bold" }}>{nomorSurat || "......"}</td>
              </tr>
              <tr>
                <td style={{ padding: "1px 0", verticalAlign: "top" }}>Perihal</td>
                <td style={{ padding: "1px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1px 0", fontWeight: "bold" }}>{perihal}</td>
              </tr>
            </tbody>
          </table>

          {/* Body Text */}
          <p style={{ marginBottom: "10px", textAlign: "justify" }}>
            {olType === "employee"
              ? "Sebagai tindak lanjut proses rekrutmen di PT Dian Pandu Pratama, berikut kami informasikan perincian hak dan benefit serta tugas dan tanggung jawab calon karyawan sebagaimana yang tercantum dalam kontrak kerja sebagai berikut:"
              : "Sebagai tindak lanjut proses rekrutmen di PT Dian Pandu Pratama, berikut kami informasikan perincian hak dan benefit serta tugas dan tanggung jawab calon karyawan sebagaimana yang tercantum dalam kontrak kerja sebagai berikut:"
            }
          </p>

          {/* Detail Fields Table */}
          <table style={{ width: "100%", marginBottom: "10px" }}>
            <tbody>
              <tr>
                <td style={{ width: "140px", padding: "2px 0", verticalAlign: "top" }}>Nama</td>
                <td style={{ width: "15px", padding: "2px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "2px 0" }}>{candidateFullName}</td>
              </tr>
              <tr>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>Posisi</td>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "2px 0" }}>{selectedJob?.posisi || "-"}</td>
              </tr>
              {olType === "employee" && (
                <>
                  <tr>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>Masa Kontrak</td>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ padding: "2px 0" }}>{masaKontrak || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>Point Of Hire</td>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ padding: "2px 0" }}>{pointOfHire || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>Area</td>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ padding: "2px 0" }}>{selectedArea || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>Roster & Jam Kerja</td>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ padding: "2px 0", textAlign: "justify" }}>{rosterJamKerja}</td>
                  </tr>
                </>
              )}
              {olType === "internship" && (
                <>
                  <tr>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>Area</td>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ padding: "2px 0" }}>{selectedArea || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>Masa Kontrak</td>
                    <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                    <td style={{ padding: "2px 0" }}>{masaKontrak || "-"}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* Tanggung Jawab */}
          <p style={{ marginBottom: "4px", fontWeight: "normal" }}>
            {olType === "employee"
              ? "Kepada calon karyawan tersebut akan diberikan tanggung jawab dan memiliki Hak sebagai berikut:"
              : "Kepada calon Magang tersebut akan diberikan hak serta tugas dan tanggung jawab sebagai berikut:"
            }
          </p>

          <p style={{ fontWeight: "bold", margin: "6px 0 2px 0" }}>
            {olType === "employee" ? "Tanggung Jawab:" : "Tugas dan Tanggung Jawab:"}
          </p>
          <div style={{ paddingLeft: "16px", marginBottom: "6px" }}>
            {tanggungJawab.filter((t) => t.trim() !== "").map((item, idx) => (
              <p key={idx} style={{ margin: "1px 0" }}>
                {idx + 1}. &nbsp;{item}
              </p>
            ))}
          </div>

          {/* Hak */}
          <p style={{ fontWeight: "bold", margin: "6px 0 2px 0" }}>Hak:</p>
          <div style={{ paddingLeft: "16px", marginBottom: "6px" }}>
            {hak.filter((h) => h.trim() !== "").map((item, idx) => (
              <p key={idx} style={{ margin: "1px 0" }}>
                {idx + 1}. &nbsp;{item}
              </p>
            ))}
          </div>

          {/* Benefit - for internship */}
          {olType === "internship" && benefit.filter((b) => b.trim() !== "").length > 0 && (
            <>
              <p style={{ fontWeight: "bold", margin: "6px 0 2px 0" }}>Benefit:</p>
              <div style={{ paddingLeft: "16px", marginBottom: "6px" }}>
                {benefit.filter((b) => b.trim() !== "").map((item, idx) => (
                  <p key={idx} style={{ margin: "1px 0" }}>
                    {idx + 1}. &nbsp;{item}
                  </p>
                ))}
              </div>
            </>
          )}

          {/* BPJS Section - Employee only */}
          {olType === "employee" && (
            <div style={{ marginBottom: "6px" }}>
              {benefit.filter((b) => b.trim() !== "").length > 0 && (
                <>
                  <p style={{ fontWeight: "bold", margin: "6px 0 2px 0" }}>Benefit:</p>
                  <div style={{ paddingLeft: "16px", marginBottom: "6px" }}>
                    {benefit.filter((b) => b.trim() !== "").map((item, idx) => (
                      <p key={idx} style={{ margin: "1px 0" }}>
                        {idx + 1}. &nbsp;{item}
                      </p>
                    ))}
                  </div>
                </>
              )}

              <table style={{ width: "100%", marginTop: "4px", marginBottom: "4px" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "2px 4px" }}>
                      <p style={{ fontWeight: "bold", margin: "0 0 2px 0" }}>Ditanggung Perusahaan:</p>
                      {bpjsPerusahaan.map((item, idx) => (
                        <p key={idx} style={{ margin: "1px 0", fontSize: "12px" }}>
                          {idx + 1}. {item.label} : {item.value}
                        </p>
                      ))}
                    </td>
                    <td style={{ width: "50%", verticalAlign: "top", padding: "2px 4px" }}>
                      <p style={{ fontWeight: "bold", margin: "0 0 2px 0" }}>Ditanggung Karyawan:</p>
                      {bpjsKaryawan.map((item, idx) => (
                        <p key={idx} style={{ margin: "1px 0", fontSize: "12px" }}>
                          {idx + 1}. {item.label}{item.value ? ` : ${item.value}` : ""}
                        </p>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Closing */}
          <p style={{ marginBottom: "6px", textAlign: "justify" }}>
            {olType === "employee"
              ? "Demikian Surat Penawaran Kerja ini kami sampaikan."
              : `Demikian Offering Letter ini kami sampaikan. Apabila Anda setuju dengan penawaran yang diberikan, silahkan tanda tangani offering letter ini di tempat yang sudah disediakan. Apabila masih ada hal-hal yang ingin ditanyakan seputar penawaran kerja ini, silahkan menghubungi tim recruitment untuk pertanyaan lebih lanjut. Atas perhatian dan Kerjasama kami ucapkan terima kasih.`
            }
          </p>

          {olType === "employee" && (
            <p style={{ marginBottom: "16px", textAlign: "justify" }}>
              Atas perhatian dan kesediaan Saudara untuk bergabung bersama PT Dian Pandu Pratama, kami ucapkan terima kasih.
            </p>
          )}

          {/* Signatures */}
          <p style={{ marginBottom: "8px" }}>
            Cikarang, {formattedDate}
          </p>
          <table style={{ width: "100%", marginTop: "4px" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", paddingBottom: "70px" }}>
                  Mengetahui,
                </td>
                <td style={{ width: "50%", textAlign: "right", paddingBottom: "70px" }}>
                  Menyetujui,
                </td>
              </tr>
              <tr>
                <td>
                  <p style={{ fontWeight: "bold" }}>
                    {olType === "employee" ? "Mursidi" : "Felix Deo Gratias"}
                  </p>
                  <p style={{ fontSize: "11px", color: "#555" }}>
                    {olType === "employee"
                      ? "Recruitment & People Development Dept. Head"
                      : "Koordinator Recruitment HO"
                    }
                  </p>
                </td>
                <td style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: "bold", fontStyle: "italic" }}>
                    {candidateFullName}
                  </p>
                  <p style={{ fontSize: "11px", color: "#555" }}>
                    {olType === "employee" ? "Calon Karyawan" : "Calon Karyawan Magang"}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* MCU HTML Template (Batch Candidates Official DPP Letterhead) */}
        <McuDocumentTemplate
          id="mcu-pdf-template"
          nomorSurat={mcuNomorSurat}
          perihal="Surat Pengantar MCU"
          klinik={selectedClinic}
          candidates={selectedMcuCandidatesList}
          tanggalSurat={formattedDate}
          logoSrc={logoBase64 || "/logo_company.png"}
          showSignature={true}
        />
      </div>
    </div>
  );
}

// =========================================================================
// Offering Letter Preview Component
// =========================================================================
function OfferingLetterPreview({
  olType,
  nomorSurat,
  perihal,
  candidateFullName,
  posisi,
  pointOfHire,
  area,
  masaKontrak,
  rosterJamKerja,
  tanggungJawab,
  hak,
  benefit,
  bpjsPerusahaan,
  bpjsKaryawan,
  formattedDate,
  olDocTitle,
  olDocSubtitle,
  logoSrc,
}: {
  olType: "employee" | "internship";
  nomorSurat: string;
  perihal: string;
  candidateFullName: string;
  posisi: string;
  pointOfHire: string;
  area: string;
  masaKontrak: string;
  rosterJamKerja: string;
  tanggungJawab: string[];
  hak: string[];
  benefit: string[];
  bpjsPerusahaan: { label: string; value: string }[];
  bpjsKaryawan: { label: string; value: string }[];
  formattedDate: string;
  olDocTitle: string;
  olDocSubtitle: string;
  logoSrc?: string;
}) {
  return (
    <div className="w-[720px] bg-white px-10 py-6 text-black font-serif shadow-md border rounded-sm" style={{ fontSize: "13px", lineHeight: "1.5" }}>
      {/* Header Logo (Top Right) */}
      <table className="w-full mb-2">
        <tbody>
          <tr>
            <td className="text-right p-0">
              <div className="inline-block text-center">
                <img
                  src={logoSrc || "/logo_company.png"}
                  alt="Logo PT Dian Pandu Pratama"
                  className="w-14 h-11 object-contain mx-auto mb-0.5"
                />
                <p className="text-[11px] font-bold lowercase tracking-wide text-neutral-800">
                  dian pandu pratama
                </p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Title (Only for internship OL) */}
      {olType === "internship" && (
        <div className="text-center mb-3.5">
          <h1 className="text-sm font-bold uppercase tracking-wide">SURAT PENAWARAN MAGANG</h1>
          <p className="text-xs font-bold tracking-wide">(OFFERING LETTER)</p>
        </div>
      )}

      {/* Nomor & Perihal */}
      <div className="mb-3 text-sm">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-[70px] py-0.5 align-top">No.</td>
              <td className="w-4 py-0.5 align-top">:</td>
              <td className="py-0.5 font-bold">{nomorSurat || "......"}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Perihal</td>
              <td className="py-0.5 align-top">:</td>
              <td className="py-0.5 font-bold">{perihal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Body Text */}
      <div className="mb-2.5 text-sm leading-relaxed text-justify">
        <p>
          Sebagai tindak lanjut proses rekrutmen di PT Dian Pandu Pratama, berikut kami informasikan perincian hak dan benefit serta tugas dan tanggung jawab calon karyawan sebagaimana yang tercantum dalam kontrak kerja sebagai berikut:
        </p>
      </div>

      {/* Detail Fields */}
      <div className="mb-2.5 text-sm">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-[140px] py-0.5 align-top">Nama</td>
              <td className="w-4 py-0.5 align-top">:</td>
              <td className="py-0.5">{candidateFullName}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Posisi</td>
              <td className="py-0.5 align-top">:</td>
              <td className="py-0.5">{posisi}</td>
            </tr>
            {olType === "employee" && (
              <>
                <tr>
                  <td className="py-0.5 align-top">Masa Kontrak</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5">{masaKontrak || "-"}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Point Of Hire</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5">{pointOfHire || "-"}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Area</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5">{area || "-"}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Roster & Jam Kerja</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5 text-justify">{rosterJamKerja}</td>
                </tr>
              </>
            )}
            {olType === "internship" && (
              <>
                <tr>
                  <td className="py-0.5 align-top">Area</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5">{area || "-"}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Masa Kontrak</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5">{masaKontrak || "-"}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Transition text */}
      <p className="mb-2 text-sm">
        {olType === "employee"
          ? "Kepada calon karyawan tersebut akan diberikan tanggung jawab dan memiliki Hak sebagai berikut:"
          : "Kepada calon Magang tersebut akan diberikan hak serta tugas dan tanggung jawab sebagai berikut:"
        }
      </p>

      {/* Tanggung Jawab */}
      <div className="mb-2 text-sm">
        <p className="font-bold mb-0.5">
          {olType === "employee" ? "Tanggung Jawab:" : "Tugas dan Tanggung Jawab:"}
        </p>
        <div className="pl-4">
          {tanggungJawab.map((item, idx) => (
            <p key={idx} className="my-0.5">
              {idx + 1}. &nbsp;{item}
            </p>
          ))}
        </div>
      </div>

      {/* Hak */}
      <div className="mb-2 text-sm">
        <p className="font-bold mb-0.5">Hak:</p>
        <div className="pl-4">
          {hak.map((item, idx) => (
            <p key={idx} className="my-0.5">
              {idx + 1}. &nbsp;{item}
            </p>
          ))}
        </div>
      </div>

      {/* Benefit - shown for both internship and employee if added */}
      {benefit.length > 0 && (
        <div className="mb-2 text-sm">
          <p className="font-bold mb-0.5">Benefit:</p>
          <div className="pl-4">
            {benefit.map((item, idx) => (
              <p key={idx} className="my-0.5">
                {idx + 1}. &nbsp;{item}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* BPJS Section - Employee only */}
      {olType === "employee" && (
        <div className="mb-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold mb-0.5">Ditanggung Perusahaan:</p>
              {bpjsPerusahaan.map((item, idx) => (
                <p key={idx} className="text-xs my-0.5">
                  {idx + 1}. {item.label} : {item.value}
                </p>
              ))}
            </div>
            <div>
              <p className="font-bold mb-0.5">Ditanggung Karyawan:</p>
              {bpjsKaryawan.map((item, idx) => (
                <p key={idx} className="text-xs my-0.5">
                  {idx + 1}. {item.label}{item.value ? ` : ${item.value}` : ""}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Closing */}
      <div className="mb-3 text-sm text-justify">
        {olType === "employee" ? (
          <>
            <p className="mb-0.5">Demikian Surat Penawaran Kerja ini kami sampaikan.</p>
            <p>Atas perhatian dan kesediaan Saudara untuk bergabung bersama PT Dian Pandu Pratama, kami ucapkan terima kasih.</p>
          </>
        ) : (
          <p>
            Demikian <em>Offering Letter</em> ini kami sampaikan. Apabila Anda setuju dengan penawaran yang diberikan, silahkan tanda tangani <em>offering letter</em> ini di tempat yang sudah disediakan. Apabila masih ada hal-hal yang ingin ditanyakan seputar penawaran kerja ini, silahkan menghubungi tim <em>recruitment</em> untuk pertanyaan lebih lanjut. Atas perhatian dan Kerjasama kami ucapkan terima kasih.
          </p>
        )}
      </div>

      {/* Signature */}
      <p className="text-sm mb-1">Cikarang, {formattedDate}</p>
      <div className="flex justify-between items-end text-sm pt-1">
        <div>
          <p className="mb-14">Mengetahui,</p>
          <p className="font-bold">
            {olType === "employee" ? "Mursidi" : "Felix Deo Gratias"}
          </p>
          <p className="text-xs text-neutral-600 font-sans">
            {olType === "employee"
              ? "Recruitment & People Development Dept. Head"
              : "Koordinator Recruitment HO"
            }
          </p>
        </div>
        <div className="text-right">
          <p className="mb-14">Menyetujui,</p>
          <p className="font-bold italic">{candidateFullName}</p>
          <p className="text-xs text-neutral-600 font-sans">
            {olType === "employee" ? "Calon Karyawan" : "Calon Karyawan Magang"}
          </p>
        </div>
      </div>
    </div>
  );
}
