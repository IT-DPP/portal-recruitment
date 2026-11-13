"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, UserPlus, ChevronDown, Menu, X } from "lucide-react";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo DPP: ONLY the official logo image, no extra text label */}
        <Link
          href="/"
          className="inline-flex items-center shrink-0"
          aria-label="Beranda PT Dian Pandu Pratama"
        >
          <Image
            src="/images/branding/dpp-logo-new.png"
            alt="Logo PT Dian Pandu Pratama"
            width={190}
            height={82}
            className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-900">
          <a
            href="#hero"
            className="hover:text-[#D9232A] transition-colors"
          >
            Beranda
          </a>

          {/* Lowongan Kerja placed first */}
          <a
            href="#lowongan"
            className="hover:text-[#D9232A] transition-colors"
          >
            Lowongan Kerja
          </a>

          {/* About Dropdown: combines Budaya SMART, Mitra Client, Jaringan Operasi */}
          <div
            className="relative"
            onMouseEnter={() => setIsAboutOpen(true)}
            onMouseLeave={() => setIsAboutOpen(false)}
          >
            <button
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              className="flex items-center gap-1.5 hover:text-[#D9232A] transition-colors focus:outline-hidden cursor-pointer"
              aria-expanded={isAboutOpen}
            >
              About
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isAboutOpen ? "rotate-180 text-[#D9232A]" : ""
                }`}
              />
            </button>

            {isAboutOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <a
                  href="#budaya-smart"
                  onClick={() => setIsAboutOpen(false)}
                  className="block px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50 hover:text-[#D9232A] transition-colors"
                >
                  Budaya S.M.A.R.T
                </a>
                <a
                  href="#klien-mitra"
                  onClick={() => setIsAboutOpen(false)}
                  className="block px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50 hover:text-[#D9232A] transition-colors"
                >
                  Mitra &amp; Klien Strategis
                </a>
                <a
                  href="#jaringan-operasi"
                  onClick={() => setIsAboutOpen(false)}
                  className="block px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50 hover:text-[#D9232A] transition-colors"
                >
                  Jaringan Operasi Nasional
                </a>
                <a
                  href="#layanan"
                  onClick={() => setIsAboutOpen(false)}
                  className="block px-4 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-50 hover:text-[#D9232A] transition-colors border-t border-zinc-100 mt-1"
                >
                  Fokus Layanan &amp; Bisnis
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/candidate/register"
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            <UserPlus className="w-4 h-4 text-[#D9232A]" />
            Daftar Karir
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D9232A] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/20"
          >
            <LogIn className="w-4 h-4" />
            Masuk Portal
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-zinc-900 p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="Buka Menu Navigasi"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-zinc-200 px-6 py-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3 text-sm font-bold text-zinc-900">
            <a
              href="#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-[#D9232A]"
            >
              Beranda
            </a>
            <a
              href="#lowongan"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-[#D9232A]"
            >
              Lowongan Kerja
            </a>

            <div className="pt-2 border-t border-zinc-200 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block">
                About DPP
              </span>
              <a
                href="#budaya-smart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pl-3 py-1 text-xs text-zinc-700 hover:text-[#D9232A]"
              >
                Budaya S.M.A.R.T
              </a>
              <a
                href="#klien-mitra"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pl-3 py-1 text-xs text-zinc-700 hover:text-[#D9232A]"
              >
                Mitra &amp; Klien Strategis
              </a>
              <a
                href="#jaringan-operasi"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pl-3 py-1 text-xs text-zinc-700 hover:text-[#D9232A]"
              >
                Jaringan Operasi Nasional
              </a>
              <a
                href="#layanan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pl-3 py-1 text-xs text-zinc-700 hover:text-[#D9232A]"
              >
                Fokus Layanan &amp; Bisnis
              </a>
            </div>
          </nav>

          <div className="pt-4 border-t border-zinc-200 flex flex-col gap-2.5">
            <Link
              href="/candidate/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 border-2 border-zinc-900 text-zinc-900 rounded-xl text-xs font-bold"
            >
              Daftar Karir
            </Link>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 bg-[#D9232A] text-white rounded-xl text-xs font-bold"
            >
              Masuk Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
