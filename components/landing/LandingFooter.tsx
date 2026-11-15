import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, ExternalLink } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="bg-zinc-100 text-zinc-800 text-xs pt-16 pb-12 border-t border-zinc-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 pb-12 border-b border-zinc-300">
          {/* Col 1: Identity with Latest Logo */}
          <div className="space-y-4">
            <Link href="/" className="inline-block" aria-label="PT Dian Pandu Pratama">
              <Image
                src="/images/branding/dpp-logo-new.png"
                alt="Logo PT Dian Pandu Pratama"
                width={190}
                height={82}
                className="h-11 w-auto object-contain"
              />
            </Link>
            <p className="text-zinc-600 text-xs leading-relaxed font-normal">
              Penyedia tenaga kerja terampil (<em>Job &amp; Labour Supply</em>) dan pendukung produk manufaktur alat berat terpercaya di Indonesia.
            </p>
            <div className="pt-1">
              <span className="inline-block px-3 py-1 bg-white border border-zinc-300 text-zinc-800 font-bold text-[10px] rounded uppercase tracking-wider shadow-2xs">
                Labor &amp; Job Supply Specialist
              </span>
            </div>
          </div>

          {/* Col 2: Kantor Pusat */}
          <div className="space-y-3">
            <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider">
              Kantor Pusat &amp; Pabrik
            </h5>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Kawasan Industri Jababeka XII Blok W-38A, Kel. Harja Mekar, Kec. Cikarang Utara, Kab. Bekasi, Jawa Barat 17530
            </p>
            <div className="pt-1 space-y-1.5 text-xs text-zinc-700">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-500" /> (021) 893-7800
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-500" /> recruitment@dpp.co.id
              </p>
            </div>
          </div>

          {/* Col 3: Navigasi Pintas */}
          <div className="space-y-3">
            <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider">
              Tautan Pintas
            </h5>
            <ul className="space-y-2 text-xs text-zinc-700 font-medium">
              <li>
                <a
                  href="https://dpp.co.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-950 flex items-center gap-1 transition-colors"
                >
                  Website Resmi (dpp.co.id) <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </li>
              <li>
                <Link href="/jobs" className="hover:text-zinc-950 transition-colors">
                  Daftar Lowongan Kerja
                </Link>
              </li>
              <li>
                <a href="/#jaringan-operasi" className="hover:text-zinc-950 transition-colors">
                  Jaringan Operasi Nasional
                </a>
              </li>
              <li>
                <a href="/#budaya-smart" className="hover:text-zinc-950 transition-colors">
                  Budaya Perusahaan
                </a>
              </li>
              <li>
                <Link href="/candidate/register" className="hover:text-zinc-950 transition-colors">
                  Registrasi Profil Pelamar
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-zinc-950 transition-colors">
                  Portal Staf Recruiter
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Kepatuhan Hukum & UU PDP */}
          <div className="space-y-3">
            <h5 className="font-bold text-zinc-950 text-xs uppercase tracking-wider">
              Kepatuhan UU PDP
            </h5>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Platform ini dilindungi enkripsi AES-256-GCM sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Seluruh data rekam medis dan nomor identitas (NIK/KK) diproteksi secara ketat.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
          <p>© {new Date().getFullYear()} PT Dian Pandu Pratama (DPP). All Rights Reserved.</p>
          <p className="text-zinc-800 font-bold">Labor &amp; Job Supply Platform</p>
        </div>
      </div>
    </footer>
  );
}
