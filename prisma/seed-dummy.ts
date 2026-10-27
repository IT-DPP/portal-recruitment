import { PrismaClient, UserRole, JobStatus, ApplicationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai seeding data recruitment realistis & saling berelasi...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Helper date generators relative to today
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Helper for current month specific date
  const inCurrentMonth = (day: number) => new Date(currentYear, currentMonth, Math.min(day, 28), 9, 0, 0);
  const inPrevMonth = (day: number) => new Date(currentYear, currentMonth - 1, Math.min(day, 28), 9, 0, 0);

  // =========================================================================
  // 1. MASTER WILAYAH (Provinces & Cities)
  // =========================================================================
  console.log('📍 1/9 Menyiapkan Master Provinsi & Kota...');

  const regionalLocations = [
    {
      province: 'Kalimantan Timur',
      code: 'KTI',
      cities: ['Kutai Timur', 'Berau', 'Samarinda', 'Balikpapan', 'Kutai Kartanegara', 'Bontang', 'Paser']
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
      cities: ['Jakarta Pusat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Utara']
    },
    {
      province: 'Jawa Barat',
      code: 'JBR',
      cities: ['Bandung', 'Bekasi', 'Bogor', 'Cimahi', 'Cirebon']
    },
    {
      province: 'Jawa Timur',
      code: 'JTM',
      cities: ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik']
    },
    {
      province: 'Banten',
      code: 'BTN',
      cities: ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon']
    }
  ];

  const cityMap = new Map<string, string>(); // cityName -> cityId
  const provinceMap = new Map<string, string>(); // provName -> provId

  for (const loc of regionalLocations) {
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
  // 2. MASTER CUSTOMERS & OPERATIONAL SITES
  // =========================================================================
  console.log('🏭 2/9 Menyiapkan Master Perusahaan & Site Operasional...');

  const customersList = [
    { code: 'CUST-KPC', name: 'PT Kaltim Prima Coal' },
    { code: 'CUST-BRC', name: 'PT Berau Coal' },
    { code: 'CUST-PTBA', name: 'PT Bukit Asam Tbk' },
    { code: 'CUST-FMI', name: 'PT Freeport Indonesia' },
    { code: 'CUST-VALE', name: 'PT Vale Indonesia Tbk' },
    { code: 'CUST-UT', name: 'PT United Tractors Tbk' },
    { code: 'CUST-PAMA', name: 'PT Pamapersada Nusantara' },
    { code: 'CUST-IMIP', name: 'PT Indonesia Morowali Industrial Park' },
    { code: 'CUST-IWIP', name: 'PT Indonesia Weda Bay Industrial Park' },
    { code: 'CUST-AMMAN', name: 'PT Amman Mineral Nusa Tenggara' },
    { code: 'CUST-ASTRA', name: 'PT Astra International' },
    { code: 'CUST-TELKOM', name: 'PT Telkom Indonesia' },
    { code: 'CUST-MANDIRI', name: 'PT Bank Mandiri' }
  ];

  const customerMap = new Map<string, string>();
  for (const c of customersList) {
    let cust = await prisma.masterCustomer.findFirst({
      where: { OR: [{ name: c.name }, { code: c.code }] }
    });
    if (!cust) {
      cust = await prisma.masterCustomer.create({ data: c });
    }
    customerMap.set(c.name, cust.id);
  }

  const sitesConfig = [
    // PT Kaltim Prima Coal
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
      code: 'SITE-KPC-TJB',
      name: 'KPC Tanjung Bara Port Facility',
      customerName: 'PT Kaltim Prima Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      lat: 0.902140,
      lng: 117.654210,
      mcuPackage: 'Paket Terminal & Port Facility KPC'
    },
    {
      code: 'SITE-KPC-BPN',
      name: 'KPC Balikpapan Logistics & Supply Base',
      customerName: 'PT Kaltim Prima Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      lat: -1.258900,
      lng: 116.852400,
      mcuPackage: 'Paket Logistics & Supply Base OHS KPC'
    },
    {
      code: 'SITE-KPC-SMD',
      name: 'KPC Samarinda Liaison Office',
      customerName: 'PT Kaltim Prima Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      lat: -0.494800,
      lng: 117.143600,
      mcuPackage: 'Paket Office & Operations Support KPC'
    },

    // PT Berau Coal
    {
      code: 'SITE-BRC-BER',
      name: 'Berau Coal Mine Area',
      customerName: 'PT Berau Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Berau',
      lat: 2.150000,
      lng: 117.500000,
      mcuPackage: 'Paket Pit Worker & Surveyor OHS Berau Coal'
    },
    {
      code: 'SITE-BRC-SRN',
      name: 'Berau Coal Suaran Port Terminal',
      customerName: 'PT Berau Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Berau',
      lat: 2.083400,
      lng: 117.621500,
      mcuPackage: 'Paket Port Terminal & Marine OHS Berau Coal'
    },
    {
      code: 'SITE-BRC-BPN',
      name: 'Berau Coal Balikpapan Transshipment Base',
      customerName: 'PT Berau Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      lat: -1.242100,
      lng: 116.861200,
      mcuPackage: 'Paket Logistics & Marine Base Berau Coal'
    },
    {
      code: 'SITE-BRC-SMD',
      name: 'Berau Coal Samarinda Logistics Center',
      customerName: 'PT Berau Coal',
      provinceName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      lat: -0.501200,
      lng: 117.135400,
      mcuPackage: 'Paket Support & Logistics Hub Berau Coal'
    },

    // PT Bukit Asam Tbk
    {
      code: 'SITE-PTBA-TJE',
      name: 'Tanjung Enim Coal Mine',
      customerName: 'PT Bukit Asam Tbk',
      provinceName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      lat: -4.118000,
      lng: 103.772000,
      mcuPackage: 'Paket Operator & Mekanik Alat Berat PTBA'
    },
    {
      code: 'SITE-PTBA-PLM',
      name: 'PTBA Kertapati Coal Terminal Palembang',
      customerName: 'PT Bukit Asam Tbk',
      provinceName: 'Sumatera Selatan',
      cityName: 'Palembang',
      lat: -3.018200,
      lng: 104.754100,
      mcuPackage: 'Paket Port & Transshipment Terminal PTBA'
    },
    {
      code: 'SITE-PTBA-LHT',
      name: 'PTBA Lahat Regional Mining Unit',
      customerName: 'PT Bukit Asam Tbk',
      provinceName: 'Sumatera Selatan',
      cityName: 'Lahat',
      lat: -3.791200,
      lng: 103.541200,
      mcuPackage: 'Paket Regional Mining & Operations PTBA'
    },
    {
      code: 'SITE-PTBA-JKT',
      name: 'PTBA Menara Kadin Jakarta Office',
      customerName: 'PT Bukit Asam Tbk',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      lat: -6.234100,
      lng: 106.831500,
      mcuPackage: 'Paket Corporate & Management PTBA'
    },

    // PT Indonesia Morowali Industrial Park
    {
      code: 'SITE-IMIP-MRW',
      name: 'Morowali Nickel Mining Area',
      customerName: 'PT Indonesia Morowali Industrial Park',
      provinceName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      lat: -2.850000,
      lng: 122.100000,
      mcuPackage: 'Paket Smelter & Heavy Duty Mining IMIP'
    },
    {
      code: 'SITE-IMIP-BHD',
      name: 'IMIP Bahodopi Industrial & Smelter Complex',
      customerName: 'PT Indonesia Morowali Industrial Park',
      provinceName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      lat: -2.812300,
      lng: 122.154200,
      mcuPackage: 'Paket High Temperature Smelter OHS IMIP'
    },
    {
      code: 'SITE-IMIP-PLU',
      name: 'IMIP Palu Regional Administration Hub',
      customerName: 'PT Indonesia Morowali Industrial Park',
      provinceName: 'Sulawesi Tengah',
      cityName: 'Palu',
      lat: -0.900200,
      lng: 119.877500,
      mcuPackage: 'Paket Administration & Operations Hub IMIP'
    },

    // PT Indonesia Weda Bay Industrial Park
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
      code: 'SITE-IWIP-TJU',
      name: 'IWIP Tanjung Ulie Smelter & Port',
      customerName: 'PT Indonesia Weda Bay Industrial Park',
      provinceName: 'Maluku Utara',
      cityName: 'Halmahera Tengah',
      lat: 0.492100,
      lng: 128.012400,
      mcuPackage: 'Paket Port & Industrial Facility IWIP'
    },
    {
      code: 'SITE-IWIP-TNT',
      name: 'IWIP Ternate Regional Operations Hub',
      customerName: 'PT Indonesia Weda Bay Industrial Park',
      provinceName: 'Maluku Utara',
      cityName: 'Ternate',
      lat: 0.791200,
      lng: 127.382100,
      mcuPackage: 'Paket Logistics & Transit Hub IWIP'
    },

    // PT Vale Indonesia Tbk
    {
      code: 'SITE-VALE-SRW',
      name: 'Sorowako Nickel Mine',
      customerName: 'PT Vale Indonesia Tbk',
      provinceName: 'Sulawesi Selatan',
      cityName: 'Luwu Timur',
      lat: -2.545980,
      lng: 121.352740,
      mcuPackage: 'Paket Tambang Nikel Terbuka Vale - Fit for High Hazard'
    },
    {
      code: 'SITE-VALE-MLL',
      name: 'Vale Malili Port & Logistics Base',
      customerName: 'PT Vale Indonesia Tbk',
      provinceName: 'Sulawesi Selatan',
      cityName: 'Luwu Timur',
      lat: -2.591200,
      lng: 121.215400,
      mcuPackage: 'Paket Port & Maritime Logistics Vale'
    },
    {
      code: 'SITE-VALE-MKS',
      name: 'Vale Indonesia Makassar Representative Office',
      customerName: 'PT Vale Indonesia Tbk',
      provinceName: 'Sulawesi Selatan',
      cityName: 'Makassar',
      lat: -5.147600,
      lng: 119.432700,
      mcuPackage: 'Paket Regional Office & Liaison Vale'
    },

    // PT Freeport Indonesia
    {
      code: 'SITE-FMI-GRS',
      name: 'Grasberg Mine Timika',
      customerName: 'PT Freeport Indonesia',
      provinceName: 'Papua Tengah',
      cityName: 'Mimika',
      lat: -4.058360,
      lng: 137.108110,
      mcuPackage: 'Paket High Altitude & Underground Mining Grasberg (Papua)'
    },
    {
      code: 'SITE-FMI-KKC',
      name: 'Kuala Kencana Operations Support Base',
      customerName: 'PT Freeport Indonesia',
      provinceName: 'Papua Tengah',
      cityName: 'Mimika',
      lat: -4.432100,
      lng: 136.883200,
      mcuPackage: 'Paket Residential & Operations Center Freeport'
    },
    {
      code: 'SITE-FMI-AMP',
      name: 'Portsite Amamapare Cargo Facility',
      customerName: 'PT Freeport Indonesia',
      provinceName: 'Papua Tengah',
      cityName: 'Mimika',
      lat: -4.851200,
      lng: 136.821400,
      mcuPackage: 'Paket Port & Coastal Logistics Freeport'
    },
    {
      code: 'SITE-FMI-JKT',
      name: 'Freeport Indonesia Jakarta Headquarters',
      customerName: 'PT Freeport Indonesia',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      lat: -6.223400,
      lng: 106.826500,
      mcuPackage: 'Paket Executive & Engineering HQ Freeport'
    },

    // PT Amman Mineral Nusa Tenggara
    {
      code: 'SITE-AMNT-BTH',
      name: 'Batu Hijau Copper & Gold Mine',
      customerName: 'PT Amman Mineral Nusa Tenggara',
      provinceName: 'Nusa Tenggara Barat',
      cityName: 'Sumbawa Barat',
      lat: -8.960000,
      lng: 116.870000,
      mcuPackage: 'Paket Full Panel Pit & Plant Batu Hijau'
    },
    {
      code: 'SITE-AMNT-BNT',
      name: 'Benete Port & Smelter Terminal',
      customerName: 'PT Amman Mineral Nusa Tenggara',
      provinceName: 'Nusa Tenggara Barat',
      cityName: 'Sumbawa Barat',
      lat: -8.891200,
      lng: 116.741200,
      mcuPackage: 'Paket Smelter & Port Facility Amman'
    },
    {
      code: 'SITE-AMNT-MTR',
      name: 'Amman Mineral Mataram Regional Base',
      customerName: 'PT Amman Mineral Nusa Tenggara',
      provinceName: 'Nusa Tenggara Barat',
      cityName: 'Mataram',
      lat: -8.583300,
      lng: 116.116700,
      mcuPackage: 'Paket Liaison & Logistics Mataram Amman'
    },

    // PT United Tractors Tbk
    {
      code: 'SITE-MTB-TSL',
      name: 'Martabe Gold Mine',
      customerName: 'PT United Tractors Tbk',
      provinceName: 'Sumatera Utara',
      cityName: 'Tapanuli Selatan',
      lat: 1.527778,
      lng: 99.065556,
      mcuPackage: 'Paket Exploration & Gold Mining Martabe'
    },
    {
      code: 'SITE-UT-CKG',
      name: 'United Tractors Head Office Cakung',
      customerName: 'PT United Tractors Tbk',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Timur',
      lat: -6.185400,
      lng: 106.941200,
      mcuPackage: 'Paket Head Office & Central Plant UT'
    },
    {
      code: 'SITE-UT-BPN',
      name: 'UT Balikpapan Mining & Heavy Equipment Branch',
      customerName: 'PT United Tractors Tbk',
      provinceName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      lat: -1.238900,
      lng: 116.874100,
      mcuPackage: 'Paket Heavy Equipment Overhaul & Field Support UT'
    },
    {
      code: 'SITE-UT-SMD',
      name: 'UT Samarinda Branch Operations',
      customerName: 'PT United Tractors Tbk',
      provinceName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      lat: -0.512400,
      lng: 117.151200,
      mcuPackage: 'Paket Branch Operations & Customer Service UT'
    },
    {
      code: 'SITE-UT-PLM',
      name: 'UT Palembang Heavy Equipment Center',
      customerName: 'PT United Tractors Tbk',
      provinceName: 'Sumatera Selatan',
      cityName: 'Palembang',
      lat: -2.971200,
      lng: 104.731200,
      mcuPackage: 'Paket Regional Service & Warehouse UT'
    },

    // PT Pamapersada Nusantara
    {
      code: 'SITE-PAMA-BPN',
      name: 'PAMA Balikpapan Support Base',
      customerName: 'PT Pamapersada Nusantara',
      provinceName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      lat: -1.265386,
      lng: 116.831200,
      mcuPackage: 'Paket Heavy Equipment Plant & Logistics PAMA'
    },
    {
      code: 'SITE-PAMA-SGT',
      name: 'PAMA District Sangatta (KPC Site)',
      customerName: 'PT Pamapersada Nusantara',
      provinceName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      lat: 0.841200,
      lng: 117.581200,
      mcuPackage: 'Paket Pit Production & Heavy Mobile PAMA'
    },
    {
      code: 'SITE-PAMA-TJE',
      name: 'PAMA District Tanjung Enim (PTBA Site)',
      customerName: 'PT Pamapersada Nusantara',
      provinceName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      lat: -4.101200,
      lng: 103.784100,
      mcuPackage: 'Paket Mining Contractor Production PAMA'
    },
    {
      code: 'SITE-PAMA-JKT',
      name: 'PAMA Head Office Jakarta Rawamangun',
      customerName: 'PT Pamapersada Nusantara',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Timur',
      lat: -6.194500,
      lng: 106.891200,
      mcuPackage: 'Paket Corporate & Management PAMA'
    },
    {
      code: 'SITE-PAMA-KDC',
      name: 'PAMA District Kideco',
      customerName: 'PT Pamapersada Nusantara',
      provinceName: 'Kalimantan Timur',
      cityName: 'Paser',
      lat: -1.891200,
      lng: 115.912400,
      mcuPackage: 'Paket Mining Contractor Operation PAMA'
    },

    // PT Astra International
    {
      code: 'SITE-ASTRA-BKS',
      name: 'Astra Heavy Equipment Center Cikarang',
      customerName: 'PT Astra International',
      provinceName: 'Jawa Barat',
      cityName: 'Bekasi',
      lat: -6.301540,
      lng: 107.152340,
      mcuPackage: 'Paket Assembly & Technical Plant Astra OHS'
    },
    {
      code: 'SITE-ASTRA-JKT',
      name: 'Menara Astra Head Office Sudirman',
      customerName: 'PT Astra International',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Pusat',
      lat: -6.208800,
      lng: 106.821400,
      mcuPackage: 'Paket Corporate Executive & Management Astra'
    },
    {
      code: 'SITE-ASTRA-STR',
      name: 'Astra Motor & Fleet Center Sunter',
      customerName: 'PT Astra International',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Utara',
      lat: -6.134500,
      lng: 106.881200,
      mcuPackage: 'Paket Logistics & Manufacturing Plant Astra'
    },
    {
      code: 'SITE-ASTRA-BPN',
      name: 'Astra Balikpapan Regional Support',
      customerName: 'PT Astra International',
      provinceName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      lat: -1.251200,
      lng: 116.861200,
      mcuPackage: 'Paket Regional Service & Warehouse Astra'
    },

    // PT Telkom Indonesia
    {
      code: 'SITE-TLK-JKT',
      name: 'Telkom Landmark Tower Technology Center',
      customerName: 'PT Telkom Indonesia',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      lat: -6.229728,
      lng: 106.818320,
      mcuPackage: 'Paket Executive & Technology Specialist Telkom'
    },
    {
      code: 'SITE-TLK-GMP',
      name: 'Telkom Regional II Graha Merah Putih',
      customerName: 'PT Telkom Indonesia',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Pusat',
      lat: -6.182400,
      lng: 106.829100,
      mcuPackage: 'Paket Network & Operations Management Telkom'
    },
    {
      code: 'SITE-TLK-BPN',
      name: 'Telkom Witel Kaltim Balikpapan Hub',
      customerName: 'PT Telkom Indonesia',
      provinceName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      lat: -1.261200,
      lng: 116.837800,
      mcuPackage: 'Paket Field Engineering & Telecommunications Telkom'
    },
    {
      code: 'SITE-TLK-TNG',
      name: 'Telkom Integrated Data Center Serpong',
      customerName: 'PT Telkom Indonesia',
      provinceName: 'Banten',
      cityName: 'Tangerang',
      lat: -6.301200,
      lng: 106.671200,
      mcuPackage: 'Paket Data Center Infrastructure & Systems Telkom'
    },

    // PT Bank Mandiri
    {
      code: 'SITE-MDR-JKT',
      name: 'Plaza Mandiri Commercial & Operations',
      customerName: 'PT Bank Mandiri',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      lat: -6.227440,
      lng: 106.812230,
      mcuPackage: 'Paket Corporate & Financial Operations Mandiri'
    },
    {
      code: 'SITE-MDR-SDR',
      name: 'Bank Mandiri Smart Branch Sudirman',
      customerName: 'PT Bank Mandiri',
      provinceName: 'DKI Jakarta',
      cityName: 'Jakarta Pusat',
      lat: -6.211200,
      lng: 106.821400,
      mcuPackage: 'Paket Banking Specialist & Operations Mandiri'
    },
    {
      code: 'SITE-MDR-BPN',
      name: 'Bank Mandiri Region IX Kalimantan Hub',
      customerName: 'PT Bank Mandiri',
      provinceName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      lat: -1.271200,
      lng: 116.831500,
      mcuPackage: 'Paket Regional Commercial Banking Mandiri'
    },
    {
      code: 'SITE-MDR-PLM',
      name: 'Bank Mandiri Region II Sumatera Selatan Hub',
      customerName: 'PT Bank Mandiri',
      provinceName: 'Sumatera Selatan',
      cityName: 'Palembang',
      lat: -2.981200,
      lng: 104.758900,
      mcuPackage: 'Paket Regional Commercial Banking Mandiri'
    },
    {
      code: 'SITE-MDR-SBY',
      name: 'Bank Mandiri Surabaya Basuki Rahmat Hub',
      customerName: 'PT Bank Mandiri',
      provinceName: 'Jawa Timur',
      cityName: 'Surabaya',
      lat: -7.261200,
      lng: 112.741200,
      mcuPackage: 'Paket Regional Banking & Operations Mandiri'
    }
  ];

  const siteMap = new Map<string, any>();
  for (const s of sitesConfig) {
    const custId = customerMap.get(s.customerName) || (await prisma.masterCustomer.findFirst())!.id;
    const provId = provinceMap.get(s.provinceName) || (await prisma.masterProvince.findFirst())!.id;
    const cityId = cityMap.get(s.cityName) || (await prisma.masterCity.findFirst({ where: { provinceId: provId } }))!.id;

    let existingSite = await prisma.masterSite.findFirst({
      where: { OR: [{ code: s.code }, { name: s.name }] }
    });

    const payload = {
      code: s.code,
      name: s.name,
      customerId: custId,
      provinceId: provId,
      cityId: cityId,
      latitude: s.lat,
      longitude: s.lng,
      useSpecificSla: true,
      mcuPackage: s.mcuPackage
    };

    if (existingSite) {
      existingSite = await prisma.masterSite.update({
        where: { id: existingSite.id },
        data: payload
      });
    } else {
      existingSite = await prisma.masterSite.create({
        data: payload
      });
    }
    siteMap.set(s.name, existingSite);
  }

  // =========================================================================
  // 3. MASTER KLINIK REKANAN MCU (Medical Check Up)
  // =========================================================================
  console.log('🏥 3/9 Menyiapkan Master Data Klinik Rekanan MCU...');

  const clinicsConfig = [
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
      code: 'CLN-TRT-TBN',
      name: 'Klinik Tirta Medical Tambun Bekasi',
      provinceName: 'Jawa Barat',
      address: 'Ruko Blok AA 9 No. 1–2, Jl. Celebration Boulevard Kav. 1, Kel. Lambangjaya, Tambun Selatan, Bekasi, Jawa Barat 17510'
    },
    {
      code: 'CLN-PRD-BDG',
      name: 'Laboratorium Klinik Prodia Bandung',
      provinceName: 'Jawa Barat',
      address: 'Jl. Wastukencana No. 38, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40117'
    },
    {
      code: 'CLN-PRD-SBY',
      name: 'Laboratorium Klinik Prodia Surabaya',
      provinceName: 'Jawa Timur',
      address: 'Jl. Diponegoro No. 149-151, Darmo, Wonokromo, Kota Surabaya, Jawa Timur 60241'
    }
  ];

  for (const cln of clinicsConfig) {
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
  // 4. MASTER DEPARTMENTS & POSITIONS
  // =========================================================================
  console.log('⛏️ 4/9 Menyiapkan Departemen & Posisi Kerja Terpadu...');

  const departmentsList = [
    { code: 'DEPT-MINE-OPS', name: 'Mining Operations & Production' },
    { code: 'DEPT-MINE-ENG', name: 'Mine Engineering & Planning' },
    { code: 'DEPT-PLANT-HE', name: 'Plant & Heavy Equipment Maintenance' },
    { code: 'DEPT-MINE-HSE', name: 'Health, Safety & Environment (HSE)' },
    { code: 'DEPT-GEOLOGY', name: 'Geology & Exploration' },
    { code: 'DEPT-LOG-SCM', name: 'Mining Supply Chain & Fuel Logistics' },
    { code: 'DEPT-MINE-HR', name: 'Human Resources & Industrial Relations' },
    { code: 'DEPT-IT-DEV', name: 'Information Technology (IT)' },
    { code: 'DEPT-FIN-ACC', name: 'Finance & Accounting' }
  ];

  const deptMap = new Map<string, string>();
  for (const d of departmentsList) {
    let dept = await prisma.masterDepartment.findFirst({
      where: { OR: [{ name: d.name }, { code: d.code }] }
    });
    if (!dept) {
      dept = await prisma.masterDepartment.create({ data: d });
    }
    deptMap.set(d.name, dept.id);
  }

  const positionsList = [
    { code: 'POS-EXC-2000', name: 'Operator Excavator PC2000 / PC1250' },
    { code: 'POS-DT-HD785', name: 'Operator Dump Truck Heavy Duty HD785' },
    { code: 'POS-SURVEYOR', name: 'Mine Surveyor & Geodetic Specialist' },
    { code: 'POS-HSE-OFFICER', name: 'HSE Mining Inspector (Pengawas K3 Tambang)' },
    { code: 'POS-MECH-HEAVY', name: 'Heavy Equipment Mechanic & Fitter' },
    { code: 'POS-SUPV-POP', name: 'Mining Production Supervisor (POP Certified)' },
    { code: 'POS-GEOLOGIST', name: 'Mine Geologist & Exploration Modeler' },
    { code: 'POS-AUTO-ELEC', name: 'Auto Electrician Heavy Duty Fleet' },
    { code: 'POS-DRILL-BLAST', name: 'Drill & Blast Specialist Engineer' },
    { code: 'POS-DISPATCH', name: 'Mine Fleet Dispatcher & Controller' },
    { code: 'POS-SOFT-DEV', name: 'Senior Fullstack Software Engineer' },
    { code: 'POS-FIN-ANALYST', name: 'Financial & Accounting Analyst' },
    { code: 'POS-HR-MGR', name: 'HR Manager' }
  ];

  const posMap = new Map<string, string>();
  for (const p of positionsList) {
    let pos = await prisma.masterPosition.findFirst({
      where: { OR: [{ name: p.name }, { code: p.code }] }
    });
    if (!pos) {
      pos = await prisma.masterPosition.create({ data: p });
    }
    posMap.set(p.name, pos.id);
  }

  // =========================================================================
  // 5. MASTER INSTITUSI (Perguruan Tinggi, BLK, LPK, SLTA)
  // =========================================================================
  console.log('🎓 5/9 Menyiapkan Institusi Pendidikan, BLK & LPK...');

  const institutesList = [
    {
      code: 'INS-MINE-01',
      name: 'Politeknik Negeri Samarinda (Polnes)',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Samarinda',
      address: 'Jl. Samratulangi, Samarinda'
    },
    {
      code: 'INS-MINE-02',
      name: 'Politeknik Negeri Balikpapan (Poltekba)',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Balikpapan',
      address: 'Jl. Soekarno Hatta KM.8, Balikpapan'
    },
    {
      code: 'INS-MINE-03',
      name: 'UPN Veteran Yogyakarta',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'DI Yogyakarta',
      city: 'Sleman',
      address: 'Jl. SWK 104 Condongcatur, Sleman'
    },
    {
      code: 'INS-MINE-04',
      name: 'Institut Teknologi Bandung',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'Jawa Barat',
      city: 'Bandung',
      address: 'Jl. Ganesa No.10, Bandung'
    },
    {
      code: 'INS-MINE-05',
      name: 'Universitas Indonesia',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'DKI Jakarta',
      city: 'Depok',
      address: 'Jl. Margonda Raya, Beji, Depok'
    },
    {
      code: 'INS-MINE-06',
      name: 'Universitas Hasanuddin',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'Sulawesi Selatan',
      city: 'Makassar',
      address: 'Jl. Perintis Kemerdekaan KM.10, Tamalanrea, Makassar'
    },
    {
      code: 'INS-MINE-07',
      name: 'Universitas Sriwijaya',
      type: 'Perguruan Tinggi',
      status: 'Negeri',
      province: 'Sumatera Selatan',
      city: 'Palembang',
      address: 'Jl. Srijaya Negara, Bukit Besar, Palembang'
    },
    {
      code: 'INS-MINE-08',
      name: 'BLK Samarinda',
      type: 'BLK',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Samarinda',
      address: 'Jl. Harmonika No.1, Sidomulyo, Samarinda'
    },
    {
      code: 'INS-MINE-09',
      name: 'BLK Balikpapan',
      type: 'BLK',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Balikpapan',
      address: 'Jl. Syarifuddin Yoes, Sepinggan, Balikpapan'
    },
    {
      code: 'INS-MINE-10',
      name: 'BPVP Samarinda',
      type: 'BPVP',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Samarinda',
      address: 'Jl. Bung Tomo No. 1, Sungai Keledang, Samarinda'
    },
    {
      code: 'INS-MINE-11',
      name: 'LPK Alat Berat Borneo Mandiri',
      type: 'LPK',
      status: 'Swasta',
      province: 'Kalimantan Timur',
      city: 'Kutai Timur',
      address: 'Jl. Poros Sangatta - Bontang KM.3, Sangatta'
    },
    {
      code: 'INS-MINE-12',
      name: 'LPK Welder & Mekanik Mandiri',
      type: 'LPK',
      status: 'Swasta',
      province: 'Kalimantan Selatan',
      city: 'Tanah Bumbu',
      address: 'Jl. Transmigrasi KM.4, Batulicin'
    },
    {
      code: 'INS-MINE-13',
      name: 'SMKN 1 Sangatta Utara',
      type: 'SLTA',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Kutai Timur',
      address: 'Jl. Pendidikan, Sangatta Utara'
    },
    {
      code: 'INS-MINE-14',
      name: 'SMKN 1 Balikpapan',
      type: 'SLTA',
      status: 'Negeri',
      province: 'Kalimantan Timur',
      city: 'Balikpapan',
      address: 'Jl. Marsma Iswahyudi No.1, Balikpapan'
    },
    {
      code: 'INS-MINE-15',
      name: 'SMKN 2 Muara Enim',
      type: 'SLTA',
      status: 'Negeri',
      province: 'Sumatera Selatan',
      city: 'Muara Enim',
      address: 'Jl. Mayor Tjik Agus Kiemas, Muara Enim'
    }
  ];

  for (const ins of institutesList) {
    let existingIns = await prisma.masterInstitute.findFirst({
      where: { OR: [{ code: ins.code }, { name: ins.name }] }
    });
    if (!existingIns) {
      await prisma.masterInstitute.create({ data: ins });
    }
  }

  // =========================================================================
  // 6. PIPELINE STAGES & SITE SLA CONFIGURATION
  // =========================================================================
  console.log('⏱️ 6/9 Mengonfigurasi Tahapan Rekrutmen (Pipeline Stages) & SLA...');

  const pipelineStagesList = [
    { id: 'stage_1', name: 'CV Screening', orderIndex: 1, slaDays: 3, reminderDays: 1 },
    { id: 'stage_2', name: 'Interview HR', orderIndex: 2, slaDays: 5, reminderDays: 1 },
    { id: 'stage_3', name: 'Psikotes', orderIndex: 3, slaDays: 7, reminderDays: 2 },
    { id: 'stage_4', name: 'Technical Test', orderIndex: 4, slaDays: 5, reminderDays: 1 },
    { id: 'stage_5', name: 'Interview User', orderIndex: 5, slaDays: 5, reminderDays: 1 },
    { id: 'stage_6', name: 'Offering', orderIndex: 6, slaDays: 3, reminderDays: 1 },
    { id: 'stage_7', name: 'MCU', orderIndex: 7, slaDays: 5, reminderDays: 1 },
    { id: 'stage_8', name: 'Training', orderIndex: 8, slaDays: 0, reminderDays: 0 },
    { id: 'stage_9', name: 'Induction', orderIndex: 9, slaDays: 0, reminderDays: 0 },
    { id: 'stage_10', name: 'PKWT', orderIndex: 10, slaDays: 0, reminderDays: 0 }
  ];

  for (const st of pipelineStagesList) {
    let stage = await prisma.masterPipelineStage.findUnique({
      where: { id: st.id }
    });
    if (!stage) {
      await prisma.masterPipelineStage.create({ data: st });
    } else {
      await prisma.masterPipelineStage.update({
        where: { id: st.id },
        data: {
          name: st.name,
          orderIndex: st.orderIndex,
          slaDays: st.slaDays,
          reminderDays: st.reminderDays
        }
      });
    }
  }

  const allStages = await prisma.masterPipelineStage.findMany({
    orderBy: { orderIndex: 'asc' }
  });

  // Hubungkan SiteSla untuk seluruh site
  for (const site of Array.from(siteMap.values())) {
    for (const stage of allStages) {
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
  // 7. SEED LOWONGAN PEKERJAAN (Job Openings)
  // =========================================================================
  console.log('📋 7/9 Membuat Lowongan Pekerjaan Lintas Perusahaan & Status...');

  const jobDefinitions: any[] = [
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
      tanggalMasuk: inCurrentMonth(1),
      publishedDate: inCurrentMonth(3),
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
      jumlahPermintaan: 4,
      statusPermintaan: 'Baru',
      tanggalMasuk: inCurrentMonth(3),
      publishedDate: inCurrentMonth(5),
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
      jumlahPermintaan: 5,
      statusPermintaan: 'Replacement',
      tanggalMasuk: inCurrentMonth(5),
      publishedDate: inCurrentMonth(7),
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
      tanggalMasuk: inCurrentMonth(2),
      publishedDate: inCurrentMonth(4),
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
      jumlahPermintaan: 3,
      statusPermintaan: 'Baru',
      tanggalMasuk: inCurrentMonth(4),
      publishedDate: inCurrentMonth(6),
      kualifikasi: 'S1 Teknik Pertambangan / Geologi. Wajib memiliki sertifikat Pengawas Operasional Pertama (POP) resmi dari Dirjen Minerba ESDM, pengalaman min. 4 tahun sebagai Foreman/Supervisor pit.',
      benefit: 'Gaji Spesialis, Tunjangan Jabatan & Roster 10:2, Tiket Penerbangan Domestik PP, Fasilitas Mess Single.'
    },
    {
      noRegistrasi: 'REQ/MINE-LOG/PAMA/2026/006',
      posName: 'Mine Fleet Dispatcher & Controller',
      deptName: 'Mining Supply Chain & Fuel Logistics',
      siteName: 'PAMA Balikpapan Support Base',
      custName: 'PT Pamapersada Nusantara',
      provName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      status: JobStatus.ACTIVE,
      isPriority: false,
      requiresBnsp: false,
      requiresSkillTest: true,
      jumlahPermintaan: 4,
      statusPermintaan: 'Baru',
      tanggalMasuk: inCurrentMonth(6),
      publishedDate: inCurrentMonth(8),
      kualifikasi: 'D3/S1 Segala Jurusan / Teknik Industri. Berpengalaman dalam sistem dispatch armada tambang Modular Mining Dispatch / Jigsaw, komunikasi radio pit prima.',
      benefit: 'Gaji Pokok, Tunjangan Shift Pit, Asuransi Rawat Inap & Jalan, Roster 6:2.'
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
      tanggalMasuk: inPrevMonth(5),
      publishedDate: inPrevMonth(10),
      kualifikasi: 'Spesialis elektrikal alat berat Caterpillar 793 / Komatsu 930E, memahami can-bus, AC system, wiring harness.',
      benefit: 'Gaji Pokok Tinggi, Fasilitas Camp Lengkap (Gym, Bioskop, Sport Hall), Roster 6:2.'
    },
    {
      noRegistrasi: 'REQ/GEOLOGY/MTB/2026/008',
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
      tanggalMasuk: inPrevMonth(1),
      publishedDate: inPrevMonth(4),
      kualifikasi: 'S1 Teknik Geologi, mahir Leapfrog Geo, Datamine, QAQC grade control bijih emas epithermal.',
      benefit: 'Paket Kompensasi Standar Perusahaan Multinasional.'
    },
    {
      noRegistrasi: 'REQ/MINE-OPS/FMI/2026/009',
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
      tanggalMasuk: inCurrentMonth(10),
      publishedDate: null,
      kualifikasi: 'S1 Teknik Pertambangan, sertifikat Kartu Izin Meledakkan (KIM) Madya/Utama, spesialis pit wall control blasting.',
      benefit: 'Paket High Altitude Grasberg Allowance, Roster 5:2.'
    },
    {
      noRegistrasi: 'REQ/PLANT-ASTRA/2026/010',
      posName: 'Heavy Equipment Mechanic & Fitter',
      deptName: 'Plant & Heavy Equipment Maintenance',
      siteName: 'Astra Heavy Equipment Center Cikarang',
      custName: 'PT Astra International',
      provName: 'Jawa Barat',
      cityName: 'Bekasi',
      status: JobStatus.ACTIVE,
      isPriority: false,
      requiresBnsp: false,
      requiresSkillTest: true,
      jumlahPermintaan: 4,
      statusPermintaan: 'Baru',
      tanggalMasuk: inCurrentMonth(2),
      publishedDate: inCurrentMonth(5),
      kualifikasi: 'SMK/D3 Otomotif atau Teknik Mesin. Terbiasa perawatan rutin engine diesel industri dan alat berat.',
      benefit: 'Gaji Pokok Standar UMK Bekasi, Tunjangan Transport, Fasilitas BPJS Lengkap.'
    },
    {
      noRegistrasi: 'REQ/IT-TELKOM/2026/011',
      posName: 'Senior Fullstack Software Engineer',
      deptName: 'Information Technology (IT)',
      siteName: 'Telkom Landmark Tower Technology Center',
      custName: 'PT Telkom Indonesia',
      provName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      status: JobStatus.ACTIVE,
      isPriority: true,
      requiresBnsp: false,
      requiresSkillTest: true,
      jumlahPermintaan: 3,
      statusPermintaan: 'Baru',
      tanggalMasuk: inCurrentMonth(2),
      publishedDate: inCurrentMonth(4),
      kualifikasi: 'S1 Teknik Informatika / Sistem Informasi. Berpengalaman membangun aplikasi enterprise dengan React, Next.js, Node.js, dan PostgreSQL.',
      benefit: 'Gaji Kompetitif, Tunjangan Kesehatan Komprehensif, Fleksibilitas Hybrid Working.'
    },
    {
      noRegistrasi: 'REQ/FIN-MANDIRI/2026/012',
      posName: 'Financial & Accounting Analyst',
      deptName: 'Finance & Accounting',
      siteName: 'Plaza Mandiri Commercial & Operations',
      custName: 'PT Bank Mandiri',
      provName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      status: JobStatus.ACTIVE,
      isPriority: false,
      requiresBnsp: false,
      requiresSkillTest: false,
      jumlahPermintaan: 2,
      statusPermintaan: 'Baru',
      tanggalMasuk: inCurrentMonth(3),
      publishedDate: inCurrentMonth(6),
      kualifikasi: 'S1 Akuntansi / Keuangan. Menguasai financial modeling, perpajakan Brevet A/B, dan penyusunan laporan keuangan audit.',
      benefit: 'Gaji Pokok, Bonus Kinerja Tahunan, Asuransi Kesehatan Keluarga.'
    }
  ];

  const createdJobs: any[] = [];

  for (const j of jobDefinitions) {
    const posId = posMap.get(j.posName) || null;
    const deptId = deptMap.get(j.deptName) || null;
    const site = siteMap.get(j.siteName)!;
    const custId = customerMap.get(j.custName)!;
    const provId = provinceMap.get(j.provName)!;
    const cityId = cityMap.get(j.cityName)!;

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
      for (let i = 0; i < allStages.length; i++) {
        const stage = allStages[i];
        const deadline = daysAhead(stage.slaDays);

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

        currentStart = new Date(deadline.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    createdJobs.push(job);
  }

  // =========================================================================
  // 8. SEED AKUN ADMIN & REKRUTER
  // =========================================================================
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@example.com',
      name: 'Super Administrator',
      password: hashedPassword,
      role: UserRole.ADMIN,
      department: 'Corporate HR'
    }
  });

  await prisma.user.upsert({
    where: { email: 'recruiter.mining@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'recruiter.mining@example.com',
      name: 'Rian Pratama, S.Psi (Lead Recruiter)',
      password: hashedPassword,
      role: UserRole.RECRUITER,
      department: 'Talent Acquisition'
    }
  });

  // =========================================================================
  // 9. DATA KANDIDAT LENGKAP & BERELASI (~36 Kandidat)
  // =========================================================================
  console.log('👷 8/9 Menyiapkan Profil Kandidat & Lamaran yang Saling Berelasi...');

  // Helper membuat link dokumen pelengkap
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

  const candidateDataset: any[] = [
    // -------------------------------------------------------------------------
    // KELOMPOK 1: HIRED CANDIDATES (6 orang) - Lulus seluruh seleksi hingga PKWT
    // Tersebar di Stage 8 (Training), Stage 9 (Induction), dan Stage 10 (PKWT)
    // -------------------------------------------------------------------------
    {
      name: 'Ahmad Fauzi Nurcahyo',
      email: 'ahmad.fauzi@example.com',
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
      currentAddress: 'Jl. Pemuda No. 45 RT 12, Samarinda, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'SIO Operator Excavator Kelas 1 & BNSP Alat Berat',
      jobIndex: 0, // KPC Excavator
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_10', // PKWT
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true, skema: 'Operator Alat Berat (Excavator PC2000)', certNumber: 'BNSP-OPR-2024-8849201', issueDate: '2024-02-10', expiryDate: '2027-02-10' },
        hrInterview: { result: 'Lulus', date: daysAgo(18).toISOString().split('T')[0], feedback: 'Kandidat memiliki kematangan emosi yang sangat baik, berpengalaman 5 tahun di pit KPC.' },
        psikotes: { result: 'Sangat Disarankan', date: daysAgo(14).toISOString().split('T')[0] },
        testSkill: { date: daysAgo(11).toISOString().split('T')[0], resultFile: 'skill_eval_pc2000.pdf' },
        userInterview: { result: 'Lulus', date: daysAgo(8).toISOString().split('T')[0], feedback: 'Superintendent menyetujui, siap penempatan pit Sangatta.' },
        offeringLetter: { date: daysAgo(5).toISOString().split('T')[0], file: 'signed_ol_fauzi.pdf' },
        mcu: { date: daysAgo(3).toISOString().split('T')[0], resultStatus: 'FIT TO WORK (Category A)' },
        bast: { status: 'LOKAL', nrp: 'KPC-26-8801', start: inCurrentMonth(1).toISOString().split('T')[0], end: daysAhead(365).toISOString().split('T')[0], validasi: 'Valid', link: 'https://imms.mining.id/bast/KPC-26-8801' }
      }
    },
    {
      name: 'Bambang Tri Hermawan',
      email: 'bambang.hermawan@example.com',
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
      currentAddress: 'Jl. Bujangga No. 88, Tanjung Redeb, Berau, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'UPN Veteran Yogyakarta',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Sertifikat Juru Ukur Tambang (BNSP) & Drone Mapping',
      jobIndex: 1, // Berau Coal Surveyor
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_10', // PKWT
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true, skema: 'Juru Ukur Tambang (Mine Surveyor)', certNumber: 'BNSP-SRV-2023-11204', issueDate: '2023-08-15', expiryDate: '2026-08-15' },
        hrInterview: { result: 'Lulus', date: daysAgo(17).toISOString().split('T')[0], feedback: 'Kandidat menguasai GPS RTK dan software Minescape.' },
        psikotes: { result: 'Disarankan', date: daysAgo(13).toISOString().split('T')[0] },
        testSkill: { date: daysAgo(10).toISOString().split('T')[0], resultFile: 'survey_accuracy_report.pdf' },
        userInterview: { result: 'Lulus', date: daysAgo(7).toISOString().split('T')[0], feedback: 'Sangat cocok untuk tim pemetaan Pit Lati Berau.' },
        offeringLetter: { date: daysAgo(4).toISOString().split('T')[0], file: 'signed_ol_bambang.pdf' },
        mcu: { date: daysAgo(2).toISOString().split('T')[0], resultStatus: 'FIT TO WORK (Category A)' },
        bast: { status: 'LOKAL', nrp: 'BRC-26-4412', start: inCurrentMonth(1).toISOString().split('T')[0], end: daysAhead(365).toISOString().split('T')[0], validasi: 'Valid', link: 'https://imms.mining.id/bast/BRC-26-4412' }
      }
    },
    {
      name: 'Dian Ratna Sari',
      email: 'dian.ratnasari@example.com',
      nik: '7206014407940002',
      kk: '7206012010140003',
      birthPlace: 'Palu',
      birthDate: new Date('1994-07-04'),
      gender: 'Perempuan',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081345678901',
      emergencyContact: '081345678902 (H. Mansyur - Ayah)',
      domicileAddress: 'Jl. Garuda No. 21, Bahodopi',
      currentAddress: 'Jl. Garuda No. 21, Bahodopi, Morowali, Sulawesi Tengah',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Universitas Hasanuddin',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'Ahli K3 Umum Kemenaker & Pengawas Operasional Pertama (POP)',
      jobIndex: 2, // IMIP HSE Inspector
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_9', // Induction
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true, skema: 'Ahli K3 Umum & POP ESDM', certNumber: 'BNSP-POP-2024-55102', issueDate: '2024-01-20', expiryDate: '2027-01-20' },
        hrInterview: { result: 'Lulus', date: daysAgo(16).toISOString().split('T')[0], feedback: 'Karakter asertif, rekam jejak audit SMK3 sangat baik.' },
        psikotes: { result: 'Disarankan', date: daysAgo(12).toISOString().split('T')[0] },
        testSkill: { date: daysAgo(9).toISOString().split('T')[0], resultFile: 'jsa_inspection_report.pdf' },
        userInterview: { result: 'Lulus', date: daysAgo(6).toISOString().split('T')[0] },
        offeringLetter: { date: daysAgo(3).toISOString().split('T')[0], file: 'signed_ol_dian.pdf' },
        mcu: { date: daysAgo(1).toISOString().split('T')[0], resultStatus: 'FIT TO WORK (Category A)' },
        bast: { status: 'LOKAL', nrp: 'IMP-26-9021', start: inCurrentMonth(1).toISOString().split('T')[0], end: daysAhead(365).toISOString().split('T')[0], validasi: 'Valid', link: 'https://imms.mining.id/bast/IMP-26-9021' }
      }
    },
    {
      name: 'Eko Wahyudi Prasetyo',
      email: 'eko.prasetyo@example.com',
      nik: '1603021811910005',
      kk: '1603022506160004',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1991-11-18'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '085278901234',
      emergencyContact: '085278901235 (Nurul - Istri)',
      domicileAddress: 'Jl. Lintas Prabumulih - Muara Enim KM.12',
      currentAddress: 'Tanjung Enim, Muara Enim, Sumatera Selatan',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Universitas Sriwijaya',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Sertifikasi BNSP Mekanik Alat Berat & Troubleshooting Hidrolik',
      jobIndex: 3, // PTBA Mechanic
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_8', // Training
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true, skema: 'Senior Mechanical Fitter', certNumber: 'BNSP-MEC-2023-99120', issueDate: '2023-11-10', expiryDate: '2026-11-10' },
        hrInterview: { result: 'Lulus', date: daysAgo(15).toISOString().split('T')[0] },
        psikotes: { result: 'Disarankan', date: daysAgo(11).toISOString().split('T')[0] },
        testSkill: { date: daysAgo(8).toISOString().split('T')[0] },
        userInterview: { result: 'Lulus', date: daysAgo(5).toISOString().split('T')[0] },
        offeringLetter: { date: daysAgo(2).toISOString().split('T')[0] },
        mcu: { date: daysAgo(1).toISOString().split('T')[0], resultStatus: 'FIT TO WORK (Category A)' },
        bast: { status: 'LOKAL', nrp: 'PTBA-26-1189', start: inCurrentMonth(1).toISOString().split('T')[0], end: daysAhead(365).toISOString().split('T')[0], validasi: 'Valid', link: 'https://imms.mining.id/bast/PTBA-26-1189' }
      }
    },
    {
      name: 'Rizky Alamsyah Pratama',
      email: 'rizky.alamsyah@example.com',
      nik: '6471011409950001',
      kk: '6471012002160002',
      birthPlace: 'Balikpapan',
      birthDate: new Date('1995-09-14'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081299887766',
      emergencyContact: '081299887767 (Ibu Rahmawati)',
      domicileAddress: 'Jl. MT Haryono No. 102, Balikpapan',
      currentAddress: 'Jl. MT Haryono No. 102, Balikpapan, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Politeknik Negeri Balikpapan (Poltekba)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Fleet Dispatcher & Radio Communication Certificate',
      jobIndex: 5, // PAMA Dispatcher
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_9', // Induction
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true, skema: 'Fleet Dispatcher Controller', certNumber: 'BNSP-DSP-2024-33120', issueDate: '2024-03-01', expiryDate: '2027-03-01' },
        hrInterview: { result: 'Lulus', date: daysAgo(14).toISOString().split('T')[0] },
        psikotes: { result: 'Disarankan', date: daysAgo(10).toISOString().split('T')[0] },
        testSkill: { date: daysAgo(7).toISOString().split('T')[0] },
        userInterview: { result: 'Lulus', date: daysAgo(4).toISOString().split('T')[0] },
        offeringLetter: { date: daysAgo(2).toISOString().split('T')[0] },
        mcu: { date: daysAgo(1).toISOString().split('T')[0], resultStatus: 'FIT TO WORK (Category A)' },
        bast: { status: 'LOKAL', nrp: 'PAMA-26-5501', start: inCurrentMonth(1).toISOString().split('T')[0], end: daysAhead(365).toISOString().split('T')[0], validasi: 'Valid', link: 'https://imms.mining.id/bast/PAMA-26-5501' }
      }
    },
    {
      name: 'Hendrikus Papare',
      email: 'hendrikus.papare@example.com',
      nik: '9109012304930007',
      kk: '9109011108150004',
      birthPlace: 'Timika',
      birthDate: new Date('1993-04-23'),
      gender: 'Laki-laki',
      religion: 'Kristen',
      maritalStatus: 'Menikah',
      whatsapp: '082233445566',
      emergencyContact: '082233445567 (Maria Papare - Istri)',
      domicileAddress: 'Jl. Kuala Kencana KM.8, Timika',
      currentAddress: 'Kuala Kencana, Mimika, Papua Tengah',
      provName: 'Papua Tengah',
      cityName: 'Mimika',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Balikpapan',
      certName: 'SIO Operator Dump Truck CAT 793 & BNSP Alat Berat',
      jobIndex: 0, // KPC Excavator/Heavy
      status: ApplicationStatus.HIRED,
      currentStageId: 'stage_8', // Training
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        bnspValidation: { isApproved: true, skema: 'Operator Dump Truck Heavy Duty', certNumber: 'BNSP-DT-2023-77219', issueDate: '2023-09-12', expiryDate: '2026-09-12' },
        hrInterview: { result: 'Lulus', date: daysAgo(16).toISOString().split('T')[0] },
        psikotes: { result: 'Disarankan', date: daysAgo(12).toISOString().split('T')[0] },
        testSkill: { date: daysAgo(9).toISOString().split('T')[0] },
        userInterview: { result: 'Lulus', date: daysAgo(6).toISOString().split('T')[0] },
        offeringLetter: { date: daysAgo(3).toISOString().split('T')[0] },
        mcu: { date: daysAgo(1).toISOString().split('T')[0], resultStatus: 'FIT TO WORK (Category A)' },
        bast: { status: 'LOKAL', nrp: 'KPC-26-8802', start: inCurrentMonth(1).toISOString().split('T')[0], end: daysAhead(365).toISOString().split('T')[0], validasi: 'Valid', link: 'https://imms.mining.id/bast/KPC-26-8802' }
      }
    },

    // -------------------------------------------------------------------------
    // KELOMPOK 2: ACTIVE ON PROCESS CANDIDATES (16 orang)
    // Tersebar merata di Stage 1 s/d Stage 7
    // -------------------------------------------------------------------------
    // STAGE 7: MCU (3 orang) -> Siap untuk Batch MCU Document Generator
    {
      name: 'Fajar Nugraha Saputra',
      email: 'fajar.nugraha@example.com',
      nik: '6402011003960002',
      kk: '6402011505180001',
      birthPlace: 'Tenggarong',
      birthDate: new Date('1996-03-10'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567801',
      emergencyContact: '081234567802 (H. Supardi - Ayah)',
      domicileAddress: 'Jl. Pesut No. 14, Tenggarong',
      currentAddress: 'Kutai Kartanegara, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Kartanegara',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Operator Excavator PC2000 Sertifikasi BNSP',
      jobIndex: 0, // KPC Excavator
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_7', // MCU
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        offeringLetter: { date: daysAgo(3).toISOString().split('T')[0] },
        mcu: { date: inCurrentMonth(20).toISOString().split('T')[0], resultStatus: 'Menunggu Pemeriksaan Lab' }
      }
    },
    {
      name: 'Galih Chandra Kusuma',
      email: 'galih.chandra@example.com',
      nik: '6404022204940003',
      kk: '6404021208170002',
      birthPlace: 'Bontang',
      birthDate: new Date('1994-04-22'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567803',
      emergencyContact: '081234567804 (Dewi - Istri)',
      domicileAddress: 'Jl. MT Haryono No. 55, Bontang Utara',
      currentAddress: 'Bontang, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Bontang',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'UPN Veteran Yogyakarta',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Surveyor Geodetik & Drone RTK BNSP',
      jobIndex: 1, // Berau Coal Surveyor
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_7', // MCU
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        offeringLetter: { date: daysAgo(2).toISOString().split('T')[0] },
        mcu: { date: inCurrentMonth(21).toISOString().split('T')[0], resultStatus: 'Jadwal MCU Ditentukan' }
      }
    },
    {
      name: 'Hadi Suryanto',
      email: 'hadi.suryanto@example.com',
      nik: '1604011508930004',
      kk: '1604012003160003',
      birthPlace: 'Lahat',
      birthDate: new Date('1993-08-15'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567805',
      emergencyContact: '081234567806 (Sri - Istri)',
      domicileAddress: 'Jl. Veteran No. 34, Lahat',
      currentAddress: 'Lahat, Sumatera Selatan',
      provName: 'Sumatera Selatan',
      cityName: 'Lahat',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 2 Muara Enim',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Mekanik Engine Komatsu HD785',
      jobIndex: 3, // PTBA Mechanic
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_7', // MCU
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        offeringLetter: { date: daysAgo(1).toISOString().split('T')[0] },
        mcu: { date: inCurrentMonth(22).toISOString().split('T')[0], resultStatus: 'Penerbitan Surat Pengantar' }
      }
    },

    // STAGE 6: OFFERING (2 orang) -> Siap untuk Offering Letter Generator
    {
      name: 'Indra Gunawan',
      email: 'indra.gunawan@example.com',
      nik: '7206021901920005',
      kk: '7206021104150004',
      birthPlace: 'Luwuk',
      birthDate: new Date('1992-01-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567807',
      emergencyContact: '081234567808 (Rina - Istri)',
      domicileAddress: 'Jl. Trans Sulawesi KM.5, Bahodopi',
      currentAddress: 'Bahodopi, Morowali, Sulawesi Tengah',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Universitas Hasanuddin',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'Pengawas Operasional Pertama (POP) ESDM',
      jobIndex: 2, // IMIP HSE Inspector
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_6', // Offering
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        userInterview: { result: 'Lulus', date: daysAgo(2).toISOString().split('T')[0], feedback: 'Kualifikasi sangat sesuai standar site Morowali.' }
      }
    },
    {
      name: 'Joko Susilo',
      email: 'joko.susilo@example.com',
      nik: '8202011209930006',
      kk: '8202011802160005',
      birthPlace: 'Weda',
      birthDate: new Date('1993-09-12'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567809',
      emergencyContact: '081234567810 (Siti - Istri)',
      domicileAddress: 'Desa Lelilef Sawai, Weda Tengah',
      currentAddress: 'Halmahera Tengah, Maluku Utara',
      provName: 'Maluku Utara',
      cityName: 'Halmahera Tengah',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Foreman Produksi Tambang Nikel',
      jobIndex: 4, // IWIP Supervisor
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_6', // Offering
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        userInterview: { result: 'Lulus', date: daysAgo(3).toISOString().split('T')[0], feedback: 'Disetujui Superintendent Pit Weda Bay.' }
      }
    },

    // STAGE 5: INTERVIEW USER (3 orang) -> Jadwal ada di Kalender & Dashboard Interview
    {
      name: 'Kurniawan Dwi Santoso',
      email: 'kurniawan.dwi@example.com',
      nik: '6401051706950007',
      kk: '6401051909180006',
      birthPlace: 'Sangatta',
      birthDate: new Date('1995-06-17'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567811',
      emergencyContact: '081234567812 (Bambang - Kakak)',
      domicileAddress: 'Jl. Poros Kabo Jaya, Sangatta Utara',
      currentAddress: 'Kutai Timur, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Operator Excavator PC1250 BNSP',
      jobIndex: 0, // KPC Excavator
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_5', // Interview User
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        userInterview: { date: daysAhead(2).toISOString().split('T')[0], link: 'Zoom Meeting ID: 884 9021 3412', interviewer: 'Ir. Budi Santoso, ST., IPM (Mining Superintendent)' }
      }
    },
    {
      name: 'Lukman Hakim',
      email: 'lukman.hakim@example.com',
      nik: '6403072010920008',
      kk: '6403071101150007',
      birthPlace: 'Tanjung Redeb',
      birthDate: new Date('1992-10-20'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567813',
      emergencyContact: '081234567814 (Fatimah - Istri)',
      domicileAddress: 'Jl. Raja Alam II No. 19, Rinding, Teluk Bayur',
      currentAddress: 'Berau, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Juru Ukur Tambang Terdaftar Minerba',
      jobIndex: 1, // Berau Coal Surveyor
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_5', // Interview User
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        userInterview: { date: daysAhead(3).toISOString().split('T')[0], link: 'Meeting Room Pit Office Berau', interviewer: 'Superintendent Engineering Berau' }
      }
    },
    {
      name: 'Muhammad Arif Wibowo',
      email: 'arif.wibowo@example.com',
      nik: '3275011402940009',
      kk: '3275011804170008',
      birthPlace: 'Bekasi',
      birthDate: new Date('1994-02-14'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567815',
      emergencyContact: '081234567816 (H. Wibowo - Ayah)',
      domicileAddress: 'Jl. Boulevard Hijau Blok B No. 12, Harapan Indah',
      currentAddress: 'Bekasi, Jawa Barat',
      provName: 'Jawa Barat',
      cityName: 'Bekasi',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Balikpapan',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Balikpapan',
      certName: 'Mekanik Heavy Duty Diesel Engine',
      jobIndex: 9, // Astra Cikarang
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_5', // Interview User
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        userInterview: { date: daysAhead(1).toISOString().split('T')[0], link: 'Workshop Astra Cikarang', interviewer: 'Head of Technical Service Astra' }
      }
    },

    // STAGE 4: TECHNICAL TEST (2 orang)
    {
      name: 'Nugroho Adi Prasetya',
      email: 'nugroho.adi@example.com',
      nik: '6471021808940010',
      kk: '6471022109170009',
      birthPlace: 'Balikpapan',
      birthDate: new Date('1994-08-18'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567817',
      emergencyContact: '081234567818 (Ratna - Istri)',
      domicileAddress: 'Jl. Ruhui Rahayu No. 88, Ring Road Balikpapan',
      currentAddress: 'Balikpapan, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Politeknik Negeri Balikpapan (Poltekba)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Sertifikasi Dispatcher & GPS Fleet',
      jobIndex: 5, // PAMA Dispatcher
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_4', // Technical Test
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        testSkill: { date: daysAhead(1).toISOString().split('T')[0], testType: 'Simulasi Dispatch & Jigsaw System' }
      }
    },
    {
      name: 'Oki Setiawan',
      email: 'oki.setiawan@example.com',
      nik: '1603031205930011',
      kk: '1603031707160010',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1993-05-12'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567819',
      emergencyContact: '081234567820 (Kusnan - Ayah)',
      domicileAddress: 'Jl. Lingkar Luar Tanjung Enim No. 4',
      currentAddress: 'Muara Enim, Sumatera Selatan',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 2 Muara Enim',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Mekanik Hydraulic System Komatsu',
      jobIndex: 3, // PTBA Mechanic
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_4', // Technical Test
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        testSkill: { date: daysAhead(2).toISOString().split('T')[0], testType: 'Praktek Overhaul Hydraulic Pump' }
      }
    },

    // STAGE 3: PSIKOTES (2 orang)
    {
      name: 'Panji Triyono',
      email: 'panji.triyono@example.com',
      nik: '6401061912960012',
      kk: '6401061404190011',
      birthPlace: 'Samarinda',
      birthDate: new Date('1996-12-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567821',
      emergencyContact: '081234567822 (Triyono - Ayah)',
      domicileAddress: 'Jl. Pangeran Suryanata KM.2, Samarinda',
      currentAddress: 'Samarinda, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Operator Excavator Komatsu PC200 / PC400',
      jobIndex: 0, // KPC Excavator
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_3', // Psikotes
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        psikotes: { date: daysAhead(1).toISOString().split('T')[0], vendor: 'Biro Psikologi Mandiri Assessment' }
      }
    },
    {
      name: 'Qori Ramadhani',
      email: 'qori.ramadhani@example.com',
      nik: '7206032411950013',
      kk: '7206031002180012',
      birthPlace: 'Morowali',
      birthDate: new Date('1995-11-24'),
      gender: 'Perempuan',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567823',
      emergencyContact: '081234567824 (Ibu Salma)',
      domicileAddress: 'Jl. Pelabuhan Bahomakmur, Morowali',
      currentAddress: 'Morowali, Sulawesi Tengah',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Universitas Hasanuddin',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'Ahli K3 Lingkungan & SMK3',
      jobIndex: 2, // IMIP HSE Inspector
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_3', // Psikotes
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        psikotes: { date: daysAhead(2).toISOString().split('T')[0], vendor: 'Online Psychological Profiling Portal' }
      }
    },

    // STAGE 2: INTERVIEW HR (3 orang) -> Jadwal ada di Kalender & Dashboard Interview
    {
      name: 'Raden Mas Bagus Wicaksono',
      email: 'raden.wicaksono@example.com',
      nik: '3174011805930014',
      kk: '3174011409160013',
      birthPlace: 'Jakarta',
      birthDate: new Date('1993-05-18'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567825',
      emergencyContact: '081234567826 (Sekar - Istri)',
      domicileAddress: 'Jl. Tebet Barat Raya No. 45, Jakarta Selatan',
      currentAddress: 'Jakarta Selatan, DKI Jakarta',
      provName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Universitas Indonesia',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'Certified Fullstack Cloud Architecture',
      jobIndex: 10, // Telkom Software Engineer
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_2', // Interview HR
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        hrInterview: { date: daysAhead(1).toISOString().split('T')[0], time: '10:00 WIB', interviewer: 'Rian Pratama, S.Psi (Lead Recruiter)' }
      }
    },
    {
      name: 'Surya Dharmawan',
      email: 'surya.dharmawan@example.com',
      nik: '6403081103940015',
      kk: '6403082205170014',
      birthPlace: 'Berau',
      birthDate: new Date('1994-03-11'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567827',
      emergencyContact: '081234567828 (Dharmawan - Ayah)',
      domicileAddress: 'Jl. Durian III No. 8, Tanjung Redeb',
      currentAddress: 'Berau, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Mine Geodetic Assistant',
      jobIndex: 1, // Berau Coal Surveyor
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_2', // Interview HR
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        hrInterview: { date: daysAhead(2).toISOString().split('T')[0], time: '14:00 WITA', interviewer: 'Rian Pratama, S.Psi (Lead Recruiter)' }
      }
    },
    {
      name: 'Taufik Hidayatullah',
      email: 'taufik.hidayat@example.com',
      nik: '3174021908950016',
      kk: '3174021111180015',
      birthPlace: 'Jakarta',
      birthDate: new Date('1995-08-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567829',
      emergencyContact: '081234567830 (Drs. Hidayat - Ayah)',
      domicileAddress: 'Jl. Fatmawati No. 78, Cilandak',
      currentAddress: 'Jakarta Selatan, DKI Jakarta',
      provName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Universitas Indonesia',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'Brevet Pajak A/B & Financial Modeler',
      jobIndex: 11, // Bank Mandiri Analyst
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_2', // Interview HR
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {
        hrInterview: { date: daysAhead(3).toISOString().split('T')[0], time: '11:00 WIB', interviewer: 'Rian Pratama, S.Psi (Lead Recruiter)' }
      }
    },

    // STAGE 1: CV SCREENING (1 orang)
    {
      name: 'Utomo Budi Raharjo',
      email: 'utomo.budi@example.com',
      nik: '6401072510960017',
      kk: '6401071407190016',
      birthPlace: 'Sangatta',
      birthDate: new Date('1996-10-25'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567831',
      emergencyContact: '081234567832 (Raharjo - Ayah)',
      domicileAddress: 'Jl. Kenyamukan RT 05, Sangatta Utara',
      currentAddress: 'Kutai Timur, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Operator Excavator PC2000 Terakreditasi',
      jobIndex: 0, // KPC Excavator
      status: ApplicationStatus.ACTIVE,
      currentStageId: 'stage_1', // CV Screening
      isTalentPool: false,
      isBlacklisted: false,
      stageData: {}
    },

    // -------------------------------------------------------------------------
    // KELOMPOK 3: REJECTED / ARCHIVED CANDIDATES (6 orang)
    // Ditolak dengan format standar "Reason: <Pesan Rejection>"
    // -------------------------------------------------------------------------
    {
      name: 'Vicky Pratama Putra',
      email: 'vicky.pratama@example.com',
      nik: '6401081109940018',
      kk: '6401081605170017',
      birthPlace: 'Samarinda',
      birthDate: new Date('1994-09-11'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567833',
      emergencyContact: '081234567834 (Putra - Kakak)',
      domicileAddress: 'Jl. Sentosa No. 12, Samarinda',
      currentAddress: 'Samarinda, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'SIO Excavator Kadaluarsa',
      jobIndex: 0, // KPC Excavator
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_1',
      isTalentPool: false,
      isBlacklisted: false,
      rejectionReason: 'Reason: Incomplete Documents'
    },
    {
      name: 'Wahyu Nugroho',
      email: 'wahyu.nugroho@example.com',
      nik: '6403091507930019',
      kk: '6403091908160018',
      birthPlace: 'Berau',
      birthDate: new Date('1993-07-15'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567835',
      emergencyContact: '081234567836 (Lestari - Istri)',
      domicileAddress: 'Jl. Poros Sambaliung, Berau',
      currentAddress: 'Berau, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Surveyor Pemula',
      jobIndex: 1, // Berau Coal Surveyor
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_2',
      isTalentPool: false,
      isBlacklisted: false,
      rejectionReason: 'Reason: Poor Communication Skills'
    },
    {
      name: 'Xavier Danuarta',
      email: 'xavier.danuarta@example.com',
      nik: '7206041604940020',
      kk: '7206041207170019',
      birthPlace: 'Palu',
      birthDate: new Date('1994-04-16'),
      gender: 'Laki-laki',
      religion: 'Kristen',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567837',
      emergencyContact: '081234567838 (Danuarta - Ayah)',
      domicileAddress: 'Jl. Wolter Monginsidi, Palu',
      currentAddress: 'Palu, Sulawesi Tengah',
      provName: 'Sulawesi Tengah',
      cityName: 'Palu',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Universitas Hasanuddin',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'K3 Officer Trainee',
      jobIndex: 2, // IMIP HSE Inspector
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_3',
      isTalentPool: false,
      isBlacklisted: false,
      rejectionReason: 'Reason: Did Not Pass Psychological Standards'
    },
    {
      name: 'Yogi Saputra',
      email: 'yogi.saputra@example.com',
      nik: '1603041908920021',
      kk: '1603042006150020',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1992-08-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567839',
      emergencyContact: '081234567840 (Dewi - Istri)',
      domicileAddress: 'Jl. Lingga Jaya No. 7, Tanjung Enim',
      currentAddress: 'Muara Enim, Sumatera Selatan',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 2 Muara Enim',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Mekanik Otomotif Ringan',
      jobIndex: 3, // PTBA Mechanic
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_4',
      isTalentPool: false,
      isBlacklisted: false,
      rejectionReason: 'Reason: Failed Technical Test'
    },
    {
      name: 'Zainal Abidin',
      email: 'zainal.abidin@example.com',
      nik: '8202021101930022',
      kk: '8202021405160021',
      birthPlace: 'Weda',
      birthDate: new Date('1993-01-11'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567841',
      emergencyContact: '081234567842 (Aisyah - Istri)',
      domicileAddress: 'Desa Gemaf, Weda Utara',
      currentAddress: 'Halmahera Tengah, Maluku Utara',
      provName: 'Maluku Utara',
      cityName: 'Halmahera Tengah',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Pengawas Tambang Non-POP',
      jobIndex: 4, // IWIP Supervisor
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_5',
      isTalentPool: false,
      isBlacklisted: false,
      rejectionReason: 'Reason: User Rejected (Technical Fit)'
    },
    {
      name: 'Agus Salim',
      email: 'agus.salim@example.com',
      nik: '6401091402920023',
      kk: '6401091807150022',
      birthPlace: 'Kutai Timur',
      birthDate: new Date('1992-02-14'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567843',
      emergencyContact: '081234567844 (Siti - Istri)',
      domicileAddress: 'Jl. Poros Kudungga, Sangatta Utara',
      currentAddress: 'Kutai Timur, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Timur',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Operator Excavator Kelas 1',
      jobIndex: 0, // KPC Excavator
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: false,
      rejectionReason: 'Reason: Failed Medical Check-Up (MCU)'
    },

    // -------------------------------------------------------------------------
    // KELOMPOK 4: BLACKLISTED CANDIDATES (3 orang)
    // Kasus pelanggaran berat pemalsuan SIO, narkoba, indisipliner
    // -------------------------------------------------------------------------
    {
      name: 'Budi Santoso (Blacklist)',
      email: 'budi.santoso.bl@example.com',
      nik: '6402031109900024',
      kk: '6402031505130023',
      birthPlace: 'Kutai Kartanegara',
      birthDate: new Date('1990-09-11'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567845',
      emergencyContact: '081234567846 (Keluarga)',
      domicileAddress: 'Jl. Mangkuraja No. 34, Tenggarong',
      currentAddress: 'Kutai Kartanegara, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Kutai Kartanegara',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'SIO Palsu Terdeteksi',
      jobIndex: 0,
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_1',
      isTalentPool: false,
      isBlacklisted: true,
      blacklistReason: 'Pemalsuan dokumen resmi sertifikat kompetensi SIO Kemnaker Kelas 1. Terverifikasi nomor seri milik orang lain saat validasi barcode.',
      blacklistedAt: daysAgo(45),
      rejectionReason: 'Reason: Fake Documents Detected'
    },
    {
      name: 'Candra Wijaya (Blacklist)',
      email: 'candra.wijaya.bl@example.com',
      nik: '7206051703920025',
      kk: '7206051908150024',
      birthPlace: 'Morowali',
      birthDate: new Date('1992-03-17'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567847',
      emergencyContact: '081234567848 (Keluarga)',
      domicileAddress: 'Kawasan Lingkar Tambang Morowali',
      currentAddress: 'Morowali, Sulawesi Tengah',
      provName: 'Sulawesi Tengah',
      cityName: 'Morowali',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Balikpapan',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Indisipliner Fatality Incident',
      jobIndex: 2,
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_7',
      isTalentPool: false,
      isBlacklisted: true,
      blacklistReason: 'Pelanggaran Fatal Golden Rules K3: Positif amphetamine/narkotika pada uji skrining urine narkoba MCU resmi Rumah Sakit.',
      blacklistedAt: daysAgo(30),
      rejectionReason: 'Reason: Failed Medical Check-Up (MCU)'
    },
    {
      name: 'Deddy Hermanto (Blacklist)',
      email: 'deddy.hermanto.bl@example.com',
      nik: '1603051408910026',
      kk: '1603052206140025',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1991-08-14'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567849',
      emergencyContact: '081234567850 (Keluarga)',
      domicileAddress: 'Jl. Pasar Bawah No. 12, Tanjung Enim',
      currentAddress: 'Muara Enim, Sumatera Selatan',
      provName: 'Sumatera Selatan',
      cityName: 'Muara Enim',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Universitas Sriwijaya',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Indisipliner Berat',
      jobIndex: 3,
      status: ApplicationStatus.REJECTED,
      currentStageId: 'stage_2',
      isTalentPool: false,
      isBlacklisted: true,
      blacklistReason: 'Rekam jejak indisipliner berat (pencurian spare part alat berat dan manipulasi jam kerja overtime di vendor sebelumnya).',
      blacklistedAt: daysAgo(20),
      rejectionReason: 'Reason: Attitude / Culture Mismatch'
    },

    // -------------------------------------------------------------------------
    // KELOMPOK 5: TALENT POOL STANDALONE PROFILES (5 orang)
    // Profil terverifikasi siap pakai di Talent Pool (S1, D3, SMA/SMK)
    // -------------------------------------------------------------------------
    {
      name: 'Erna Susilowati',
      email: 'erna.susilowati@example.com',
      nik: '6471034405960027',
      kk: '6471031908180026',
      birthPlace: 'Balikpapan',
      birthDate: new Date('1996-05-04'),
      gender: 'Perempuan',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567851',
      emergencyContact: '081234567852 (Susilo - Ayah)',
      domicileAddress: 'Jl. Jenderal Sudirman No. 112, Klandasan',
      currentAddress: 'Balikpapan, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Balikpapan',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Institut Teknologi Bandung',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'Sertifikat Ahli K3 Umum & ISO 14001 Lead Auditor',
      jobIndex: 2,
      status: null, // Murni Talent Pool tanpa lamaran aktif
      currentStageId: null,
      isTalentPool: true,
      isBlacklisted: false
    },
    {
      name: 'Fandi Kurniawan',
      email: 'fandi.kurniawan@example.com',
      nik: '6401101903950028',
      kk: '6401101207170027',
      birthPlace: 'Samarinda',
      birthDate: new Date('1995-03-19'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567853',
      emergencyContact: '081234567854 (Kurnia - Istri)',
      domicileAddress: 'Jl. D.I. Panjaitan No. 89, Mugirejo',
      currentAddress: 'Samarinda, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Samarinda',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Politeknik Negeri Samarinda (Polnes)',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Welder 6G GTAW/SMAW & NDT Level II',
      jobIndex: 3,
      status: null,
      currentStageId: null,
      isTalentPool: true,
      isBlacklisted: false
    },
    {
      name: 'Gunawan Prasetya',
      email: 'gunawan.prasetya@example.com',
      nik: '6403102206970029',
      kk: '6403101809190028',
      birthPlace: 'Berau',
      birthDate: new Date('1997-06-22'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567855',
      emergencyContact: '081234567856 (Prasetya - Ayah)',
      domicileAddress: 'Jl. H.A.R.M. Ayoeb No. 16, Gunung Tabur',
      currentAddress: 'Berau, Kalimantan Timur',
      provName: 'Kalimantan Timur',
      cityName: 'Berau',
      educationType: 'SLTA',
      latestEducation: 'SMA/SMK',
      educationInstitution: 'SMKN 1 Sangatta Utara',
      trainingCenterType: 'LPK',
      trainingCenterName: 'LPK Alat Berat Borneo Mandiri',
      certName: 'Operator Dump Truck Heavy Duty HD785',
      jobIndex: 0,
      status: null,
      currentStageId: null,
      isTalentPool: true,
      isBlacklisted: false
    },
    {
      name: 'Hesti Puspitasari',
      email: 'hesti.puspitasari@example.com',
      nik: '3174034509950030',
      kk: '3174031402180029',
      birthPlace: 'Jakarta',
      birthDate: new Date('1995-09-05'),
      gender: 'Perempuan',
      religion: 'Islam',
      maritalStatus: 'Belum Menikah',
      whatsapp: '081234567857',
      emergencyContact: '081234567858 (Puspita - Ibu)',
      domicileAddress: 'Jl. Senopati No. 42, Kebayoran Baru',
      currentAddress: 'Jakarta Selatan, DKI Jakarta',
      provName: 'DKI Jakarta',
      cityName: 'Jakarta Selatan',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'S1',
      educationInstitution: 'Universitas Indonesia',
      trainingCenterType: 'BPVP',
      trainingCenterName: 'BPVP Samarinda',
      certName: 'Certified HR Professional (CHRP)',
      jobIndex: 11,
      status: null,
      currentStageId: null,
      isTalentPool: true,
      isBlacklisted: false
    },
    {
      name: 'Ilham Syahputra',
      email: 'ilham.syahputra@example.com',
      nik: '1603061704940031',
      kk: '1603062008170030',
      birthPlace: 'Muara Enim',
      birthDate: new Date('1994-04-17'),
      gender: 'Laki-laki',
      religion: 'Islam',
      maritalStatus: 'Menikah',
      whatsapp: '081234567859',
      emergencyContact: '081234567860 (Syahputra - Ayah)',
      domicileAddress: 'Jl. Kertapati Indah No. 3, Palembang',
      currentAddress: 'Palembang, Sumatera Selatan',
      provName: 'Sumatera Selatan',
      cityName: 'Palembang',
      educationType: 'Perguruan Tinggi',
      latestEducation: 'D3',
      educationInstitution: 'Universitas Sriwijaya',
      trainingCenterType: 'BLK',
      trainingCenterName: 'BLK Samarinda',
      certName: 'Teknisi Instrumentasi & Otomasi Industri',
      jobIndex: 3,
      status: null,
      currentStageId: null,
      isTalentPool: true,
      isBlacklisted: false
    }
  ];

  for (let idx = 0; idx < candidateDataset.length; idx++) {
    const c = candidateDataset[idx];
    const provId = provinceMap.get(c.provName) || (await prisma.masterProvince.findFirst())!.id;
    const cityId = cityMap.get(c.cityName) || (await prisma.masterCity.findFirst({ where: { provinceId: provId } }))!.id;
    const targetJob = createdJobs[c.jobIndex % createdJobs.length];

    // 1. Buat Akun User
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
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: c.name,
          password: hashedPassword,
          role: UserRole.CANDIDATE
        }
      });
    }

    // 2. Buat Candidate Profile
    let profile = await prisma.candidateProfile.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(c.nik ? [{ nik: c.nik }] : [])
        ]
      }
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

    // 4. Jika kandidat memiliki lamaran kerja (bukan murni talent pool)
    if (c.status !== null) {
      let application = await prisma.application.findFirst({
        where: {
          jobId: targetJob.id,
          candidateProfileId: profile.id
        }
      });

      const appDate = inCurrentMonth(Math.max(1, (idx % 12) + 1));

      if (application) {
        await prisma.applicationHistory.deleteMany({ where: { applicationId: application.id } });
        await prisma.interview.deleteMany({ where: { applicationId: application.id } });

        application = await prisma.application.update({
          where: { id: application.id },
          data: {
            currentStageId: c.currentStageId,
            status: c.status,
            applicationDate: appDate,
            stageData: c.stageData || {}
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
            stageData: c.stageData || {}
          }
        });
      }

      // 5. Buat Riwayat Perjalanan Rekrutmen (Application History)
      const stageOrderMap: Record<string, number> = {
        stage_1: 1,
        stage_2: 2,
        stage_3: 3,
        stage_4: 4,
        stage_5: 5,
        stage_6: 6,
        stage_7: 7,
        stage_8: 8,
        stage_9: 9,
        stage_10: 10
      };

      const maxStageNum = stageOrderMap[c.currentStageId] || 1;

      // Stage 1 History
      await prisma.applicationHistory.create({
        data: {
          applicationId: application.id,
          stageId: 'stage_1',
          stageName: 'CV Screening',
          date: appDate,
          note: 'Dokumen lamaran lengkap berhasil diverifikasi.'
        }
      });

      if (maxStageNum >= 2) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_2',
            stageName: 'Interview HR',
            date: new Date(appDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            note: 'Lolos seleksi administrasi, berlanjut ke Interview HR.'
          }
        });
      }

      if (maxStageNum >= 3) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_3',
            stageName: 'Psikotes',
            date: new Date(appDate.getTime() + 4 * 24 * 60 * 60 * 1000),
            note: 'Interview HR memuaskan, diarahkan asesmen psikotes.'
          }
        });
      }

      if (maxStageNum >= 4) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_4',
            stageName: 'Technical Test',
            date: new Date(appDate.getTime() + 6 * 24 * 60 * 60 * 1000),
            note: 'Hasil psikotes disarankan, lanjut ke uji keahlian teknis.'
          }
        });
      }

      if (maxStageNum >= 5) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_5',
            stageName: 'Interview User',
            date: new Date(appDate.getTime() + 8 * 24 * 60 * 60 * 1000),
            note: 'Lulus uji kompetensi teknis, lanjut ke wawancara Superintendent.'
          }
        });
      }

      if (maxStageNum >= 6) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_6',
            stageName: 'Offering',
            date: new Date(appDate.getTime() + 10 * 24 * 60 * 60 * 1000),
            note: 'User menyetujui, penerbitan surat penawaran kerja (Offering Letter).'
          }
        });
      }

      if (maxStageNum >= 7) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_7',
            stageName: 'MCU',
            date: new Date(appDate.getTime() + 12 * 24 * 60 * 60 * 1000),
            note: 'Offering disepakati kandidat, menjalani pemeriksaan Medical Check Up.'
          }
        });
      }

      if (maxStageNum >= 8) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_8',
            stageName: 'Training',
            date: new Date(appDate.getTime() + 14 * 24 * 60 * 60 * 1000),
            note: 'Hasil MCU Fit to Work (Category A). Memulai pelatihan operasional tambang.'
          }
        });
      }

      if (maxStageNum >= 9) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_9',
            stageName: 'Induction',
            date: new Date(appDate.getTime() + 16 * 24 * 60 * 60 * 1000),
            note: 'Menjalani induksi keselamatan kerja pit & OHS Golden Rules.'
          }
        });
      }

      if (maxStageNum >= 10) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageId: 'stage_10',
            stageName: 'PKWT',
            date: new Date(appDate.getTime() + 18 * 24 * 60 * 60 * 1000),
            note: 'Penandatanganan Perjanjian Kerja Waktu Tertentu (PKWT) & BAST Serah Terima.'
          }
        });
      }

      // Catatan khusus REJECTED
      if (c.status === ApplicationStatus.REJECTED) {
        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            stageName: 'Rejected',
            date: new Date(appDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            note: c.rejectionReason || 'Reason: Does Not Meet Requirements'
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
            scheduledAt: daysAhead((idx % 3) + 1),
            durationMinutes: 45,
            locationOrLink: 'Online Google Meet: meet.google.com/ugz-hr-interview',
            interviewerName: 'Rian Pratama, S.Psi (Lead Recruiter)'
          }
        });
      } else if (c.currentStageId === 'stage_5') {
        await prisma.interview.create({
          data: {
            applicationId: application.id,
            type: 'User Interview',
            title: `Interview User - ${c.name}`,
            scheduledAt: daysAhead((idx % 2) + 2),
            durationMinutes: 60,
            locationOrLink: 'Main Office Pit Conference Room & Zoom',
            interviewerName: 'Ir. Budi Santoso, ST., IPM (Mining Superintendent)'
          }
        });
      }
    }
  }

  console.log('✅ Seeding dummy data recruitment selesai dengan sukses!');
  console.log('📊 Ringkasan Data:');
  console.log(`- Total Lowongan Pekerjaan: ${createdJobs.length} lowongan`);
  console.log(`- Total Profil Kandidat: ${candidateDataset.length} kandidat`);
  console.log('  * Hired (Stage 8, 9, 10): 6 orang (BAST & MCU Fit lengkap)');
  console.log('  * On Process (Stage 1 s/d 7): 16 orang (tersebar di semua stage seleksi)');
  console.log('  * Rejected / Archived: 6 orang (alasan baku terstandarisasi)');
  console.log('  * Blacklist: 3 orang (pelanggaran berat terdokumentasi)');
  console.log('  * Talent Pool Mandiri: 5 orang (profil unggulan terverifikasi)');
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
