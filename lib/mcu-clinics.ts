export interface McuClinic {
  id: string;
  code?: string;
  name?: string;
  nama?: string;
  address?: string;
  alamat?: string;
  provinceId?: string;
  province?: {
    id: string;
    name: string;
    code: string;
  } | null;
  wilayah?: string;
  site?: string;
  defaultPaket?: string;
}

export interface McuCandidateRow {
  id: string;
  nama: string;
  nik: string;
  posisi: string;
  kategori: string;
  paketMcu: string;
  site: string;
  customer: string;
  jobOpeningId?: string;
  applicationId?: string;
}

export const MCU_CLINICS: McuClinic[] = [
  {
    id: "tirta-tambun",
    nama: "Klinik Tirta Medical Tambun",
    wilayah: "Tambun",
    site: "Head Office / Cikarang",
    alamat:
      "Ruko Blok AA 9 No. 1 – 2, Jl. Celebration Boulevard, Kavling 1, Kelurahan Lambangjaya, Kecamatan Tambun Selatan, Kabupaten Bekasi, Jawa Barat, 17510",
    defaultPaket:
      "MCU MELAK + SEROLOGI (HBSAG+ VDRL) + GOLONGAN DARAH (ABO + RHESUS) + URINE DRUG TEST 6 PARAMETER",
  },
  {
    id: "tirta-batukajang",
    nama: "Klinik Tirta Medical",
    wilayah: "Batu Kajang",
    site: "Kideco",
    alamat:
      "Jl. Negara Km. 145, Desa Batu Kajang, Kec. Batu Sopang, Kab. Paser, Kalimantan Timur, 76252",
    defaultPaket:
      "MCU STANDARD TAMBANG + THORAX + NARKOTIKA 6 PARAMETER + AUDIOMETRI & SPIROMETRI",
  },
  {
    id: "tirta-sangatta",
    nama: "Klinik Tirta Medical",
    wilayah: "Sangatta",
    site: "KPC Sangatta",
    alamat:
      "Jl. Yos Sudarso II No. 45, Sangatta Utara, Kabupaten Kutai Timur, Kalimantan Timur, 75611",
    defaultPaket:
      "MCU STANDARD TAMBANG FIT TO WORK + SEROLOGI + DRUG TEST 6 PARAMETER + EKG",
  },
  {
    id: "tirta-berau",
    nama: "Klinik Tirta Medical",
    wilayah: "Tanjung Redeb",
    site: "Berau Coal",
    alamat:
      "Jl. Pemuda No. 88, Kel. Bugis, Kec. Tanjung Redeb, Kabupaten Berau, Kalimantan Timur, 77311",
    defaultPaket:
      "MCU FULL FIT TO WORK + DRUG TEST 6 PARAMETER + RONTGEN THORAX + LAB LENGKAP",
  },
  {
    id: "tirta-melak",
    nama: "Klinik Tirta Medical",
    wilayah: "Melak",
    site: "Kutai Barat (Melak)",
    alamat:
      "Jl. Sendawar Raya No. 12, Melak Ulu, Kec. Melak, Kabupaten Kutai Barat, Kalimantan Timur, 75765",
    defaultPaket:
      "MCU MELAK + SEROLOGI (HBSAG+ VDRL) + GOLONGAN DARAH (ABO + RHESUS) + URINE DRUG TEST 6 PARAMETER",
  },
  {
    id: "kf-balikpapan",
    nama: "Klinik Kimia Farma",
    wilayah: "Balikpapan",
    site: "Transit Point Kaltim",
    alamat:
      "Jl. Jenderal Sudirman No. 34, Klandasan Ilir, Kota Balikpapan, Kalimantan Timur, 76113",
    defaultPaket:
      "MCU PRE EMPLOYEE LEVEL 1 + SEROLOGI + URINE NARKOBA 6 PARAMETER",
  },
  {
    id: "morowali-sehat",
    nama: "Klinik Morowali Sehat",
    wilayah: "Bahodopi",
    site: "Morowali Nickel Site",
    alamat:
      "Jl. Trans Sulawesi, Desa Fatufia, Kec. Bahodopi, Kabupaten Morowali, Sulawesi Tengah, 94974",
    defaultPaket:
      "MCU FIT TO WORK HEAVY INDUSTRY + AUDIOMETRI + DRUG TEST 6 PARAMETER",
  },
  {
    id: "prodia-cikarang",
    nama: "Klinik Prodia",
    wilayah: "Cikarang",
    site: "Jababeka Industrial Estate",
    alamat:
      "Ruko Cikarang Commercial Center Blok B No. 7, Cikarang Utara, Bekasi, Jawa Barat, 17530",
    defaultPaket:
      "MCU PRE EMPLOYEE CORPORATE + DRUG SCREENING 6 PARAMETER + RONTGEN",
  },
];

