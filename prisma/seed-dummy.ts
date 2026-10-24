import { PrismaClient, UserRole, JobStatus, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai seeding data dummy recruitment sektor pertambangan...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // =========================================================================
  // 1. MASTER WILAYAH PERTAMBANGAN (Provinces & Cities)
  // =========================================================================
  console.log('📍 Menyiapkan Master Wilayah Pertambangan...');

  const miningLocations = [
    {
      province: 'Kalimantan Timur',
      code: 'KTI',
      cities: ['Kutai Timur', 'Berau', 'Samarinda', 'Balikpapan', 'Kutai Kartanegara', 'Bontang']
    },
    {
      province: 'Kalimantan Selatan',
      code: 'KSA',
      cities: ['Tanah Bumbu', 'Tabalong', 'Banjarmasin', 'Banjarbaru', 'Kotabaru']
    },
    {
      province: 'Sumatera Selatan',
      code: 'SSE',
      cities: ['Muara Enim', 'Lahat', 'Palembang', 'Prabumulih', 'Banyuasin']
    },
    {
      province: 'Sulawesi Tengah',
      code: 'STE',
      cities: ['Morowali', 'Morowali Utara', 'Palu', 'Luwuk']
    },
    {
      province: 'Sulawesi Selatan',
      code: 'SSN',
      cities: ['Luwu Timur', 'Makassar', 'Maros', 'Gowa', 'Palopo']
    },
    {
      province: 'Maluku Utara',
      code: 'MLU',
      cities: ['Halmahera Tengah', 'Halmahera Selatan', 'Ternate', 'Tidore Kepulauan']
    },
    {
      province: 'Papua Tengah',
      code: 'PTG',
      cities: ['Mimika', 'Nabire', 'Intan Jaya', 'Puncak Jaya']
    },
    {
      province: 'Nusa Tenggara Barat',
      code: 'NTB',
      cities: ['Sumbawa Barat', 'Sumbawa', 'Mataram', 'Lombok Timur']
    },
    {
      province: 'Sumatera Utara',
      code: 'SMU',
      cities: ['Tapanuli Selatan', 'Medan', 'Mandailing Natal', 'Deli Serdang']
    },
    {
      province: 'DKI Jakarta',
      code: 'JKT',
      cities: ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat']
    },
    {
      province: 'Jawa Barat',
      code: 'JBR',
      cities: ['Bandung', 'Bekasi', 'Bogor', 'Cimahi']
    },
    {
      province: 'Jawa Timur',
      code: 'JTM',
      cities: ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik']
    }
  ];

  const cityMap = new Map<string, string>(); // cityName -> cityId
  const provinceMap = new Map<string, string>(); // provName -> provId

  for (const loc of miningLocations) {
    let prov = await prisma.masterProvince.findFirst({
      where: { OR: [{ name: loc.province }, { code: loc.code }] }
    });
    if (!prov) {
      prov = await prisma.masterProvince.create({
        data: { name: loc.province, code: loc.code }
      });
    }
    provinceMap.set(loc.province, prov.id);

    for (const cName of loc.cities) {
      let city = await prisma.masterCity.findFirst({
        where: { name: cName, provinceId: prov.id }
      });
      if (!city) {
        city = await prisma.masterCity.create({
          data: { name: cName, provinceId: prov.id }
        });
      }
      cityMap.set(cName, city.id);
    }
  }

  // =========================================================================
  // 2. MASTER CUSTOMERS & SITES PERTAMBANGAN
  // =========================================================================
  console.log('🏭 Menyiapkan Master Perusahaan & Site Operasional Tambang...');

  const miningCustomers = [
    { code: 'CUST-KPC', name: 'PT Kaltim Prima Coal' },
    { code: 'CUST-BRC', name: 'PT Berau Coal' },
    { code: 'CUST-PTBA', name: 'PT Bukit Asam Tbk' },
    { code: 'CUST-FMI', name: 'PT Freeport Indonesia' },
    { code: 'CUST-VALE', name: 'PT Vale Indonesia Tbk' },
    { code: 'CUST-UT', name: 'PT United Tractors Tbk' },
    { code: 'CUST-PAMA', name: 'PT Pamapersada Nusantara' },
    { code: 'CUST-IMIP', name: 'PT Indonesia Morowali Industrial Park' },
    { code: 'CUST-IWIP', name: 'PT Indonesia Weda Bay Industrial Park' },
    { code: 'CUST-AMMAN', name: 'PT Amman Mineral Nusa Tenggara' }
  ];

  const customerMap = new Map<string, string>();
  for (const c of miningCustomers) {
    let cust = await prisma.masterCustomer.findFirst({
      where: { OR: [{ name: c.name }, { code: c.code }] }
    });
    if (!cust) {
      cust = await prisma.masterCustomer.create({ data: c });
    }
    customerMap.set(c.name, cust.id);
  }

  const miningSitesConfig = [
    {
      code: 'SITE-KPC-SGT',
      name: 'KPC Sangatta Coal Mine',
      customerName: 'PT Kaltim Prima Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      lat: 0.823979,
      lng: 117.599032,
      mcuPackage: 'Paket Tambang Standar OHS KPC - Fit to Work Category A'
    },
    {
      code: 'SITE-BRC-BER',
      name: 'Berau Coal Mine Area',
      customerName: 'PT Berau Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Berau',
      lat: 2.15,
      lng: 117.5,
      mcuPackage: 'Paket Pit Worker & Surveyor OHS Berau Coal'
    },
    {
      code: 'SITE-PTBA-TJE',
      name: 'Tanjung Enim Coal Mine',
      customerName: 'PT Bukit Asam Tbk',
      provinceName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      lat: -4.118,
      lng: 103.772,
      mcuPackage: 'Paket Operator & Mekanik Alat Berat PTBA'
    },
    {
      code: 'SITE-IMIP-MRW',
      name: 'Morowali Nickel Mining Area',
      customerName: 'PT Indonesia Morowali Industrial Park',
      provinceName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      lat: -2.85,
      lng: 122.1,
      mcuPackage: 'Paket Smelter & Heavy Duty Mining IMIP'
    },
    {
      code: 'SITE-IWIP-WDB',
      name: 'Weda Bay Nickel Mining Area',
      customerName: 'PT Indonesia Weda Bay Industrial Park',
      provinceName: 'Maluku Utara',
      cityName: 'Halmahera Tengah',
      lat: 0.478319,
      lng: 127.983631,
      mcuPackage: 'Paket High Dust & Remote Mining IWIP'
    },
    {
      code: 'SITE-VALE-SRW',
      name: 'Sorowako Nickel Mine',
      customerName: 'PT Vale Indonesia Tbk',
      provinceName: 'Sulawesi Selatan',
      cityName: 'Luwu Timur',
      lat: -2.54598,
      lng: 121.35274,
      mcuPackage: 'Paket Tambang Nikel Terbuka Vale - Fit for High Hazard'
    },
    {
      code: 'SITE-FMI-GRS',
      name: 'Grasberg Mine Timika',
      customerName: 'PT Freeport Indonesia',
      provinceName: 'Papua Tengah',
      cityName: 'Mimika',
      lat: -4.05836,
      lng: 137.10811,
      mcuPackage: 'Paket High Altitude & Underground Mining Grasberg (Papua)'
    },
    {
      code: 'SITE-AMNT-BTH',
      name: 'Batu Hijau Copper & Gold Mine',
      customerName: 'PT Amman Mineral Nusa Tenggara',
      provinceName: 'Nusa Tenggara Barat',
      cityName: 'Sumbawa Barat',
      lat: -8.96,
      lng: 116.87,
      mcuPackage: 'Paket Full Panel Pit & Plant Batu Hijau'
    },
    {
      code: 'SITE-MTB-TSL',
      name: 'Martabe Gold Mine',
      customerName: 'PT United Tractors Tbk',
      provinceName: 'Sumatera Utara',
      cityName: 'Tapanuli Selatan',
      lat: 1.527778,
      lng: 99.065556,
      mcuPackage: 'Paket Exploration & Gold Mining Martabe'
    }
  ];

  const siteMap = new Map<string, any>();
  for (const s of miningSitesConfig) {
    const custId = customerMap.get(s.customerName) || (await prisma.masterCustomer.findFirst())!.id;
    const provId = provinceMap.get(s.provinceName) || (await prisma.masterProvince.findFirst())!.id;
    const cityId = cityMap.get(s.cityName) || (await prisma.masterCity.findFirst({ where: { provinceId: provId } }))!.id;

    let existingSite = await prisma.masterSite.findFirst({
      where: { name: s.name }
    });

    if (existingSite) {
      existingSite = await prisma.masterSite.update({
        where: { id: existingSite.id },
        data: {
          customerId: custId,
          provinceId: provId,
          cityId: cityId,
          latitude: s.lat,
          longitude: s.lng,
          useSpecificSla: true,
          mcuPackage: s.mcuPackage
        }
      });
    } else {
      existingSite = await prisma.masterSite.create({
        data: {
          code: s.code,
          name: s.name,
          customerId: custId,
          provinceId: provId,
          cityId: cityId,
          latitude: s.lat,
          longitude: s.lng,
          useSpecificSla: true,
          mcuPackage: s.mcuPackage
        }
      });
    }
    siteMap.set(s.name, existingSite);
  }

  // =========================================================================
  // 2b. MASTER KLINIK REKANAN MCU (Medical Check Up)
  // =========================================================================
  console.log('🏥 Menyiapkan Master Data Klinik Rekanan MCU...');

  const miningClinicsConfig = [
    {
      code: 'CLN-TRT-SGT',
      name: 'Klinik Tirta Medical Sangatta',
      provinceName: 'Kalimantan Timur',
      address: 'Jl. Yos Sudarso II No. 45, Sangatta Utara, Kabupaten Kutai Timur, Kalimantan Timur 75611'
    },
    {
      code: 'CLN-KFA-BPN',
      name: 'Klinik & Lab Kimia Farma Balikpapan',
      provinceName: 'Kalimantan Timur',
      address: 'Jl. Jenderal Sudirman No. 34, Klandasan Ilir, Balikpapan Kota, Kalimantan Timur 76113'
    },
    {
      code: 'CLN-PRD-SMD',
      name: 'Laboratorium Klinik Prodia Samarinda',
      provinceName: 'Kalimantan Timur',
      address: 'Jl. Pangeran Hidayatullah No. 12, Kel. Pasar Pagi, Kota Samarinda, Kalimantan Timur 75112'
    },
    {
      code: 'CLN-TRT-BTK',
      name: 'Klinik Tirta Medical Batu Kajang',
      provinceName: 'Kalimantan Timur',
      address: 'Jl. Negara Km. 145, Desa Batu Kajang, Kec. Batu Sopang, Kab. Paser, Kalimantan Timur 76252'
    },
    {
      code: 'CLN-CTM-BTL',
      name: 'Klinik Citra Medika Batulicin',
      provinceName: 'Kalimantan Selatan',
      address: 'Jl. Transmigrasi Km. 3.5, Batulicin, Kabupaten Tanah Bumbu, Kalimantan Selatan 72271'
    },
    {
      code: 'CLN-PRD-BJM',
      name: 'Laboratorium Klinik Prodia Banjarmasin',
      provinceName: 'Kalimantan Selatan',
      address: 'Jl. Pangeran Samudra No. 89, Kertak Baru Ulu, Banjarmasin Tengah, Kalimantan Selatan 70111'
    },
    {
      code: 'CLN-BAM-TJE',
      name: 'RS Bukit Asam Medika Tanjung Enim',
      provinceName: 'Sumatera Selatan',
      address: 'Jl. Plumeria No. 1, Komperta Tanjung Enim, Kab. Muara Enim, Sumatera Selatan 31735'
    },
    {
      code: 'CLN-PRD-PLM',
      name: 'Laboratorium Klinik Prodia Palembang',
      provinceName: 'Sumatera Selatan',
      address: 'Jl. Jend. Basuki Rachmat No. 801, Kemuning, Palembang, Sumatera Selatan 30127'
    },
    {
      code: 'CLN-IMP-BHD',
      name: 'Klinik Occupational Health IMIP Morowali',
      provinceName: 'Sulawesi Tengah',
      address: 'Kawasan Industri IMIP, Kec. Bahodopi, Kab. Morowali, Sulawesi Tengah 94974'
    },
    {
      code: 'CLN-MDP-PLU',
      name: 'Klinik Medika Pratama Palu',
      provinceName: 'Sulawesi Tengah',
      address: 'Jl. Sam Ratulangi No. 56, Besusu Barat, Kota Palu, Sulawesi Tengah 94118'
    },
    {
      code: 'CLN-VLE-SRW',
      name: 'RS Inco / Vale Sorowako Mining Clinic',
      provinceName: 'Sulawesi Selatan',
      address: 'Jl. Niaga No. 1, Sorowako, Kec. Nuha, Kab. Luwu Timur, Sulawesi Selatan 92984'
    },
    {
      code: 'CLN-BMD-MKS',
      name: 'Bio Medika Occupational Health Makassar',
      provinceName: 'Sulawesi Selatan',
      address: 'Jl. Boulevard Panakkukang Blok F-5, Panakkukang, Kota Makassar, Sulawesi Selatan 90222'
    },
    {
      code: 'CLN-WDB-HLT',
      name: 'Klinik Pratama Weda Bay Cares',
      provinceName: 'Maluku Utara',
      address: 'Kawasan Industri IWIP Tanjung Ulie, Weda Tengah, Halmahera Tengah, Maluku Utara 97853'
    },
    {
      code: 'CLN-SOS-TMK',
      name: 'Klinik Rujukan International SOS Timika',
      provinceName: 'Papua Tengah',
      address: 'Jl. Kuala Kencana No. 88, Timika, Kabupaten Mimika, Papua Tengah 99910'
    },
    {
      code: 'CLN-AMM-BTH',
      name: 'Klinik Sehat Townsite Batu Hijau',
      provinceName: 'Nusa Tenggara Barat',
      address: 'Camp Batu Hijau Townsite, Maluk, Kabupaten Sumbawa Barat, Nusa Tenggara Barat 84456'
    },
    {
      code: 'CLN-MTS-MDN',
      name: 'RS Mitra Sejati Occupational Center',
      provinceName: 'Sumatera Utara',
      address: 'Jl. Jenderal Besar A.H. Nasution No. 7, Medan Johor, Kota Medan, Sumatera Utara 20143'
    },
    {
      code: 'CLN-TRT-TBN',
      name: 'Klinik Tirta Medical Tambun Bekasi',
      provinceName: 'Jawa Barat',
      address: 'Ruko Blok AA 9 No. 1–2, Jl. Celebration Boulevard Kav. 1, Kel. Lambangjaya, Kec. Tambun Selatan, Kab. Bekasi, Jawa Barat 17510'
    },
    {
      code: 'CLN-PRD-BDG',
      name: 'Laboratorium Klinik Prodia Bandung',
      provinceName: 'Jawa Barat',
      address: 'Jl. Wastukencana No. 38, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40117'
    },
    {
      code: 'CLN-MDP-JKT',
      name: 'Medika Plaza Occupational Health TB Simatupang',
      provinceName: 'DKI Jakarta',
      address: 'Beltway Office Park Tower B Lantai 5, Jl. TB Simatupang No. 41, Cilandak, Jakarta Selatan, DKI Jakarta 12550'
    },
    {
      code: 'CLN-SLM-MRCC',
      name: 'MRCCC Siloam Hospitals Semanggi',
      provinceName: 'DKI Jakarta',
      address: 'Jl. Garnisun No. 2-3, Karet Semanggi, Setiabudi, Jakarta Pusat, DKI Jakarta 12930'
    },
    {
      code: 'CLN-PRD-SBY',
      name: 'Laboratorium Klinik Prodia Surabaya',
      provinceName: 'Jawa Timur',
      address: 'Jl. Diponegoro No. 149-151, Darmo, Wonokromo, Kota Surabaya, Jawa Timur 60241'
    }
  ];

  for (const cln of miningClinicsConfig) {
    const provId = provinceMap.get(cln.provinceName) || (await prisma.masterProvince.findFirst())!.id;
    let existingClinic = await prisma.masterClinic.findFirst({
      where: { OR: [{ code: cln.code }, { name: cln.name }] }
    });

    if (existingClinic) {
      await prisma.masterClinic.update({
        where: { id: existingClinic.id },
        data: {
          code: cln.code,
          name: cln.name,
          provinceId: provId,
          address: cln.address
        }
      });
    } else {
      await prisma.masterClinic.create({
        data: {
          code: cln.code,
          name: cln.name,
          provinceId: provId,
          address: cln.address
        }
      });
    }
  }

  // =========================================================================
  // 3. MASTER DEPARTMENTS & POSITIONS PERTAMBANGAN
  // =========================================================================
  console.log('⛏️ Menyiapkan Departemen & Posisi Kerja Sektor Tambang...');

  const miningDepartments = [
    { code: 'DEPT-MINE-OPS', name: 'Mining Operations & Production' },
    { code: 'DEPT-MINE-ENG', name: 'Mine Engineering & Planning' },
    { code: 'DEPT-PLANT-HE', name: 'Plant & Heavy Equipment Maintenance' },
    { code: 'DEPT-MINE-HSE', name: 'Health, Safety & Environment (HSE)' },
    { code: 'DEPT-GEOLOGY', name: 'Geology & Exploration' },
    { code: 'DEPT-LOG-SCM', name: 'Mining Supply Chain & Fuel Logistics' },
    { code: 'DEPT-MINE-HR', name: 'Human Resources & Industrial Relations' }
  ];

  const deptMap = new Map<string, string>();
  for (const d of miningDepartments) {
    let dept = await prisma.masterDepartment.findFirst({
      where: { OR: [{ name: d.name }, { code: d.code }] }
    });
    if (!dept) {
      dept = await prisma.masterDepartment.create({ data: d });
    }
    deptMap.set(d.name, dept.id);
  }

  const miningPositions = [
    { code: 'POS-EXC-2000', name: 'Operator Excavator PC2000 / PC1250' },
    { code: 'POS-DT-HD785', name: 'Operator Dump Truck Heavy Duty HD785' },
    { code: 'POS-SURVEYOR', name: 'Mine Surveyor & Geodetic Specialist' },
    { code: 'POS-HSE-OFFICER', name: 'HSE Mining Inspector (Pengawas K3 Tambang)' },
    { code: 'POS-MECH-HEAVY', name: 'Heavy Equipment Mechanic & Fitter' },
    { code: 'POS-SUPV-POP', name: 'Mining Production Supervisor (POP Certified)' },
    { code: 'POS-GEOLOGIST', name: 'Mine Geologist & Exploration Modeler' },
    { code: 'POS-AUTO-ELEC', name: 'Auto Electrician Heavy Duty Fleet' },
    { code: 'POS-DRILL-BLAST', name: 'Drill & Blast Specialist Engineer' },
    { code: 'POS-DISPATCH', name: 'Mine Fleet Dispatcher & Controller' }
  ];

  const posMap = new Map<string, string>();
  for (const p of miningPositions) {
    let pos = await prisma.masterPosition.findFirst({
      where: { OR: [{ name: p.name }, { code: p.code }] }
    });
    if (!pos) {
      pos = await prisma.masterPosition.create({ data: p });
    }
    posMap.set(p.name, pos.id);
  }

  // =========================================================================
  // 4. MASTER INSTITUSI (BLK / LPK / KAMPUS TAMBANG)
  // =========================================================================
  const additionalMiningInstitutes = [
    {
      code: 'INS-MINE-01',
      name: 'Politeknik Negeri Balikpapan (Poltekba)',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Balikpapan',
      address: 'Jl. Soekarno Hatta KM.8, Balikpapan'
    },
    {
      code: 'INS-MINE-02',
      name: 'Politeknik Negeri Samarinda (Polnes)',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Samarinda',
      address: 'Jl. Samratulangi, Samarinda'
    },
    {
      code: 'INS-MINE-03',
      name: 'BLK Samarinda',
      type: 'BLK',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Samarinda',
      address: 'Jl. Harmonika No.1, Sidomulyo, Samarinda'
    },
    {
      code: 'INS-MINE-04',
      name: 'BLK Balikpapan',
      type: 'BLK',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Balikpapan',
      address: 'Jl. Syarifuddin Yoes, Balikpapan'
    },
    {
      code: 'INS-MINE-05',
      name: 'UPN Veteran Yogyakarta (Teknik Pertambangan)',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'DI Yogyakarta',
      city: 'Sleman',
      address: 'Jl. SWK 104 Condongcatur, Sleman'
    },
    {
      code: 'INS-MINE-06',
      name: 'LPK Alat Berat Borneo Mandiri',
      type: 'LPK',
      status: 'Swasta',
      province: 'Kalimantan Timur',
      city: 'Kutai Timur',
      address: 'Jl. Poros Sangatta - Bontang KM.3'
    },
    {
      code: 'INS-MINE-07',
      name: 'SMKN 1 Sangatta Utara (Geologi Pertambangan)',
      type: 'SLTA',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Kutai Timur',
      address: 'Jl. Pendidikan, Sangatta Utara'
    }
  ];

  for (const ins of additionalMiningInstitutes) {
    let existingIns = await prisma.masterInstitute.findFirst({
      where: { OR: [{ code: ins.code }, { name: ins.name }] }
    });
    if (!existingIns) {
      await prisma.masterInstitute.create({ data: ins });
    }
  }

  // =========================================================================
  // 5. STAGES & SITE SLA CONFIGURATION
  // =========================================================================
  const stages = await prisma.masterPipelineStage.findMany({
    orderBy: { orderIndex: 'asc' }
  });

  // Pastikan SiteSla terhubung untuk setiap site
  for (const site of Array.from(siteMap.values())) {
    for (const stage of stages) {
      await prisma.siteSla.upsert({
        where: {
          siteId_stageId: {
            siteId: site.id,
            stageId: stage.id
          }
        },
        update: {
          slaDays: stage.slaDays,
          reminderDays: stage.reminderDays
        },
        create: {
          siteId: site.id,
          stageId: stage.id,
          slaDays: stage.slaDays,
          reminderDays: stage.reminderDays
        }
      });
    }
  }

  // =========================================================================
  // 6. LOWONGAN PEKERJAAN TAMBANG (Job Openings)
  // =========================================================================
  console.log('📋 Membuat Lowongan Pekerjaan Sektor Pertambangan...');

  const today = new Date();
  const subDays = (d: Date, days: number) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

  const jobDefs: any[] = [
    {
      noRegistrasi: 'REQ/MINE-OPS/KPC/2026/001',
      posName: 'Operator Excavator PC2000 / PC1250',
      deptName: 'Mining Operations & Production',
      siteName: 'KPC Sangatta Coal Mine',
      custName: 'PT Kaltim Prima Coal',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      status: JobStatus.ACTIVE,
      isPriority: true,
      requiresBnsp: true,
      requiresSkillTest: true,
      jumlahPermintaan: 8,
      statusPermintaan: 'Baru',
      tanggalMasuk: subDays(today, 25),
      publishedDate: subDays(today, 20),
      kualifikasi: 'Pria/Wanita min. 21 tahun, memiliki SIO Kemnaker aktif Kelas 1 (Excavator kapasitas > 100 ton), pengalaman min. 3 tahun di open pit coal mining, tidak buta warna, siap sistem roster 8:2.',
      benefit: 'Gaji Pokok Kompetitif, Tunjangan Site Remote Pit, Mess AC & Catering, Transport Roster Tiket Pesawat PP, BPJS Kesehatan & Ketenagakerjaan, Asuransi Rawat Inap Mandiri Inhealth.'
    },
    {
      noRegistrasi: 'REQ/MINE-ENG/BRC/2026/002',
      posName: 'Mine Surveyor & Geodetic Specialist',
      deptName: 'Mine Engineering & Planning',
      siteName: 'Berau Coal Mine Area',
      custName: 'PT Berau Coal',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      status: JobStatus.ACTIVE,
      isPriority: true,
      requiresBnsp: true,
      requiresSkillTest: false,
      jumlahPermintaan: 3,
      statusPermintaan: 'Baru',
      tanggalMasuk: subDays(today, 18),
      publishedDate: subDays(today, 15),
      kualifikasi: 'D3/S1 Teknik Geodesi/Geomatika/Pertambangan. Menguasai Total Station Leica, GPS Geodetik RTK, Drone LiDar UAV, software Surpac/Minescape, sertifikasi Juru Ukur Tambang (BNSP).',
      benefit: 'Gaji Pokok, Tunjangan Keahlian Sertifikasi, Roster 6:2, Mess Fasilitas Lengkap, Tunjangan Insentif Kinerja Produksi.'
    },
    {
      noRegistrasi: 'REQ/MINE-HSE/IMIP/2026/003',
      posName: 'HSE Mining Inspector (Pengawas K3 Tambang)',
      deptName: 'Health, Safety & Environment (HSE)',
      siteName: 'Morowali Nickel Mining Area',
      custName: 'PT Indonesia Morowali Industrial Park',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      status: JobStatus.ACTIVE,
      isPriority: false,
      requiresBnsp: true,
      requiresSkillTest: false,
      jumlahPermintaan: 4,
      statusPermintaan: 'Replacement',
      tanggalMasuk: subDays(today, 14),
      publishedDate: subDays(today, 12),
      kualifikasi: 'Pendidikan min. D3/S1 K3/Teknik. Memiliki sertifikat Ahli K3 Umum Kemenaker & Pengawas Operasional Pertama (POP) ESDM, memahami SMK3 PP 50/2012 dan Kepmen ESDM 1827 K/30/MEM/2018.',
      benefit: 'Paket Kompensasi Menarik, Fasilitas Mess VIP, Tiket Pesawat Roster PP, Insentif Zero Accident.'
    },
    {
      noRegistrasi: 'REQ/PLANT-HE/PTBA/2026/004',
      posName: 'Heavy Equipment Mechanic & Fitter',
      deptName: 'Plant & Heavy Equipment Maintenance',
      siteName: 'Tanjung Enim Coal Mine',
      custName: 'PT Bukit Asam Tbk',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      status: JobStatus.ACTIVE,
      isPriority: false,
      requiresBnsp: false,
      requiresSkillTest: true,
      jumlahPermintaan: 6,
      statusPermintaan: 'Baru',
      tanggalMasuk: subDays(today, 12),
      publishedDate: subDays(today, 10),
      kualifikasi: 'SMK Otomotif/Alat Berat / D3 Teknik Mesin. Pengalaman troubleshooting engine Komatsu, Caterpillar, Hitachi > 3 tahun, mampu membaca Shop Manual & Hydraulic Schematic.',
      benefit: 'Gaji Pokok, Overtime Terstruktur, Tunjangan Tool Allowance, Asuransi Kesehatan Keluarga.'
    },
    {
      noRegistrasi: 'REQ/MINE-OPS/IWIP/2026/005',
      posName: 'Mining Production Supervisor (POP Certified)',
      deptName: 'Mining Operations & Production',
      siteName: 'Weda Bay Nickel Mining Area',
      custName: 'PT Indonesia Weda Bay Industrial Park',
      provName: 'Maluku Utara',
      cityName: 'Halmahera Tengah',
      status: JobStatus.ACTIVE,
      isPriority: true,
      requiresBnsp: true,
      requiresSkillTest: false,
      jumlahPermintaan: 2,
      statusPermintaan: 'Baru',
      tanggalMasuk: subDays(today, 10),
      publishedDate: subDays(today, 8),
      kualifikasi: 'S1 Teknik Pertambangan / Geologi. Wajib memiliki sertifikat Pengawas Operasional Pertama (POP) resmi dari Dirjen Minerba ESDM, pengalaman min. 4 tahun sebagai Foreman/Supervisor pit.',
      benefit: 'Gaji Spesialis, Tunjangan Jabatan & Roster 10:2, Tiket Penerbangan Domestik PP, Fasilitas Mess Single.'
    },
    {
      noRegistrasi: 'REQ/GEOLOGY/MTB/2026/006',
      posName: 'Mine Geologist & Exploration Modeler',
      deptName: 'Geology & Exploration',
      siteName: 'Martabe Gold Mine',
      custName: 'PT United Tractors Tbk',
      provName: 'Sumatera Utara',
      cityName: 'Tapanuli Selatan',
      status: JobStatus.CLOSED,
      isPriority: false,
      requiresBnsp: false,
      requiresSkillTest: false,
      jumlahPermintaan: 2,
      statusPermintaan: 'Replacement',
      tanggalMasuk: subDays(today, 60),
      publishedDate: subDays(today, 55),
      kualifikasi: 'S1 Teknik Geologi, mahir Leapfrog Geo, Datamine, QAQC grade control bijih emas epithermal.',
      benefit: 'Paket Kompensasi Standar Perusahaan Multinasional.'
    },
    {
      noRegistrasi: 'REQ/PLANT-EL/AMNT/2026/007',
      posName: 'Auto Electrician Heavy Duty Fleet',
      deptName: 'Plant & Heavy Equipment Maintenance',
      siteName: 'Batu Hijau Copper & Gold Mine',
      custName: 'PT Amman Mineral Nusa Tenggara',
      provName: 'Nusa Tenggara Barat',
      cityName: 'Sumbawa Barat',
      status: JobStatus.OVERDUE,
      isPriority: true,
      requiresBnsp: true,
      requiresSkillTest: true,
      jumlahPermintaan: 3,
      statusPermintaan: 'Baru',
      tanggalMasuk: subDays(today, 35),
      publishedDate: subDays(today, 30),
      kualifikasi: 'Spesialis elektrikal alat berat Caterpillar 793 / Komatsu 930E, memahami can-bus, AC system, wiring harness.',
      benefit: 'Gaji Pokok Tinggi, Fasilitas Camp Lengkap (Gym, Bioskop, Sport Hall), Roster 6:2.'
    },
    {
      noRegistrasi: 'REQ/MINE-OPS/FMI/2026/008',
      posName: 'Drill & Blast Specialist Engineer',
      deptName: 'Mining Operations & Production',
      siteName: 'Grasberg Mine Timika',
      custName: 'PT Freeport Indonesia',
      provName: 'Papua Tengah',
      cityName: 'Mimika',
      status: JobStatus.DRAFT,
      isPriority: false,
      requiresBnsp: true,
      requiresSkillTest: false,
      jumlahPermintaan: 2,
      statusPermintaan: 'Baru',
      tanggalMasuk: subDays(today, 5),
      publishedDate: null,
      kualifikasi: 'S1 Teknik Pertambangan, sertifikat Kartu Izin Meledakkan (KIM) Madya/Utama, spesialis pit wall control blasting.',
      benefit: 'Paket High Altitude Grasberg Allowance, Roster 5:2.'
    }
  ];

  const createdJobs: any[] = [];

  for (const j of jobDefs) {
    const posId = posMap.get(j.posName) || null;
    const deptId = deptMap.get(j.deptName) || null;
    const site = siteMap.get(j.siteName)!;
    const custId = (customerMap.get(j.custName) || (await prisma.masterCustomer.findFirst())?.id) as string;
    const provId = (provinceMap.get(j.provName) || (await prisma.masterProvince.findFirst())?.id) as string;
    const cityId = (cityMap.get(j.cityName) || (await prisma.masterCity.findFirst({ where: { provinceId: provId } }))?.id) as string;

    let job: any = await prisma.jobOpening.findUnique({
      where: { noRegistrasi: j.noRegistrasi }
    });

    const jobDataPayload: any = {
      noRegistrasi: j.noRegistrasi,
      positionId: posId,
      positionName: j.posName,
      departmentId: deptId,
      departmentName: j.deptName,
      siteId: site.id,
      customerId: custId,
      provinceId: provId,
      cityId: cityId,
      status: j.status,
      isPriority: j.isPriority,
      requiresBnsp: j.requiresBnsp,
      requiresSkillTest: j.requiresSkillTest,
      jumlahPermintaan: j.jumlahPermintaan,
      statusPermintaan: j.statusPermintaan,
      tanggalMasuk: j.tanggalMasuk,
      publishedDate: j.publishedDate,
      kualifikasi: j.kualifikasi,
      benefit: j.benefit,
      noFormB1: `F-B1-${j.noRegistrasi.replace(/\//g, '-')}`
    };

    if (job) {
      job = await prisma.jobOpening.update({
        where: { id: job.id },
        data: jobDataPayload
      });
    } else {
      job = await prisma.jobOpening.create({
        data: jobDataPayload
      });
    }

    // Buat timeline untuk job yang bukan DRAFT
    if (j.status !== JobStatus.DRAFT) {
      await prisma.jobTimeline.deleteMany({ where: { jobId: job.id } });

      let currentStart = new Date(j.publishedDate || j.tanggalMasuk);
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const deadline = addDays(currentStart, stage.slaDays);

        let timelineStatus = 'Pending';
        if (j.status === JobStatus.CLOSED) {
          timelineStatus = 'Completed';
        } else if (j.status === JobStatus.OVERDUE && i < 3) {
          timelineStatus = 'Overdue';
        } else if (i === 0) {
          timelineStatus = 'In Progress';
        }

        await prisma.jobTimeline.create({
          data: {
            jobId: job.id,
            stageId: stage.id,
            status: timelineStatus,
            startDate: currentStart,
            deadlineDate: deadline
          }
        });

        currentStart = addDays(deadline, 1);
      }
    }

    createdJobs.push(job);
  }

  // =========================================================================
  // 7. SEED AKUN REKRUTER & SUPERVISOR
  // =========================================================================
  await prisma.user.upsert({
    where: { email: 'recruiter.mining@example.com' },
    update: {},
    create: {
      email: 'recruiter.mining@example.com',
      name: 'Rian Pratama, S.Psi (Lead Mining Recruiter)',
      password: hashedPassword,
      role: UserRole.RECRUITER,
      department: 'Mining Operations & HR'
    }
  });

  await prisma.user.upsert({
    where: { email: 'superintendent.mining@example.com' },
    update: {},
    create: {
      email: 'superintendent.mining@example.com',
      name: 'Ir. Budi Santoso, ST., IPM (Mining Superintendent)',
      password: hashedPassword,
      role: UserRole.ADMIN,
      department: 'Mining Operations & Production'
    }
  });

  // =========================================================================
  // 8. SEED DATA DUMMY KANDIDAT & LAMARAN (Total 28 Kandidat)
  // =========================================================================
  console.log('👷 Menyiapkan 28 Data Profil Kandidat & Lamaran Lengkap...');

  // Helper template dokumen
  const makeDocs = (profileId: string, candCode: string, certName: string) => [
    {
      candidateProfileId: profileId,
      documentType: 'ktp',
      fileUrl: `https://dummy-bucket.s3.ap-southeast-1.amazonaws.com/documents/${candCode}/ktp.pdf`,
      objectKey: `documents/${candCode}/ktp.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 420000
    },
    {
      candidateProfileId: profileId,
      documentType: 'kk',
      fileUrl: `https://dummy-bucket.s3.ap-southeast-1.amazonaws.com/documents/${candCode}/kartu-keluarga.pdf`,
      objectKey: `documents/${candCode}/kartu-keluarga.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 512000
    },
    {
      candidateProfileId: profileId,
      documentType: 'cv',
      fileUrl: `https://dummy-bucket.s3.ap-southeast-1.amazonaws.com/documents/${candCode}/curriculum-vitae.pdf`,
      objectKey: `documents/${candCode}/curriculum-vitae.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 850000
    },
    {
      candidateProfileId: profileId,
      documentType: 'ijazah',
      fileUrl: `https://dummy-bucket.s3.ap-southeast-1.amazonaws.com/documents/${candCode}/ijazah-transkrip.pdf`,
      objectKey: `documents/${candCode}/ijazah-transkrip.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 980000
    },
    {
      candidateProfileId: profileId,
      documentType: 'pas foto',
      fileUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(candCode)}&background=0284c7&color=fff&size=256`,
      objectKey: `documents/${candCode}/pas-foto.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 150000
    },
    {
      candidateProfileId: profileId,
      documentType: 'sertifikat bnsp',
      fileUrl: `https://dummy-bucket.s3.ap-southeast-1.amazonaws.com/documents/${candCode}/sertifikat-bnsp.pdf`,
      objectKey: `documents/${candCode}/sertifikat-bnsp.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 730000
    }
  ];

  // Definisi Kandidat Lengkap dengan Segala Kategori:
  // - 4 HIRED (Lulus seluruh 7 stage hingga MCU)
  // - 3 BLACKLISTED (Pelanggaran berat SIO, indisipliner, narkotika)
  // - 6 REJECTED / ARCHIVED (Ditolak di berbagai stage: 1, 2, 3, 4, 5, 7)
  // - 11 ON PROCESS (Aktif tersebar di stage 1, 2, 3, 4, 5, 6, 7)
  // - 4 TALENT POOL (High potential profiles siap di-hire)
  const candidateSeeds: any[] = [
    // -----------------------------------------------------------------------
    // KATEGORI 1: KANDIDAT HIRED (4 Orang - Lulus Seluruh Stage & MCU)
    // -----------------------------------------------------------------------
    {
      name: 'Ahmad Fauzi Nurcahyo',
      email: 'ahmad.fauzi.mining@example.com',
      nik: '6401041508920003',
      kk: '6401042001150001',
      birthPlace: 'Samarinda',
      birthDate: new Date('1992-08-15'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081254321098',
      emergencyContact: '081347890123 (Siti Aminah - Istri)',
      domicileAddress: 'Jl. Pemuda No. 45 RT 12, Kel. Temindung Permai',
      currentAddress: 'Jl. Pemuda No. 45 RT 12, Kel. Temindung Permai, Samarinda',
      provName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3 Teknik Mesin',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'SIO Operator Excavator Kelas 1 & BNSP Alat Berat',
      jobIndex: 0, // Operator Excavator
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: true,
          skema: 'Operator Alat Berat (Excavator PC2000)',
          certNumber: 'BNSP-OPR-2024-8849201',
          issueDate: '2024-02-10',
          expiryDate: '2027-02-10'
        },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 16).toISOString().split('T')[0],
          feedback: 'Kandidat memiliki kematangan emosi yang sangat baik, berpengalaman 5 tahun di pit KPC, rekam jejak safety nihil insiden.',
          file: 'resume_hr_fauzi.pdf',
          resultFile: 'hr_assessment_fauzi.pdf'
        },
        psikotes: {
          result: 'Sangat Disarankan',
          date: subDays(today, 13).toISOString().split('T')[0],
          file: 'psikotes_report_fauzi.pdf'
        },
        testSkill: {
          date: subDays(today, 10).toISOString().split('T')[0],
          videoLink: 'https://youtube.com/watch?v=pit_maneuver_pc2000_fauzi',
          proofs: [
            { title: 'Manuver Bench & Double Side Loading PC2000', file: 'skill_test_fauzi_1.mp4' },
            { title: 'Pre-Start Daily Inspection Check', file: 'p2h_checklist_fauzi.pdf' }
          ],
          resultFile: 'skill_evaluation_grade_a.pdf'
        },
        userInterview: {
          result: 'Lulus',
          date: subDays(today, 7).toISOString().split('T')[0],
          feedback: 'User Superintendent sangat puas dengan skill handling material overburden & kesadaran safety pit tinggi.',
          file: 'user_interview_score_fauzi.pdf'
        },
        offeringLetter: {
          date: subDays(today, 4).toISOString().split('T')[0],
          file: 'offering_letter_signed_fauzi.pdf'
        },
        mcu: {
          date: subDays(today, 2).toISOString().split('T')[0],
          pengantarFile: 'sp_mcu_lab_fauzi.pdf',
          hasilFile: 'mcu_fit_for_mining_fauzi.pdf',
          resultStatus: 'FIT TO WORK (Category A)'
        },
        bast: {
          status: 'LOKAL',
          nrp: 'KPC-26-8801',
          start: subDays(today, 1).toISOString().split('T')[0],
          end: addDays(today, 365).toISOString().split('T')[0],
          validasi: 'Valid',
          link: 'https://imms.mining.id/bast/KPC-26-8801'
        }
      }
    },
    {
      name: 'Bambang Tri Hermawan',
      email: 'bambang.tri.hermawan@example.com',
      nik: '6403061205900004',
      kk: '6403062002120002',
      birthPlace: 'Tanjung Redeb',
      birthDate: new Date('1990-05-12'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '082156789012',
      emergencyContact: '082156789013 (Endang - Istri)',
      domicileAddress: 'Jl. Bujangga No. 88, Tanjung Redeb',
      currentAddress: 'Jl. Bujangga No. 88, Tanjung Redeb, Berau',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Geodesi',
      educationInstitution: 'Institut Teknologi Bandung',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Bandung',
      certName: 'Juru Ukur Tambang (BNSP) & Pilot Drone UAV Tambang',
      jobIndex: 1, // Mine Surveyor
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: true,
          skema: 'Juru Ukur Tambang (Mine Surveyor)',
          certNumber: 'BNSP-SRV-2023-772910',
          issueDate: '2023-05-15',
          expiryDate: '2026-05-15'
        },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 12).toISOString().split('T')[0],
          feedback: 'Kandidat berpengalaman 6 tahun mengolah data ortofoto & volumetri cut and fill tambang batubara.',
          file: 'resume_bambang.pdf',
          resultFile: 'hr_score_bambang.pdf'
        },
        psikotes: {
          result: 'Disarankan',
          date: subDays(today, 10).toISOString().split('T')[0],
          file: 'psikotes_bambang.pdf'
        },
        testSkill: {
          date: subDays(today, 7).toISOString().split('T')[0],
          videoLink: 'https://youtube.com/watch?v=rtk_survey_bambang',
          proofs: [{ title: 'Pemetaan Highwall & Disposal Menggunakan RTK', file: 'surpac_model_bambang.pdf' }],
          resultFile: 'survey_grade_a.pdf'
        },
        userInterview: {
          result: 'Lulus',
          date: subDays(today, 5).toISOString().split('T')[0],
          feedback: 'Chief Surveyor merekomendasikan langsung untuk penempatan pit Binungan.',
          file: 'user_approval_bambang.pdf'
        },
        offeringLetter: {
          date: subDays(today, 3).toISOString().split('T')[0],
          file: 'offering_signed_bambang.pdf'
        },
        mcu: {
          date: subDays(today, 1).toISOString().split('T')[0],
          pengantarFile: 'sp_mcu_bambang.pdf',
          hasilFile: 'mcu_fit_bambang.pdf',
          resultStatus: 'FIT TO WORK (Category A)'
        },
        bast: {
          status: 'LOKAL',
          nrp: 'BRC-26-4402',
          start: today.toISOString().split('T')[0],
          end: addDays(today, 730).toISOString().split('T')[0],
          validasi: 'Valid',
          link: 'https://imms.mining.id/bast/BRC-26-4402'
        }
      }
    },
    {
      name: 'Dedi Kurniawan',
      email: 'dedi.kurniawan.safety@example.com',
      nik: '7203051403880002',
      kk: '7203052003100003',
      birthPlace: 'Morowali',
      birthDate: new Date('1988-03-14'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '085244556677',
      emergencyContact: '085244556678 (Nurhaliza - Istri)',
      domicileAddress: 'Desa Fatufia, Kec. Bahodopi',
      currentAddress: 'Desa Fatufia, Kec. Bahodopi, Morowali',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Kesehatan Masyarakat (K3)',
      educationInstitution: 'Politeknik Negeri Balikpapan (Poltekba)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Ahli K3 Umum Kemenaker & Pengawas K3 Tambang ESDM',
      jobIndex: 2, // HSE Officer
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: true,
          skema: 'Ahli K3 Umum & Pengawas K3 Tambang',
          certNumber: 'BNSP-K3-2024-110293',
          issueDate: '2024-01-20',
          expiryDate: '2027-01-20'
        },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 10).toISOString().split('T')[0],
          feedback: 'Sangat memahami investigasi insiden metode SCAT & audit SMK3 PP 50/2012.',
          file: 'resume_dedi.pdf',
          resultFile: 'hr_eval_dedi.pdf'
        },
        psikotes: {
          result: 'Sangat Disarankan',
          date: subDays(today, 8).toISOString().split('T')[0],
          file: 'psikotes_dedi.pdf'
        },
        testSkill: {
          date: subDays(today, 6).toISOString().split('T')[0],
          videoLink: 'https://youtube.com/watch?v=hse_induction_dedi',
          proofs: [{ title: 'Pembuatan JSEA & HIRADC Pit Nikel', file: 'hiradc_morowali_dedi.xlsx' }],
          resultFile: 'hse_technical_score_95.pdf'
        },
        userInterview: {
          result: 'Lulus',
          date: subDays(today, 4).toISOString().split('T')[0],
          feedback: 'Direkomendasikan oleh HSE Manager IMIP.',
          file: 'user_sheet_dedi.pdf'
        },
        offeringLetter: {
          date: subDays(today, 2).toISOString().split('T')[0],
          file: 'offering_dedi.pdf'
        },
        mcu: {
          date: subDays(today, 1).toISOString().split('T')[0],
          pengantarFile: 'sp_mcu_dedi.pdf',
          hasilFile: 'mcu_fit_dedi.pdf',
          resultStatus: 'FIT TO WORK (Category A)'
        },
        bast: {
          status: 'LOKAL',
          nrp: 'IMIP-26-9011',
          start: today.toISOString().split('T')[0],
          end: addDays(today, 365).toISOString().split('T')[0],
          validasi: 'Valid',
          link: 'https://imms.mining.id/bast/IMIP-26-9011'
        }
      }
    },
    {
      name: 'Hendra Saputra Siregar',
      email: 'hendra.siregar.mechanic@example.com',
      nik: '1603021907930005',
      kk: '1603022004140004',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1993-07-19'),
      gender: 'Laki-laki',
      religion: 'Kristen',
      maritalStatus: 'Menikah',
      whatsapp: '081373445566',
      emergencyContact: '081373445567 (Maria - Istri)',
      domicileAddress: 'Jl. Lintas Prabumulih No. 12',
      currentAddress: 'Jl. Lintas Prabumulih No. 12, Tanjung Enim',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'SLTA',
      latestEducation: 'SMK Otomotif Alat Berat',
      educationInstitution: 'SMKN 1 Bandung',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BPVP Bandung',
      certName: 'Senior Heavy Equipment Mechanic (Level 3 BNSP)',
      jobIndex: 3, // Heavy Equipment Mechanic
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: true,
          skema: 'Mekanik Alat Berat Tingkat Lanjut',
          certNumber: 'BNSP-MECH-2023-458921',
          issueDate: '2023-08-10',
          expiryDate: '2026-08-10'
        },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 9).toISOString().split('T')[0],
          feedback: 'Loyalitas tinggi, pengalaman 7 tahun di bengkel workshop pit tambang batubara PTBA.',
          file: 'resume_hendra.pdf',
          resultFile: 'hr_hendra.pdf'
        },
        psikotes: {
          result: 'Disarankan',
          date: subDays(today, 7).toISOString().split('T')[0],
          file: 'psikotes_hendra.pdf'
        },
        testSkill: {
          date: subDays(today, 5).toISOString().split('T')[0],
          videoLink: 'https://youtube.com/watch?v=engine_overhaul_hendra',
          proofs: [{ title: 'Overhaul Engine Komatsu SAA6D170E', file: 'overhaul_report_hendra.pdf' }],
          resultFile: 'mechanic_practical_92.pdf'
        },
        userInterview: {
          result: 'Lulus',
          date: subDays(today, 3).toISOString().split('T')[0],
          feedback: 'User Plant Superintendent setuju dengan penawaran level Fitter 1.',
          file: 'user_eval_hendra.pdf'
        },
        offeringLetter: {
          date: subDays(today, 2).toISOString().split('T')[0],
          file: 'offering_hendra.pdf'
        },
        mcu: {
          date: subDays(today, 1).toISOString().split('T')[0],
          pengantarFile: 'sp_mcu_hendra.pdf',
          hasilFile: 'mcu_fit_hendra.pdf',
          resultStatus: 'FIT TO WORK (Category A)'
        },
        bast: {
          status: 'LOKAL',
          nrp: 'PTBA-26-3044',
          start: today.toISOString().split('T')[0],
          end: addDays(today, 365).toISOString().split('T')[0],
          validasi: 'Valid',
          link: 'https://imms.mining.id/bast/PTBA-26-3044'
        }
      }
    },

    // -----------------------------------------------------------------------
    // KATEGORI 2: KANDIDAT BLACKLIST (3 Orang - Pelanggaran Berat)
    // -----------------------------------------------------------------------
    {
      name: 'Rudi Hartono Sitorus',
      email: 'rudi.sitorus.blacklist@example.com',
      nik: '6401082210890001',
      kk: '6401082005110005',
      birthPlace: 'Sangatta',
      birthDate: new Date('1989-10-22'),
      gender: 'Laki-laki',
      religion: 'Kristen',
      maritalStatus: 'Lajang',
      whatsapp: '081234998877',
      emergencyContact: '081234998878 (Keluarga)',
      domicileAddress: 'Jl. APT Pranoto No. 10',
      currentAddress: 'Jl. APT Pranoto No. 10, Sangatta Utara',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      educationType: 'SLTA',
      latestEducation: 'SMK Mesin',
      educationInstitution: 'SMKN 1 Sangatta Utara (Geologi Pertambangan)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'SIO Operator Dump Truck (Dibatalkan)',
      jobIndex: 0, // Operator
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_1',
      isTalentPool: false,
      isBlacklisted: true,
      blacklistReason: 'Pemalsuan dokumen resmi: Terbukti merekayasa masa berlaku SIO Dump Truck Kemnaker dan sertifikat BNSP saat verifikasi fisik ke database Kemnaker.',
      blacklistedAt: subDays(today, 15),
      stageData: {
        bnspValidation: {
          isApproved: false,
          rejectionReason: 'Fake Documents Detected (R-002)'
        }
      }
    },
    {
      name: 'Yudi Prasetyo',
      email: 'yudi.prasetyo.bl@example.com',
      nik: '6403011502910002',
      kk: '6403012003120006',
      birthPlace: 'Berau',
      birthDate: new Date('1991-02-15'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '082233445566',
      emergencyContact: '082233445567 (Istri)',
      domicileAddress: 'Jl. Gunung Tabur No. 23',
      currentAddress: 'Jl. Gunung Tabur No. 23, Berau',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3 Pertambangan',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Balikpapan',
      certName: 'Sertifikat Juru Ukur (Ditarik)',
      jobIndex: 1, // Mine Surveyor
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_2',
      isTalentPool: false,
      isBlacklisted: true,
      blacklistReason: 'Pelanggaran indisipliner berat: Terlibat perkelahian fisik dan perusakan fasilitas di mess akomodasi karyawan site Berau saat proses seleksi berlangsung.',
      blacklistedAt: subDays(today, 10),
      stageData: {
        hrInterview: {
          result: 'Blacklist',
          feedback: 'Kandidat menunjukkan perilaku kekerasan fisik dan mengancam sesama peserta interview di mess site.'
        }
      }
    },
    {
      name: 'Faisal Akbar Sanjaya',
      email: 'faisal.akbar.mcu.bl@example.com',
      nik: '7203021909940003',
      kk: '7203022004150007',
      birthPlace: 'Palu',
      birthDate: new Date('1994-09-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '085399887766',
      emergencyContact: '085399887767 (Orang Tua)',
      domicileAddress: 'Jl. Basuki Rahmat No. 7',
      currentAddress: 'Jl. Basuki Rahmat No. 7, Palu',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Elektro',
      educationInstitution: 'Politeknik Negeri Balikpapan (Poltekba)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Sertifikat Teknisi Listrik',
      jobIndex: 6, // Auto Electrician
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: true,
      blacklistReason: 'Uji Laboratorium MCU Tambang terindikasi positif Methamphetamine & Benzodiazepine tanpa anjuran resep medis. Dilarang mendaftar kembali di seluruh site operasional.',
      blacklistedAt: subDays(today, 5),
      stageData: {
        mcu: {
          resultStatus: 'UNFIT - DRUG ABUSE POSITIVE'
        }
      }
    },

    // -----------------------------------------------------------------------
    // KATEGORI 3: KANDIDAT REJECTED / ARCHIVED (6 Orang - Ditolak di Berbagai Stage)
    // -----------------------------------------------------------------------
    {
      name: 'Wahyu Hidayat',
      email: 'wahyu.hidayat.screen@example.com',
      nik: '6401031101950008',
      kk: '6401032005160008',
      birthPlace: 'Balikpapan',
      birthDate: new Date('1995-01-11'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '081155667788',
      emergencyContact: '081155667789 (Ayah)',
      domicileAddress: 'Jl. Ruhui Rahayu No. 19',
      currentAddress: 'Jl. Ruhui Rahayu No. 19, Balikpapan',
      provName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      educationType: 'SLTA',
      latestEducation: 'SMK Otomotif',
      educationInstitution: 'SMKN 1 Bandung',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Balikpapan',
      certName: 'SIM B2 Umum (Belum ada SIO)',
      jobIndex: 0, // Operator Excavator
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_1',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: false,
          rejectionReason: 'Does Not Meet Requirements (R-003): Jam terbang alat berat < 1000 jam dan belum memiliki SIO Kemnaker Kelas 1.'
        }
      }
    },
    {
      name: 'Doni Pratama',
      email: 'doni.pratama.hr@example.com',
      nik: '6403041804930009',
      kk: '6403042006170009',
      birthPlace: 'Berau',
      birthDate: new Date('1993-04-18'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081266778899',
      emergencyContact: '081266778800 (Istri)',
      domicileAddress: 'Jl. Teuku Umar No. 5, Berau',
      currentAddress: 'Jl. Teuku Umar No. 5, Berau',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3 Geodesi',
      educationInstitution: 'Politeknik Negeri Banjarmasin',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Juru Ukur Tambang Junior',
      jobIndex: 1, // Mine Surveyor
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_2',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        hrInterview: {
          result: 'Tidak Lulus',
          feedback: 'Poor Communication Skills (R-004) & Attitude Mismatch (R-005): Tidak bersedia mengikuti aturan rotasi shift malam pit tambang.'
        }
      }
    },
    {
      name: 'Irfan Maulana',
      email: 'irfan.maulana.psi@example.com',
      nik: '7203082506920010',
      kk: '7203082007180010',
      birthPlace: 'Morowali',
      birthDate: new Date('1992-06-25'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '085277889900',
      emergencyContact: '085277889901 (Ibu)',
      domicileAddress: 'Jl. Trans Sulawesi Bahodopi',
      currentAddress: 'Jl. Trans Sulawesi Bahodopi, Morowali',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Kesehatan Masyarakat',
      educationInstitution: 'Universitas Indonesia',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Ahli K3 Umum',
      jobIndex: 2, // HSE Officer
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_3',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        psikotes: {
          result: 'Tidak Disarankan',
          feedback: 'Did Not Pass Psychological Standards (R-006): Daya tahan stres di bawah standar untuk area pit pertambangan risiko tinggi.'
        }
      }
    },
    {
      name: 'Gunawan Prasetyo',
      email: 'gunawan.test.skill@example.com',
      nik: '1603051412910011',
      kk: '1603052008190011',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1991-12-14'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081388990011',
      emergencyContact: '081388990012 (Istri)',
      domicileAddress: 'Jl. Sudirman No. 80, Muara Enim',
      currentAddress: 'Jl. Sudirman No. 80, Muara Enim',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'SLTA',
      latestEducation: 'SMK Otomotif',
      educationInstitution: 'SMKN 1 Bandung',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Bandung',
      certName: 'Mekanik Engine Alat Berat',
      jobIndex: 3, // Mechanic
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_4',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        testSkill: {
          result: 'Tidak Lulus',
          feedback: 'Failed Technical Test (R-007): Gagal dalam tes troubleshooting hidrolik excavator Komatsu PC1250, membahayakan keselamatan komponen.'
        }
      }
    },
    {
      name: 'Bayu Aditya Pratama',
      email: 'bayu.aditya.user@example.com',
      nik: '8202011903890012',
      kk: '8202012009200012',
      birthPlace: 'Weda',
      birthDate: new Date('1989-03-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081299001122',
      emergencyContact: '081299001123 (Istri)',
      domicileAddress: 'Desa Lelilef Sawai, Weda Tengah',
      currentAddress: 'Desa Lelilef Sawai, Weda Tengah, Halmahera Tengah',
      provName: 'Maluku Utara',
      cityName: 'Halmahera Tengah',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Pertambangan',
      educationInstitution: 'UPN Veteran Yogyakarta (Teknik Pertambangan)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Sertifikat POP Minerba',
      jobIndex: 4, // Production Supervisor
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_5',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        userInterview: {
          result: 'Ditolak User',
          feedback: 'User Rejected (Technical Fit - R-008): Pengetahuan fleet management pit nikel laterit basah belum memenuhi kriteria Superintendent Operasi.'
        }
      }
    },
    {
      name: 'Rian Hidayatullah',
      email: 'rian.hidayatullah.mcu@example.com',
      nik: '5207031208930013',
      kk: '5207032010210013',
      birthPlace: 'Taliwang',
      birthDate: new Date('1993-08-12'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '087811223344',
      emergencyContact: '087811223345 (Ibu)',
      domicileAddress: 'Jl. Raya Maluk No. 34, Sumbawa Barat',
      currentAddress: 'Jl. Raya Maluk No. 34, Sumbawa Barat',
      provName: 'Nusa Tenggara Barat',
      cityName: 'Sumbawa Barat',
      educationType: 'SLTA',
      latestEducation: 'SMK Listrik Industri',
      educationInstitution: 'SMKN 1 Bandung',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Surabaya',
      certName: 'Teknisi Elektrikal Otomotif',
      jobIndex: 6, // Auto Electrician
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        mcu: {
          resultStatus: 'UNFIT (Category C)',
          feedback: 'Failed Medical Check-Up (MCU - R-010): Ditemukan gangguan pendengaran berat (Audiometri Noise Induced Hearing Loss) dan asma aktif.'
        }
      }
    },

    // -----------------------------------------------------------------------
    // KATEGORI 4: KANDIDAT AKTIF ON PROCESS (11 Orang - Tersebar di Stage 1 s/d 7)
    // -----------------------------------------------------------------------
    // STAGE 1: CV Screening (2 Orang)
    {
      name: 'Agus Setiawan',
      email: 'agus.setiawan.opr@example.com',
      nik: '6401051509960014',
      kk: '6401052011220014',
      birthPlace: 'Sangatta',
      birthDate: new Date('1996-09-15'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '081233221100',
      emergencyContact: '081233221101 (Orang Tua)',
      domicileAddress: 'Jl. Dayung No. 15, Sangatta',
      currentAddress: 'Jl. Dayung No. 15, Sangatta',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      educationType: 'SLTA',
      latestEducation: 'SMK Otomotif',
      educationInstitution: 'SMKN 1 Sangatta Utara (Geologi Pertambangan)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'SIO Operator Alat Berat Kemnaker',
      jobIndex: 0,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_1',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: false,
          notes: 'Menunggu verifikasi keabsahan dokumen SIO oleh tim rekruter.'
        }
      }
    },
    {
      name: 'Rahmat Ramadhan',
      email: 'rahmat.ramadhan.srv@example.com',
      nik: '6403022201970015',
      kk: '6403022012230015',
      birthPlace: 'Berau',
      birthDate: new Date('1997-01-22'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '082144556677',
      emergencyContact: '082144556678 (Ayah)',
      domicileAddress: 'Jl. SA Maulana No. 8, Berau',
      currentAddress: 'Jl. SA Maulana No. 8, Berau',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3 Teknik Geomatika',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Sertifikasi Juru Ukur Tambang',
      jobIndex: 1,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_1',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {}
    },

    // STAGE 2: Interview HR (2 Orang - Lengkap dengan Jadwal Interview di DB)
    {
      name: 'Dimas Ardiansyah',
      email: 'dimas.ardiansyah.hr@example.com',
      nik: '7203061705940016',
      kk: '7203062013240016',
      birthPlace: 'Palu',
      birthDate: new Date('1994-05-17'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '085288990011',
      emergencyContact: '085288990012 (Istri)',
      domicileAddress: 'Jl. Garuda No. 4, Morowali',
      currentAddress: 'Jl. Garuda No. 4, Morowali',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Lingkungan',
      educationInstitution: 'Politeknik Negeri Balikpapan (Poltekba)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Ahli K3 Umum & Pengelolaan Limbah B3 Tambang',
      jobIndex: 2,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_2',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: true,
          skema: 'Ahli K3 Umum',
          certNumber: 'BNSP-K3-2025-99012'
        },
        hrInterview: {
          date: addDays(today, 1).toISOString().split('T')[0],
          time: '10:00 WITA',
          interviewer: 'Rian Pratama, S.Psi',
          link: 'https://meet.google.com/imms-mining-hr2'
        }
      }
    },
    {
      name: 'Tri Wahyudi',
      email: 'tri.wahyudi.hr@example.com',
      nik: '1603041908950017',
      kk: '1603042014250017',
      birthPlace: 'Lahat',
      birthDate: new Date('1995-08-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '081399002233',
      emergencyContact: '081399002234 (Ibu)',
      domicileAddress: 'Jl. Mayor Ruslan No. 12, Lahat',
      currentAddress: 'Jl. Mayor Ruslan No. 12, Lahat',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'SLTA',
      latestEducation: 'SMK Otomotif Alat Berat',
      educationInstitution: 'SMKN 1 Bandung',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Bandung',
      certName: 'Mekanik Alat Berat Junior',
      jobIndex: 3,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_2',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: {
          isApproved: true,
          skema: 'Mekanik Alat Berat'
        },
        hrInterview: {
          date: addDays(today, 2).toISOString().split('T')[0],
          time: '14:00 WIB',
          interviewer: 'Rian Pratama, S.Psi',
          link: 'https://meet.google.com/imms-mining-hr3'
        }
      }
    },

    // STAGE 3: Psikotes (2 Orang)
    {
      name: 'Eko Prasetyo Utomo',
      email: 'eko.prasetyo.psi@example.com',
      nik: '8202041211900018',
      kk: '8202042015260018',
      birthPlace: 'Ternate',
      birthDate: new Date('1990-11-12'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081277665544',
      emergencyContact: '081277665545 (Istri)',
      domicileAddress: 'Jl. Pahlawan Revolusi No. 9, Ternate',
      currentAddress: 'Jl. Pahlawan Revolusi No. 9, Ternate',
      provName: 'Maluku Utara',
      cityName: 'Halmahera Tengah',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Pertambangan',
      educationInstitution: 'UPN Veteran Yogyakarta (Teknik Pertambangan)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Sertifikat POP Minerba',
      jobIndex: 4,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_3',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 3).toISOString().split('T')[0],
          feedback: 'Kepemimpinan lapangan sangat matang.',
          file: 'resume_eko.pdf',
          resultFile: 'hr_eval_eko.pdf'
        }
      }
    },
    {
      name: 'M. Rizky Saputra',
      email: 'rizky.saputra.psi@example.com',
      nik: '6401062002930019',
      kk: '6401062016270019',
      birthPlace: 'Samarinda',
      birthDate: new Date('1993-02-20'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '082188776655',
      emergencyContact: '082188776656 (Kakak)',
      domicileAddress: 'Jl. P. Antasari No. 25, Samarinda',
      currentAddress: 'Jl. P. Antasari No. 25, Samarinda',
      provName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      educationType: 'SLTA',
      latestEducation: 'SMK Alat Berat',
      educationInstitution: 'SMKN 1 Sangatta Utara (Geologi Pertambangan)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'SIO Excavator Kelas 1',
      jobIndex: 0,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_3',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 4).toISOString().split('T')[0],
          feedback: 'Kandidat memiliki motivasi tinggi dan bersedia ditempatkan di pit terpencil.',
          file: 'resume_rizky.pdf',
          resultFile: 'hr_eval_rizky.pdf'
        }
      }
    },

    // STAGE 4: Technical Test (2 Orang)
    {
      name: 'Surya Dharmawan',
      email: 'surya.dharmawan.test@example.com',
      nik: '6403051406920020',
      kk: '6403052017280020',
      birthPlace: 'Berau',
      birthDate: new Date('1992-06-14'),
      gender: 'Laki-laki',
      religion: 'Hindu',
      maritalStatus: 'Menikah',
      whatsapp: '081366554433',
      emergencyContact: '081366554434 (Istri)',
      domicileAddress: 'Jl. Murjani No. 77, Tanjung Redeb',
      currentAddress: 'Jl. Murjani No. 77, Tanjung Redeb',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Geomatika',
      educationInstitution: 'Institut Teknologi Bandung',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Bandung',
      certName: 'Juru Ukur Tambang Senior',
      jobIndex: 1,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_4',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 6).toISOString().split('T')[0],
          feedback: 'Penguasaan konsep geodesi dan batimetri pit danau tambang sangat baik.',
          file: 'resume_surya.pdf',
          resultFile: 'hr_eval_surya.pdf'
        },
        psikotes: {
          result: 'Disarankan',
          date: subDays(today, 3).toISOString().split('T')[0],
          file: 'psikotes_surya.pdf'
        }
      }
    },
    {
      name: 'Joko Susilo',
      email: 'joko.susilo.test@example.com',
      nik: '1603071807900021',
      kk: '1603072018290021',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1990-07-18'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081255443322',
      emergencyContact: '081255443323 (Istri)',
      domicileAddress: 'Jl. Kartini No. 4, Tanjung Enim',
      currentAddress: 'Jl. Kartini No. 4, Tanjung Enim',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'SLTA',
      latestEducation: 'SMK Mesin',
      educationInstitution: 'SMKN 1 Bandung',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Bandung',
      certName: 'Senior Heavy Equipment Fitter',
      jobIndex: 3,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_4',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 7).toISOString().split('T')[0],
          feedback: 'Skill mekanikal solid.',
          file: 'resume_joko.pdf',
          resultFile: 'hr_eval_joko.pdf'
        },
        psikotes: {
          result: 'Disarankan',
          date: subDays(today, 4).toISOString().split('T')[0],
          file: 'psikotes_joko.pdf'
        }
      }
    },

    // STAGE 5: Interview User (1 Orang)
    {
      name: 'Yohanes Rumkabu',
      email: 'yohanes.rumkabu.user@example.com',
      nik: '9101011504910022',
      kk: '9101012019300022',
      birthPlace: 'Timika',
      birthDate: new Date('1991-04-15'),
      gender: 'Laki-laki',
      religion: 'Kristen',
      maritalStatus: 'Menikah',
      whatsapp: '081144332211',
      emergencyContact: '081144332212 (Istri)',
      domicileAddress: 'Jl. Cenderawasih SP2, Timika',
      currentAddress: 'Jl. Cenderawasih SP2, Timika, Mimika',
      provName: 'Papua Tengah',
      cityName: 'Mimika',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3 Teknik Mesin',
      educationInstitution: 'Politeknik Negeri Balikpapan (Poltekba)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Mekanik Alat Berat Tambang Terbuka',
      jobIndex: 3,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_5',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 8).toISOString().split('T')[0],
          feedback: 'Kandidat putra daerah yang berdedikasi tinggi.',
          file: 'resume_yohanes.pdf',
          resultFile: 'hr_eval_yohanes.pdf'
        },
        psikotes: {
          result: 'Disarankan',
          date: subDays(today, 5).toISOString().split('T')[0],
          file: 'psikotes_yohanes.pdf'
        },
        testSkill: {
          date: subDays(today, 3).toISOString().split('T')[0],
          videoLink: 'https://youtube.com/watch?v=field_drill_yohanes',
          proofs: [{ title: 'Diagnostic Scanner Cat ET pada OHT 777E', file: 'diagnostic_yohanes.pdf' }],
          resultFile: 'skill_pass_88.pdf'
        },
        userInterview: {
          date: addDays(today, 1).toISOString().split('T')[0],
          time: '09:00 WIT',
          interviewer: 'Ir. Budi Santoso, ST., IPM (Mining Superintendent)'
        }
      }
    },

    // STAGE 6: Offering Letter (1 Orang)
    {
      name: 'Aditya Bagus Wicaksono',
      email: 'aditya.bagus.offering@example.com',
      nik: '6401021408930023',
      kk: '6401022020310023',
      birthPlace: 'Sangatta',
      birthDate: new Date('1993-08-14'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '081299887766',
      emergencyContact: '081299887767 (Ayah)',
      domicileAddress: 'Jl. Munthe No. 18, Sangatta',
      currentAddress: 'Jl. Munthe No. 18, Sangatta',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      educationType: 'SLTA',
      latestEducation: 'SMK Otomotif Alat Berat',
      educationInstitution: 'SMKN 1 Sangatta Utara (Geologi Pertambangan)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'SIO Operator Excavator PC2000',
      jobIndex: 0,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_6',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 10).toISOString().split('T')[0],
          feedback: 'Sangat direkomendasikan.',
          file: 'resume_aditya.pdf',
          resultFile: 'hr_eval_aditya.pdf'
        },
        psikotes: {
          result: 'Sangat Disarankan',
          date: subDays(today, 7).toISOString().split('T')[0],
          file: 'psikotes_aditya.pdf'
        },
        testSkill: {
          date: subDays(today, 5).toISOString().split('T')[0],
          videoLink: 'https://youtube.com/watch?v=aditya_pc2000',
          proofs: [{ title: 'Praktik Loading PC2000', file: 'aditya_proof.mp4' }],
          resultFile: 'skill_score_94.pdf'
        },
        userInterview: {
          result: 'Lulus',
          date: subDays(today, 3).toISOString().split('T')[0],
          feedback: 'Disetujui penempatan di fleet KPC.',
          file: 'user_approval_aditya.pdf'
        },
        offeringLetter: {
          date: subDays(today, 1).toISOString().split('T')[0],
          file: 'offering_letter_kpc_aditya.pdf',
          salary: 14500000,
          allowance: 4000000
        }
      }
    },

    // STAGE 7: MCU Tambang (1 Orang)
    {
      name: 'Rizki Ananda Putra',
      email: 'rizki.ananda.mcu@example.com',
      nik: '7203011904940024',
      kk: '7203012021320024',
      birthPlace: 'Morowali',
      birthDate: new Date('1994-04-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '085377889922',
      emergencyContact: '085377889923 (Ibu)',
      domicileAddress: 'Jl. Trans Bahomakmur, Morowali',
      currentAddress: 'Jl. Trans Bahomakmur, Morowali',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3 Teknik Pertambangan',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'Ahli K3 & Pengawas Lapangan',
      jobIndex: 2,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true },
        hrInterview: {
          result: 'Lulus',
          date: subDays(today, 12).toISOString().split('T')[0],
          file: 'resume_rizki.pdf',
          resultFile: 'hr_eval_rizki.pdf'
        },
        psikotes: {
          result: 'Disarankan',
          date: subDays(today, 9).toISOString().split('T')[0],
          file: 'psikotes_rizki.pdf'
        },
        testSkill: {
          date: subDays(today, 6).toISOString().split('T')[0],
          videoLink: 'https://youtube.com/watch?v=safety_rizki',
          proofs: [{ title: 'Inspeksi Pit Safety', file: 'inspeksi_rizki.pdf' }],
          resultFile: 'skill_rizki.pdf'
        },
        userInterview: {
          result: 'Lulus',
          date: subDays(today, 4).toISOString().split('T')[0],
          file: 'user_approval_rizki.pdf'
        },
        offeringLetter: {
          date: subDays(today, 2).toISOString().split('T')[0],
          file: 'offering_signed_rizki.pdf'
        },
        mcu: {
          date: today.toISOString().split('T')[0],
          pengantarFile: 'sp_mcu_lab_morowali_rizki.pdf',
          hasilFile: null,
          notes: 'Sedang menunggu hasil evaluasi dokter spesialis okupasi tambang.'
        }
      }
    },

    // -----------------------------------------------------------------------
    // KATEGORI 5: TALENT POOL (4 Orang - Profil Unggulan Siap Dipanggil)
    // -----------------------------------------------------------------------
    {
      name: 'Bagus Setyawan, S.T.',
      email: 'bagus.setyawan.pool@example.com',
      nik: '6401072911950025',
      kk: '6401072022330025',
      birthPlace: 'Samarinda',
      birthDate: new Date('1995-11-29'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '081288776611',
      emergencyContact: '081288776612 (Kakak)',
      domicileAddress: 'Jl. Juanda No. 102, Samarinda',
      currentAddress: 'Jl. Juanda No. 102, Samarinda',
      provName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Pertambangan',
      educationInstitution: 'UPN Veteran Yogyakarta (Teknik Pertambangan)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Sertifikat POP Minerba & Surpac Mine Planning',
      jobIndex: 4,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_1',
      isTalentPool: true,
      isBlacklisted: false,
      stageData: {
        talentPoolNotes: 'Lulusan Cumlaude Teknik Pertambangan, menguasai software tambang lengkap, siap diproyeksikan untuk ekspansi pit baru Q3 2026.'
      }
    },
    {
      name: 'Galih Chandra Wibowo',
      email: 'galih.chandra.pool@example.com',
      nik: '6403071603940026',
      kk: '6403072023340026',
      birthPlace: 'Berau',
      birthDate: new Date('1994-03-16'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '082199887744',
      emergencyContact: '082199887745 (Istri)',
      domicileAddress: 'Jl. H. Isa I No. 44, Berau',
      currentAddress: 'Jl. H. Isa I No. 44, Berau',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3 Teknik Mesin',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Balikpapan',
      certName: 'Senior Heavy Equipment Fitter (Caterpillar)',
      jobIndex: 3,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_1',
      isTalentPool: true,
      isBlacklisted: false,
      stageData: {
        talentPoolNotes: 'Mekanik spesialis transmisi dump truck Komatsu HD785. Disimpan di Talent Pool untuk kebutuhan replacement mendadak.'
      }
    },
    {
      name: 'Nur Aini Fadilah, S.Si',
      email: 'nur.aini.pool@example.com',
      nik: '1603092802960027',
      kk: '1603092024350027',
      birthPlace: 'Palembang',
      birthDate: new Date('1996-02-28'),
      gender: 'Perempuan',
      religion: 'Islam',
      maritalStatus: 'Lajang',
      whatsapp: '081377889955',
      emergencyContact: '081377889956 (Ibu)',
      domicileAddress: 'Jl. Demang Lebar Daun No. 56, Palembang',
      currentAddress: 'Jl. Demang Lebar Daun No. 56, Palembang',
      provName: 'Sumatera Selatan',
      cityName: 'Palembang',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1 Teknik Geologi',
      educationInstitution: 'Institut Teknologi Bandung',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Bandung',
      certName: 'Geologist Exploration Modeler (Micromine)',
      jobIndex: 5,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_1',
      isTalentPool: true,
      isBlacklisted: false,
      stageData: {
        talentPoolNotes: 'Ahli estimasi sumberdaya batubara & geostatistika. Profil prioritas tinggi.'
      }
    },
    {
      name: 'Lukman Hakim Siregar',
      email: 'lukman.hakim.pool@example.com',
      nik: '7203091107930028',
      kk: '7203092025360028',
      birthPlace: 'Morowali',
      birthDate: new Date('1993-07-11'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '085299001144',
      emergencyContact: '085299001145 (Istri)',
      domicileAddress: 'Desa Labota, Bahodopi, Morowali',
      currentAddress: 'Desa Labota, Bahodopi, Morowali',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'SLTA',
      latestEducation: 'SMK Otomotif Alat Berat',
      educationInstitution: 'SMKN 1 Sangatta Utara (Geologi Pertambangan)',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Makassar',
      certName: 'SIO Operator Dump Truck 100 Ton',
      jobIndex: 0,
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_1',
      isTalentPool: true,
      isBlacklisted: false,
      stageData: {
        talentPoolNotes: 'Kandidat operator dump truck lokal Morowali berpengalaman hauling nikel basah.'
      }
    }
  ];

  for (let idx = 0; idx < candidateSeeds.length; idx++) {
    const c = candidateSeeds[idx];
    const provId = provinceMap.get(c.provName) || (await prisma.masterProvince.findFirst())!.id;
    const cityId = cityMap.get(c.cityName) || (await prisma.masterCity.findFirst({ where: { provinceId: provId } }))!.id;
    const targetJob = createdJobs[c.jobIndex % createdJobs.length];

    // 1. Buat User
    let user = await prisma.user.findUnique({
      where: { email: c.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: c.email,
          name: c.name,
          password: hashedPassword,
          role: UserRole.CANDIDATE
        }
      });
    }

    // 2. Buat CandidateProfile
    let profile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id }
    });

    const profileData = {
      userId: user.id,
      nik: c.nik,
      kk: c.kk,
      birthPlace: c.birthPlace,
      birthDate: c.birthDate,
      gender: c.gender,
      religion: c.religion,
      maritalStatus: c.maritalStatus,
      whatsapp: c.whatsapp,
      emergencyContact: c.emergencyContact,
      domicileAddress: c.domicileAddress,
      currentAddress: c.currentAddress,
      provinceId: provId,
      cityId: cityId,
      educationType: c.educationType,
      latestEducation: c.latestEducation,
      educationInstitution: c.educationInstitution,
      trainingCenterType: c.trainingCenterType,
      trainingCenterName: c.trainingCenterName,
      isProfileCompleted: true,
      isTalentPool: c.isTalentPool,
      isBlacklisted: c.isBlacklisted,
      blacklistReason: c.isBlacklisted ? c.blacklistReason : null,
      blacklistedAt: c.isBlacklisted ? c.blacklistedAt : null,
      isArchived: c.status === ApplicationStatus.REJECTED && !c.isBlacklisted
    };

    if (profile) {
      profile = await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: profileData
      });
    } else {
      profile = await prisma.candidateProfile.create({
        data: profileData
      });
    }

    // 3. Buat Dokumen Pelengkap
    await prisma.candidateDocument.deleteMany({
      where: { candidateProfileId: profile.id }
    });

    const docs = makeDocs(profile.id, `CAND-${idx + 1}`, c.certName);
    for (const d of docs) {
      await prisma.candidateDocument.create({ data: d });
    }

    // 4. Buat Application & History
    let application = await prisma.application.findFirst({
      where: {
        jobId: targetJob.id,
        candidateProfileId: profile.id
      }
    });

    const appDate = subDays(today, 15 - (idx % 10));

    if (application) {
      await prisma.applicationHistory.deleteMany({ where: { applicationId: application.id } });
      await prisma.interview.deleteMany({ where: { applicationId: application.id } });

      application = await prisma.application.update({
        where: { id: application.id },
        data: {
          currentStageId: c.currentStageId,
          status: c.status,
          applicationDate: appDate,
          stageData: c.stageData
        }
      });
    } else {
      application = await prisma.application.create({
        data: {
          jobId: targetJob.id,
          candidateProfileId: profile.id,
          currentStageId: c.currentStageId,
          status: c.status,
          applicationDate: appDate,
          stageData: c.stageData
        }
      });
    }

    // 5. Buat History Perjalanan Rekrutmen
    // Stage 1 (Screening)
    await prisma.applicationHistory.create({
      data: {
        applicationId: application.id,
        stageId: 'stage_1',
        stageName: 'CV Screening',
        date: appDate,
        note: 'Dokumen lamaran lengkap berhasil disubmit.'
      }
    });

    // Jika melewati stage 1
    if (['stage_2', 'stage_3', 'stage_4', 'stage_5', 'stage_6', 'stage_7'].includes(c.currentStageId) || c.status === ApplicationStatus.HIRED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageId: 'stage_2',
          stageName: 'Interview HR',
          date: addDays(appDate, 2),
          note: 'Lolos seleksi administrasi & verifikasi BNSP, berlanjut ke Interview HR.'
        }
      });
    }

    // Jika melewati stage 2
    if (['stage_3', 'stage_4', 'stage_5', 'stage_6', 'stage_7'].includes(c.currentStageId) || c.status === ApplicationStatus.HIRED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageId: 'stage_3',
          stageName: 'Psikotes',
          date: addDays(appDate, 5),
          note: 'Interview HR selesai (Grade A), diarahkan ke asesmen psikotes pit.'
        }
      });
    }

    // Jika melewati stage 3
    if (['stage_4', 'stage_5', 'stage_6', 'stage_7'].includes(c.currentStageId) || c.status === ApplicationStatus.HIRED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageId: 'stage_4',
          stageName: 'Technical Test',
          date: addDays(appDate, 8),
          note: 'Hasil psikotes disarankan. Menjalani uji teknis dan praktik simulator.'
        }
      });
    }

    // Jika melewati stage 4
    if (['stage_5', 'stage_6', 'stage_7'].includes(c.currentStageId) || c.status === ApplicationStatus.HIRED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageId: 'stage_5',
          stageName: 'Interview User',
          date: addDays(appDate, 11),
          note: 'Lolos uji kompetensi alat berat, lanjut ke Interview Superintendent Operasional.'
        }
      });
    }

    // Jika melewati stage 5
    if (['stage_6', 'stage_7'].includes(c.currentStageId) || c.status === ApplicationStatus.HIRED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageId: 'stage_6',
          stageName: 'Offering',
          date: addDays(appDate, 13),
          note: 'User menyetujui kualifikasi, penerbitan surat penawaran (Offering Letter).'
        }
      });
    }

    // Jika melewati stage 6 / Hired
    if (c.currentStageId === 'stage_7' || c.status === ApplicationStatus.HIRED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageId: 'stage_7',
          stageName: 'MCU',
          date: addDays(appDate, 15),
          note: 'Offering disepakati kandidat, menjalani pemeriksaan Medical Check Up Tambang.'
        }
      });
    }

    // Status Akhir
    if (c.status === ApplicationStatus.HIRED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageName: 'Hired',
          date: addDays(appDate, 16),
          note: 'Hasil MCU FIT TO WORK (Category A). Kandidat resmi HIRED dan diterbitkan PKWT.'
        }
      });
    } else if (c.status === ApplicationStatus.REJECTED) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageName: 'Rejected',
          date: addDays(appDate, 5),
          note: c.isBlacklisted
            ? `BLACKLIST PERMANEN: ${c.blacklistReason}`
            : `Kandidat dinyatakan gugur pada tahap ${c.currentStageId}. Tidak memenuhi kualifikasi standar pertambangan.`
        }
      });
    }

    // 6. Buat Jadwal Interview jika berada di stage 2 atau stage 5
    if (c.currentStageId === 'stage_2') {
      await prisma.interview.create({
        data: {
          applicationId: application.id,
          type: 'HR Interview',
          title: `Interview HR - ${c.name}`,
          scheduledAt: addDays(today, (idx % 3) + 1),
          durationMinutes: 45,
          locationOrLink: 'Online Google Meet / Ruang Wawancara HR Site',
          interviewerName: 'Rian Pratama, S.Psi (Lead Recruiter)'
        }
      });
    } else if (c.currentStageId === 'stage_5') {
      await prisma.interview.create({
        data: {
          applicationId: application.id,
          type: 'User Interview',
          title: `Interview User - ${c.name}`,
          scheduledAt: addDays(today, 2),
          durationMinutes: 60,
          locationOrLink: 'Main Office Pit Conference Room & Zoom',
          interviewerName: 'Ir. Budi Santoso, ST., IPM (Mining Superintendent)'
        }
      });
    }
  }

  console.log('✅ Seeding dummy data sektor pertambangan selesai dengan sukses!');
  console.log('📊 Ringkasan Data:');
  console.log(`- Total Lowongan Tambang: ${createdJobs.length} posisi`);
  console.log(`- Total Profil Kandidat: ${candidateSeeds.length} kandidat`);
  console.log('  * Hired: 4 orang (lengkap hingga BAST & MCU Fit)');
  console.log('  * Blacklist: 3 orang (pelanggaran berat SIO, indisipliner, narkotika)');
  console.log('  * Rejected / Archived: 6 orang (gugur di berbagai stage: 1, 2, 3, 4, 5, 7)');
  console.log('  * On Process: 11 orang (tersebar merata di Stage 1 s/d 7)');
  console.log('  * Talent Pool: 4 orang (lulusan unggulan & spesialis)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Terjadi kesalahan saat seeding dummy data:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
