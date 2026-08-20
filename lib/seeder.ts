import {
  MASTER_SKEMA_SERTIFIKASI,
  MASTER_INSTITUTE,
  MASTER_REJECTION_MESSAGE,
  TRAINING_CENTER_TYPES,
} from "./masterData";

export const generateDummyData = () => {
  // Clear all previous ugz_ keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("ugz_")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // Helper
  const randomId = (prefix: string) =>
    `${prefix}-${Math.random().toString(36).substr(2, 6)}`;
  const randomEl = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const randomDate = (start: Date, end: Date) =>
    new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    ).toISOString();

  // 1. MASTER DATA
  const masterCustomer = Array.from({ length: 10 }).map((_, i) => ({
    id: `CST-${i + 1}`,
    name: `PT Perusahaan Contoh ${i + 1} Tbk`,
  }));
  const masterProvince = Array.from({ length: 10 }).map((_, i) => ({
    id: `PRV-${i + 1}`,
    name: `Provinsi ${i + 1}`,
  }));
  const masterCity = Array.from({ length: 10 }).map((_, i) => ({
    id: `CTY-${i + 1}`,
    name: `Kota ${i + 1}`,
    provinceId: randomEl(masterProvince).id,
  }));

  const siteData = [
    {
      name: "KPC Sangatta Coal Mine",
      lat: 0.823979,
      lng: 117.599032,
      loc: "Kalimantan Timur",
    },
    { name: "Berau Coal Mine", lat: 2.15, lng: 117.5, loc: "Kalimantan Timur" },
    {
      name: "Tanjung Enim Coal Mine",
      lat: -4.118,
      lng: 103.772,
      loc: "Sumatera Selatan",
    },
    {
      name: "Ombilin Coal Mine",
      lat: -0.683611,
      lng: 100.766667,
      loc: "Sumatera Barat",
    },
    {
      name: "Martabe Gold Mine",
      lat: 1.527778,
      lng: 99.065556,
      loc: "Sumatera Utara",
    },
    {
      name: "Sorowako Nickel Mine",
      lat: -2.54598,
      lng: 121.35274,
      loc: "Sulawesi Selatan",
    },
    {
      name: "Morowali Nickel Mining Area",
      lat: -2.85,
      lng: 122.1,
      loc: "Sulawesi Tengah",
    },
    {
      name: "Weda Bay Nickel Mining Area",
      lat: 0.478319,
      lng: 127.983631,
      loc: "Maluku Utara",
    },
    {
      name: "Batu Hijau Mine",
      lat: -8.96,
      lng: 116.87,
      loc: "Nusa Tenggara Barat",
    },
    {
      name: "Grasberg Mine",
      lat: -4.05836,
      lng: 137.10811,
      loc: "Papua Tengah",
    },
  ];

  const masterSites = siteData.map((site, i) => ({
    id: `SIT-${i + 1}`,
    siteName: site.name,
    latitude: site.lat,
    longitude: site.lng,
    region: site.loc,
    customerId: randomEl(masterCustomer).id,
    cityId: randomEl(masterCity).id,
  }));

  const masterDept = Array.from({ length: 10 }).map((_, i) => ({
    id: `DPT-${i + 1}`,
    name: `Departemen ${i + 1}`,
  }));
  const masterPos = Array.from({ length: 10 }).map((_, i) => ({
    id: `POS-${i + 1}`,
    name: `Posisi Dummy ${i + 1}`,
  }));
  const masterReqType = Array.from({ length: 10 }).map((_, i) => ({
    id: `REQ-${i + 1}`,
    name: `Tipe Request ${i + 1}`,
  }));

  // Filter training centers from MASTER_INSTITUTE
  const trainingCenterInstitutes = MASTER_INSTITUTE.filter((inst) =>
    TRAINING_CENTER_TYPES.includes(inst.type)
  );

  localStorage.setItem("ugz_master_customer", JSON.stringify(masterCustomer));
  localStorage.setItem("ugz_master_province", JSON.stringify(masterProvince));
  localStorage.setItem("ugz_master_city", JSON.stringify(masterCity));
  localStorage.setItem(
    "ugz_master_sites_operation",
    JSON.stringify(masterSites),
  );
  localStorage.setItem("ugz_master_department", JSON.stringify(masterDept));
  localStorage.setItem("ugz_master_positions", JSON.stringify(masterPos));
  localStorage.setItem(
    "ugz_master_request_type",
    JSON.stringify(masterReqType),
  );
  localStorage.setItem(
    "ugz_master_skema_sertifikasi",
    JSON.stringify(MASTER_SKEMA_SERTIFIKASI),
  );
  localStorage.setItem("ugz_master_institute", JSON.stringify(MASTER_INSTITUTE));

  // Create 10 Rejection Messages if there aren't enough
  const rejectMessages = MASTER_REJECTION_MESSAGE.slice(0, 10);
  localStorage.setItem(
    "ugz_master_rejection_message",
    JSON.stringify(rejectMessages),
  );

  // 2. JOBS
  const jobStatuses = [
    "Active",
    "Active",
    "Active",
    "Draft",
    "Draft",
    "Closed",
    "Overdue",
    "Active",
    "Active",
    "Closed",
  ];
  const stages = [
    { id: "stage_1", title: "CV Screening" },
    { id: "stage_2", title: "Interview HR" },
    { id: "stage_3", title: "Psikotes" },
    { id: "stage_4", title: "Technical Test" },
    { id: "stage_5", title: "Interview User" },
    { id: "stage_6", title: "Offering" },
    { id: "stage_7", title: "MCU" },
  ];

  const jobs = Array.from({ length: 50 }).map((_, i) => {
    const cust = randomEl(masterCustomer);
    const city = randomEl(masterCity);
    const pos = randomEl(masterPos);
    const timeline = stages.map((st, idx) => {
      const isPast = idx < 2;
      return {
        id: st.id,
        title: st.title,
        status:
          jobStatuses[i % jobStatuses.length] === "Closed"
            ? "Completed"
            : isPast
              ? "Completed"
              : "Pending",
        startDate: new Date().toISOString(),
        deadlineDate: new Date(
          Date.now() + idx * 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    });

    return {
      id: randomId("job"),
      noRegistrasi: `REG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      posisi: pos.name,
      customerId: cust.id,
      cityId: city.id,
      provinceId: city.provinceId,
      siteId: randomEl(masterSites).id,
      statusPermintaan: i % 2 === 0 ? "Penambahan" : "Pergantian",
      jumlahPermintaan: Math.floor(Math.random() * 10) + 1,
      tanggalMasuk: randomDate(new Date(2025, 0, 1), new Date()),
      globalStatus: jobStatuses[i % jobStatuses.length],
      timeline: timeline,
      priority: Math.random() > 0.8,
    };
  });

  // 5 Explicit Priority Jobs
  const priorityJobs = Array.from({ length: 5 }).map((_, i) => {
    const cust = randomEl(masterCustomer);
    const city = randomEl(masterCity);
    const pos = randomEl(masterPos);
    const timeline = stages.map((st, idx) => ({
      id: st.id,
      title: st.title,
      status: idx === 0 ? "Completed" : "Pending",
      startDate: new Date().toISOString(),
      deadlineDate: new Date(Date.now() + (idx + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    return {
      id: randomId("job-prio"),
      noRegistrasi: `REG-PRIO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      posisi: `Priority ${pos.name}`,
      customerId: cust.id,
      cityId: city.id,
      provinceId: city.provinceId,
      siteId: randomEl(masterSites).id,
      statusPermintaan: "Penambahan",
      jumlahPermintaan: 10,
      tanggalMasuk: new Date().toISOString(),
      globalStatus: "Active",
      timeline: timeline,
      priority: true,
    };
  });
  const allJobs = [...jobs, ...priorityJobs];
  localStorage.setItem("ugz_jobs", JSON.stringify(allJobs));

  // 3. CANDIDATES
  const eduOptions = ["SMA/SMK", "D3", "S1", "S2"];
  const candidateProfiles: Record<string, any> = {};

  const candIds = Array.from({ length: 50 }).map(() => randomId("cand"));
  candIds.forEach((id, i) => {
    const trainingInst = randomEl(trainingCenterInstitutes);
    candidateProfiles[id] = {
      id: id,
      fullName: `Kandidat Dummy ${i + 1}`,
      email: `kandidat${i + 1}@example.com`,
      whatsapp: `0812345678${i}`,
      nik: `317123456789000${i}`,
      latestEducation: randomEl(eduOptions),
      city: randomEl(masterCity).name,
      province: randomEl(masterProvince).name,
      trainingCenterType: trainingInst.type,
      trainingCenter: trainingInst.name,
      isTalentPool: i % 3 === 0, // 1/3 are talent pool specific
    };
  });

  const prioCandIds = Array.from({ length: 50 }).map(() => randomId("cand-prio"));
  prioCandIds.forEach((id, i) => {
    const trainingInst = randomEl(trainingCenterInstitutes);
    candidateProfiles[id] = {
      id: id,
      fullName: `Kandidat Priority ${i + 1}`,
      email: `prio${i + 1}@example.com`,
      whatsapp: `08123456789${i}`,
      nik: `317123456789010${i}`,
      latestEducation: randomEl(eduOptions),
      city: randomEl(masterCity).name,
      province: randomEl(masterProvince).name,
      trainingCenterType: trainingInst.type,
      trainingCenter: trainingInst.name,
      isTalentPool: false,
    };
  });

  localStorage.setItem(
    "ugz_candidate_profiles",
    JSON.stringify(candidateProfiles),
  );

  // 4. APPLICATIONS
  const applications = Array.from({ length: 50 }).map((_, i) => {
    const isRejected = i % 4 === 0; // 25% rejected
    const isInterview = i % 3 === 0 && !isRejected;
    const jobId = jobs[i % jobs.length].id;

    let currentStage = "stage_1";
    let history = [
      {
        stageId: "stage_1",
        stageName: "CV Screening",
        date: new Date().toISOString(),
        note: "Applied",
      },
    ];

    if (isRejected) {
      currentStage = "Rejected";
      history.push({
        stageId: "Rejected",
        stageName: "Rejected at CV Screening",
        date: new Date().toISOString(),
        note: `Reason: ${randomEl(rejectMessages).message}`,
      });
    } else if (isInterview) {
      currentStage = "stage_2";
      history.push({
        stageId: "stage_2",
        stageName: "Interview HR",
        date: new Date().toISOString(),
        note: "Moved to Interview",
      });
    }

    return {
      id: randomId("app"),
      jobId: jobId,
      candidateId: candIds[i],
      applicationDate: randomDate(new Date(2025, 1, 1), new Date()),
      currentStage: currentStage,
      history: history,
    };
  });

  const prioApplications = prioCandIds.map((candId, i) => {
    const jobIndex = Math.floor(i / 10);
    const jobId = priorityJobs[jobIndex].id;
    
    const possibleStages = ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5", "stage_6", "stage_7", "Rejected"];
    const currentStage = possibleStages[i % possibleStages.length];
    
    const history = [
      {
        stageId: "stage_1",
        stageName: "CV Screening",
        date: new Date().toISOString(),
        note: "Applied (Priority Job)",
      },
    ];
    
    if (currentStage !== "stage_1") {
      history.push({
        stageId: currentStage,
        stageName: currentStage === "Rejected" ? "Rejected" : stages.find(s => s.id === currentStage)?.title || currentStage,
        date: new Date().toISOString(),
        note: "Updated Stage",
      });
    }

    return {
      id: randomId("app-prio"),
      jobId: jobId,
      candidateId: candId,
      applicationDate: new Date().toISOString(),
      currentStage: currentStage,
      history: history,
    };
  });

  const allApplications = [...applications, ...prioApplications];
  localStorage.setItem("ugz_applications", JSON.stringify(allApplications));
};