export const DEFAULT_MCU_CONTACT = {
  picName: "Annisa Nur Cahya Rahmadani",
  picJabatan: "Recruitment Staff",
  picPhone: "0895-2305-7314",
  resultEmails: [
    "annisa.rahmadani@dpp.co.id",
    "indrajid.k@dpp.co.id",
    "RecruitmentTeam@dpp.co.id",
    "m.hidayat@dpp.co.id",
    "pretty.tm@dpp.co.id",
    "deo.felix@dpp.co.id",
  ],
  billing: {
    company: "PT. Dian Pandu Pratama",
    up: "M Irfan Dzul Izzudin/ irfandzul@dpp.co.id",
    address:
      "Jl. Jababeka Blok I Kawasan Industri Jababeka (Patria Pos 7) Desa Harja Mekar, Kec. Cikarang Utara, Kab. Bekasi, Jawa Barat, 17530",
  },
  signee: {
    name: "Mursidi",
    title: "Recruitment & Development Dept. Head",
    city: "Cikarang",
  },
  footerText:
    "Jl. Jababeka XII Blok I Kawasan Industri Jababeka Cikarang 17530 – Indonesia",
};

export const MOCK_MCU_CANDIDATES: McuCandidateRow[] = [
  {
    id: "mock-mcu-1",
    nama: "MUHAMMAD DENIF",
    nik: "6402082302080001",
    posisi: "WELDER",
    kategori: "PRE EMPLOYEE",
    site: "Kideco",
    customer: "PT. Dian Pandu Pratama",
    paketMcu:
      "MCU MELAK + SEROLOGI (HBSAG+ VDRL) + GOLONGAN DARAH (ABO + RHESUS) + URINE DRUG TEST 6 PARAMETER",
  },
  {
    id: "mock-mcu-2",
    nama: "MUHAMMAD ZIAN SAPUTRA",
    nik: "6401061407060002",
    posisi: "WELDER",
    kategori: "PRE EMPLOYEE",
    site: "Kideco",
    customer: "PT. Dian Pandu Pratama",
    paketMcu:
      "MCU MELAK + SEROLOGI (HBSAG+ VDRL) + GOLONGAN DARAH (ABO + RHESUS) + URINE DRUG TEST 6 PARAMETER",
  },
  {
    id: "mock-mcu-3",
    nama: "BAMBANG TRI RAHARJO",
    nik: "6471021509920003",
    posisi: "HEAVY EQUIPMENT MECHANIC",
    kategori: "PRE EMPLOYEE",
    site: "KPC Sangatta Coal Mine",
    customer: "PT Kaltim Prima Coal",
    paketMcu:
      "MCU STANDARD TAMBANG FIT TO WORK + SEROLOGI + DRUG TEST 6 PARAMETER + EKG",
  },
  {
    id: "mock-mcu-4",
    nama: "AGUS PRASETYO",
    nik: "6402041103950004",
    posisi: "SAFETY OFFICER (HSE)",
    kategori: "PRE EMPLOYEE",
    site: "Berau Coal Mine",
    customer: "PT Berau Coal",
    paketMcu:
      "MCU FULL FIT TO WORK + DRUG TEST 6 PARAMETER + RONTGEN THORAX + LAB LENGKAP",
  },
  {
    id: "mock-mcu-5",
    nama: "SITI RAHMAWATI",
    nik: "3216064501980005",
    posisi: "RECRUITMENT ADMIN",
    kategori: "PRE EMPLOYEE",
    site: "Head Office / Cikarang",
    customer: "PT. Dian Pandu Pratama",
    paketMcu:
      "MCU PRE EMPLOYEE CORPORATE + DRUG SCREENING 6 PARAMETER + RONTGEN",
  },
  {
    id: "mock-mcu-6",
    nama: "FAJAR MAULANA",
    nik: "6408012010960006",
    posisi: "DUMP TRUCK OPERATOR",
    kategori: "PRE EMPLOYEE",
    site: "Morowali Nickel Mining Area",
    customer: "PT Vale Indonesia",
    paketMcu:
      "MCU FIT TO WORK HEAVY INDUSTRY + AUDIOMETRI + DRUG TEST 6 PARAMETER",
  },
];
