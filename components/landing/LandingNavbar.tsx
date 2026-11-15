"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAboutOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-xs py-3"
          : "bg-transparent py-4 sm:py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo DPP: Official logo mark, clean presentation */}
        <Link
          href="/"
          className="inline-flex items-center shrink-0"
          aria-label="Beranda PT Dian Pandu Pratama"
        >
          <Image
            src="/images/branding/dpp-logo-new.png"
            alt="Logo PT Dian Pandu Pratama"
            width={200}
            height={86}
            className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-transform hover:opacity-90"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-800">
          <a
            href="#hero"
            className="hover:text-zinc-950 transition-colors"
          >
            Beranda
          </a>

          {/* Lowongan Kerja placed first — direct navigation to /jobs */}
          <Link
            href="/jobs"
            className="hover:text-zinc-950 transition-colors"
          >
            Lowongan Kerja
          </Link>

          {/* About Dropdown with Seamless Bridge & Click Outside Guard */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setIsAboutOpen(true)}
            onMouseLeave={() => setIsAboutOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              className="flex items-center gap-1.5 py-1 hover:text-zinc-950 transition-colors focus:outline-hidden cursor-pointer"
              aria-expanded={isAboutOpen}
            >
              Tentang Kami
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 text-zinc-500 ${
                  isAboutOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isAboutOpen && (
              <div className="absolute left-0 top-full pt-1.5 w-64 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-white border border-zinc-200 rounded-xl shadow-xl py-2 overflow-hidden">
                  <a
                    href="#jaringan-operasi"
                    onClick={() => setIsAboutOpen(false)}
                    className="block px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                  >
                    Jaringan Operasi Nasional
                  </a>
                  <a
                    href="#budaya-smart"
                    onClick={() => setIsAboutOpen(false)}
                    className="block px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                  >
                    Budaya Perusahaan
                  </a>
                  <a
                    href="#layanan"
                    onClick={() => setIsAboutOpen(false)}
                    className="block px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 hover:text-zinc-950 transition-colors border-t border-zinc-100 mt-1"
                  >
                    Fokus Layanan &amp; Bisnis
                  </a>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right CTA Actions: Crisp, firm buttons without icons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/candidate/register"
            className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-lg border border-zinc-900 text-zinc-900 text-xs font-bold tracking-tight hover:bg-zinc-900 hover:text-white transition-all shadow-2xs"
          >
            Daftar Karir
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 rounded-lg bg-[#C81E25] hover:bg-[#A8181E] text-white text-xs font-bold tracking-tight transition-all shadow-xs"
          >
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
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-zinc-900">
            <a
              href="#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-zinc-950"
            >
              Beranda
            </a>
            <Link
              href="/jobs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-zinc-950"
            >
              Lowongan Kerja
            </Link>

            <div className="pt-2 border-t border-zinc-200 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Tentang PT DPP
              </span>
              <a
                href="#jaringan-operasi"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pl-3 py-1 text-xs text-zinc-700 hover:text-zinc-950"
              >
                Jaringan Operasi Nasional
              </a>
              <a
                href="#budaya-smart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pl-3 py-1 text-xs text-zinc-700 hover:text-zinc-950"
              >
                Budaya Perusahaan
              </a>
              <a
                href="#layanan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block pl-3 py-1 text-xs text-zinc-700 hover:text-zinc-950"
              >
                Fokus Layanan &amp; Bisnis
              </a>
            </div>
          </nav>

          <div className="pt-4 border-t border-zinc-200 flex flex-col gap-2.5">
            <Link
              href="/candidate/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 border border-zinc-900 text-zinc-900 rounded-lg text-xs font-bold tracking-tight"
            >
              Daftar Karir
            </Link>
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 bg-[#C81E25] text-white rounded-lg text-xs font-bold tracking-tight"
            >
              Masuk Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
