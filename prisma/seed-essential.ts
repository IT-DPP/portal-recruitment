import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { MASTER_INSTITUTE } from '../lib/masterData';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding essential data...');

  const hashedPassword = await bcrypt.hash('password', 10);
  
  // Seed Superadmin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);



  // Seed Master Provinces and Cities
  const indonesianLocations = [
    {
      province: 'DKI Jakarta',
      code: 'JKT',
      cities: ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Kepulauan Seribu']
    },
    {
      province: 'Jawa Barat',
      code: 'JBR',
      cities: ['Bandung', 'Bogor', 'Depok', 'Bekasi', 'Cimahi', 'Cirebon']
    },
    {
      province: 'Jawa Tengah',
      code: 'JTG',
      cities: ['Semarang', 'Surakarta', 'Salatiga', 'Magelang', 'Tegal']
    },
    {
      province: 'Jawa Timur',
      code: 'JTM',
      cities: ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik', 'Batu', 'Kediri']
    },
    {
      province: 'Banten',
      code: 'BTN',
      cities: ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon']
    }
  ];

  for (const loc of indonesianLocations) {
    let province = await prisma.masterProvince.findFirst({
      where: { OR: [{ name: loc.province }, { code: loc.code }] }
    });
    if (!province) {
      province = await prisma.masterProvince.create({
        data: { name: loc.province, code: loc.code }
      });
      console.log(`Created province: ${loc.province}`);
    }

    for (const cityName of loc.cities) {
      const city = await prisma.masterCity.findFirst({
        where: { name: cityName, provinceId: province.id }
      });
      if (!city) {
        await prisma.masterCity.create({
          data: { name: cityName, provinceId: province.id }
        });
        console.log(`Created city: ${cityName}`);
      }
    }
  }

  // Seed Customers
  const customers = [
    { code: 'CUST-01', name: 'PT Astra International' },
    { code: 'CUST-02', name: 'PT Telkom Indonesia' },
    { code: 'CUST-03', name: 'PT Bank Mandiri' },
    { code: 'CUST-04', name: 'PT United Tractors' }
  ];
  for (const c of customers) {
    let cust = await prisma.masterCustomer.findFirst({
      where: { OR: [{ name: c.name }, { code: c.code }] }
    });
    if (!cust) {
      await prisma.masterCustomer.create({ data: c });
      console.log(`Created customer: ${c.name}`);
    }
  }

  // Seed Positions
  const positions = [
    { code: 'POS-01', name: 'Software Engineer' },
    { code: 'POS-02', name: 'HR Manager' },
    { code: 'POS-03', name: 'Data Analyst' },
    { code: 'POS-04', name: 'Project Manager' },
    { code: 'POS-05', name: 'Mechanic' }
  ];
  for (const p of positions) {
    let pos = await prisma.masterPosition.findFirst({
      where: { OR: [{ name: p.name }, { code: p.code }] }
    });
    if (!pos) {
      await prisma.masterPosition.create({ data: p });
      console.log(`Created position: ${p.name}`);
    }
  }

  // Seed Sites
  const siteData = [
    { name: "KPC Sangatta Coal Mine", lat: 0.823979, lng: 117.599032, loc: "Kalimantan Timur" },
    { name: "Berau Coal Mine", lat: 2.15, lng: 117.5, loc: "Kalimantan Timur" },
    { name: "Tanjung Enim Coal Mine", lat: -4.118, lng: 103.772, loc: "Sumatera Selatan" },
    { name: "Ombilin Coal Mine", lat: -0.683611, lng: 100.766667, loc: "Sumatera Barat" },
    { name: "Martabe Gold Mine", lat: 1.527778, lng: 99.065556, loc: "Sumatera Utara" },
    { name: "Sorowako Nickel Mine", lat: -2.54598, lng: 121.35274, loc: "Sulawesi Selatan" },
    { name: "Morowali Nickel Mining Area", lat: -2.85, lng: 122.1, loc: "Sulawesi Tengah" },
    { name: "Weda Bay Nickel Mining Area", lat: 0.478319, lng: 127.983631, loc: "Maluku Utara" },
    { name: "Batu Hijau Mine", lat: -8.96, lng: 116.87, loc: "Nusa Tenggara Barat" },
    { name: "Grasberg Mine", lat: -4.05836, lng: 137.10811, loc: "Papua Tengah" },
  ];

  const allCustomers = await prisma.masterCustomer.findMany();
  const allCities = await prisma.masterCity.findMany();

  if (allCustomers.length > 0 && allCities.length > 0) {
    for (let i = 0; i < siteData.length; i++) {
      const site = siteData[i];
      const customer = allCustomers[i % allCustomers.length];
      const city = allCities[i % allCities.length];
      
      let existingSite = await prisma.masterSite.findFirst({
        where: { name: site.name }
      });

      if (!existingSite) {
        await prisma.masterSite.create({
          data: {
            code: `SIT-${i + 1}`,
            name: site.name,
            latitude: site.lat,
            longitude: site.lng,
            customerId: customer.id,
            cityId: city.id,
            provinceId: city.provinceId
          }
        });
        console.log(`Created site: ${site.name}`);
      }
    }
  }

  // Seed Institutes from MASTER_INSTITUTE
  for (const ins of MASTER_INSTITUTE) {
    let institute = await prisma.masterInstitute.findFirst({
      where: { OR: [{ name: ins.name }, { code: ins.id }] }
    });
    if (!institute) {
      await prisma.masterInstitute.create({ 
        data: {
          code: ins.id,
          name: ins.name,
          type: ins.type,
          status: ins.status,
          province: ins.province,
          city: ins.city,
          address: ins.address
        } 
      });
      console.log(`Created institute: ${ins.name}`);
    }
  }

  // Seed Request Types
  const requestTypes = [
    { code: 'REQ-NEW', name: 'Penambahan Baru' },
    { code: 'REQ-REP', name: 'Penggantian / Replacement' },
    { code: 'REQ-TMP', name: 'Karyawan Sementara / Temporary' }
  ];
  for (const req of requestTypes) {
    let reqType = await prisma.masterRequestType.findFirst({
      where: { OR: [{ name: req.name }, { code: req.code }] }
    });
    if (!reqType) {
      await prisma.masterRequestType.create({ data: req });
      console.log(`Created request type: ${req.name}`);
    }
  }

  // Seed Certifications
  const certifications = [
    { code: "S-001", name: "Ahli K3 Umum" },
    { code: "S-002", name: "Ahli K3 Listrik" },
    { code: "S-003", name: "Welder (Juru Las) Kelas 1" },
    { code: "S-004", name: "Operator Alat Berat" },
    { code: "S-005", name: "Senior Mechanical Engineer" },
    { code: "S-006", name: "Desainer Grafis Junior" },
    { code: "S-007", name: "Auditor Internal Sistem Manajemen Mutu" },
  ];
  for (const cert of certifications) {
    let certification = await prisma.masterCertification.findFirst({
      where: { OR: [{ name: cert.name }, { code: cert.code }] }
    });
    if (!certification) {
      await prisma.masterCertification.create({ data: cert });
      console.log(`Created certification: ${cert.name}`);
    }
  }

  // Seed Pipeline Stages
  const pipelineStages = [
    { id: "stage_1", name: "CV Screening", orderIndex: 1, slaDays: 3 },
    { id: "stage_2", name: "Interview HR", orderIndex: 2, slaDays: 5 },
    { id: "stage_3", name: "Psikotes", orderIndex: 3, slaDays: 7 },
    { id: "stage_4", name: "Technical Test", orderIndex: 4, slaDays: 5 },
    { id: "stage_5", name: "Interview User", orderIndex: 5, slaDays: 5 },
    { id: "stage_6", name: "Offering", orderIndex: 6, slaDays: 3 },
    { id: "stage_7", name: "MCU", orderIndex: 7, slaDays: 5 },
  ];
  for (const st of pipelineStages) {
    let stage = await prisma.masterPipelineStage.findFirst({
      where: { id: st.id }
    });
    if (!stage) {
      await prisma.masterPipelineStage.create({ data: st });
      console.log(`Created pipeline stage: ${st.name}`);
    }
  }

  // Seed Rejection Messages
  const rejectionMessages = [
    { code: "R-001", stageId: "stage_1", message: "Incomplete Documents" },
    { code: "R-002", stageId: "stage_1", message: "Fake Documents Detected" },
    { code: "R-003", stageId: "stage_1", message: "Does Not Meet Requirements" },
    { code: "R-004", stageId: "stage_2", message: "Poor Communication Skills" },
    { code: "R-005", stageId: "stage_2", message: "Attitude / Culture Mismatch" },
    { code: "R-006", stageId: "stage_3", message: "Did Not Pass Psychological Standards" },
    { code: "R-007", stageId: "stage_4", message: "Failed Technical Test" },
    { code: "R-008", stageId: "stage_5", message: "User Rejected (Technical Fit)" },
    { code: "R-009", stageId: "stage_6", message: "Offer Rejected by Candidate" },
    { code: "R-010", stageId: "stage_7", message: "Failed Medical Check-Up (MCU)" },
  ];
  for (const msg of rejectionMessages) {
    let message = await prisma.masterRejectionMessage.findFirst({
      where: { code: msg.code }
    });
    if (!message) {
      await prisma.masterRejectionMessage.create({ data: msg });
      console.log(`Created rejection message: ${msg.message}`);
    }
  }

  console.log('Seeding essential data finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
