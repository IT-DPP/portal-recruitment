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
  const companyNames = [
    "PT Pamapersada Nusantara",
    "PT United Tractors Tbk",
    "PT Bukit Asam Tbk",
    "PT Adaro Energy Indonesia Tbk",
    "PT Kaltim Prima Coal",
    "PT Freeport Indonesia",
    "PT Berau Coal",
    "PT Vale Indonesia Tbk",
    "PT Bumi Resources Tbk",
    "PT Petrosea Tbk",
  ];
  const masterCustomer = companyNames.map((name, i) => ({
    id: `CST-${i + 1}`,
    name: name,
  }));

  const masterProvince = [
    { id: "PRV-1", name: "Kalimantan Timur" },
    { id: "PRV-2", name: "Sumatera Selatan" },
    { id: "PRV-3", name: "Papua Tengah" },
    { id: "PRV-4", name: "Sulawesi Selatan" },
    { id: "PRV-5", name: "Maluku Utara" },
    { id: "PRV-6", name: "Sulawesi Tengah" },
  ];

  const masterCity = [
    { id: "CTY-1", name: "Sangatta", provinceId: "PRV-1" },
    { id: "CTY-2", name: "Balikpapan", provinceId: "PRV-1" },
    { id: "CTY-3", name: "Tanjung Enim", provinceId: "PRV-2" },
    { id: "CTY-4", name: "Muara Enim", provinceId: "PRV-2" },
    { id: "CTY-5", name: "Timika", provinceId: "PRV-3" },
    { id: "CTY-6", name: "Tembagapura", provinceId: "PRV-3" },
    { id: "CTY-7", name: "Sorowako", provinceId: "PRV-4" },
    { id: "CTY-8", name: "Makassar", provinceId: "PRV-4" },
    { id: "CTY-9", name: "Morowali", provinceId: "PRV-6" },
    { id: "CTY-10", name: "Halmahera Tengah", provinceId: "PRV-5" },
  ];

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
  const positionNames = [
    "Operator Hauler (HD785)",
    "Operator Excavator (PC2000)",
    "Mining Engineer",
    "Heavy Equipment Mechanic",
    "HSE Officer",
    "Pit Control Engineer",
    "Geologist",
    "Surveyor Tambang",
    "Drill & Blast Engineer",
    "Auto Electrician"
  ];
  const masterPos = positionNames.map((name, i) => ({
    id: `POS-${i + 1}`,
    name: name,
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
  const indonesianNames = [
    "Andi Pratama", "Budi Santoso", "Citra Kirana", "Dian Sastrowardoyo", "Eko Yulianto",
    "Fajar Nugroho", "Gita Gutawa", "Hendra Setiawan", "Irfan Hakim", "Joko Purwanto",
    "Kartika Putri", "Lukman Hakim", "Muhammad Rizky", "Nisa Sabyan", "Oka Antara",
    "Putra Perdana", "Qory Sandioriva", "Reza Rahadian", "Siti Aminah", "Taufik Hidayat",
    "Umar Syarief", "Vina Panduwinata", "Wawan Hendrawan", "Xaverius Prawiro", "Yusuf Mansur",
    "Zainal Arif", "Aditya Suryo", "Bayu Skak", "Chico Jericho", "Dede Sunandar",
    "Rizky Billar", "Agus Yudhoyono", "Tantri Syalindri", "Bambang Pamungkas", "Raffi Ahmad",
    "Bintang Emon", "Arya Saloka", "Deddy Corbuzier", "Ivan Gunawan", "Ahmad Dhani",
    "Ananda Omesh", "Denny Sumargo", "Dimas Anggara", "Surya Insomnia", "Iqbaal Ramadhan",
    "Kevin Sanjaya", "Marcus Fernaldi", "Anthony Ginting", "Jonatan Christie", "Greysia Polii",
    "Apriyani Rahayu", "Agnez Mo", "Raisa Andriana", "Isyana Sarasvati", "Tulus",
    "Kunto Aji", "Glenn Fredly", "Tompi", "Sandhy Sondoro", "Afgan Syahreza"
  ];
  const candidateProfiles: Record<string, any> = {};

  const candIds = Array.from({ length: 50 }).map(() => randomId("cand"));
  candIds.forEach((id, i) => {
    const trainingInst = randomEl(trainingCenterInstitutes);
    const name = indonesianNames[i % indonesianNames.length];
    const firstName = name.split(" ")[0].toLowerCase();
    candidateProfiles[id] = {
      id: id,
      fullName: name,
      email: `${firstName}${i + 1}@example.com`,
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
    const nameIndex = (i + 25) % indonesianNames.length;
    const name = indonesianNames[nameIndex];
    const firstName = name.split(" ")[0].toLowerCase();
    candidateProfiles[id] = {
      id: id,
      fullName: name,
      email: `prio.${firstName}${i + 1}@example.com`,
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

    const stageKeys = ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5", "stage_6", "stage_7"];
    
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
    } else {
      currentStage = stageKeys[i % stageKeys.length];
      if (currentStage !== "stage_1") {
        history.push({
          stageId: currentStage,
          stageName: currentStage === "stage_6" ? "Offering Letter" : currentStage === "stage_7" ? "MCU" : "Moved to Next Stage",
          date: new Date().toISOString(),
          note: "Updated Stage",
        });
      }
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
