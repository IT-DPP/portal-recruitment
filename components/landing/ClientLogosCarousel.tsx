"use client";

import React from "react";

export interface ClientLogo {
  id: string;
  name: string;
  shortName: string;
}

const clients: ClientLogo[] = [
  { id: "astra", name: "PT Astra International Tbk", shortName: "ASTRA" },
  { id: "ut", name: "PT United Tractors Tbk", shortName: "UNITED TRACTORS" },
  { id: "patria", name: "PT United Tractors Pandu Engineering", shortName: "PATRIA" },
  { id: "pama", name: "PT Pamapersada Nusantara", shortName: "PAMA" },
  { id: "kpc", name: "PT Kaltim Prima Coal", shortName: "KPC" },
  { id: "berau", name: "PT Berau Coal Energy", shortName: "BERAU COAL" },
  { id: "triatra", name: "PT Triatra Sinergia Madani", shortName: "TRIATRA" },
  { id: "pmp", name: "PT Patria Maritim Perkasa", shortName: "PATRIA MARITIM" },
  { id: "trust", name: "PT Tambang Raya Usaha Tama", shortName: "TRUST" },
  { id: "ipr", name: "Indonesia Pratama Region", shortName: "IPR TABANG" },
];

function ClientLogoSvg({ client }: { client: ClientLogo }) {
  switch (client.id) {
    case "astra":
      return (
        <svg viewBox="0 0 160 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="Astra International">
          {/* Astra Star Symbol */}
          <g transform="translate(8, 6)">
            <path d="M18 0 L22 12 L36 18 L22 24 L18 36 L14 24 L0 18 L14 12 Z" fill="#D9232A" />
            <circle cx="18" cy="18" r="4" fill="#FFFFFF" />
          </g>
          <text x="52" y="29" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="19" letterSpacing="2.5">
            ASTRA
          </text>
        </svg>
      );

    case "ut":
      return (
        <svg viewBox="0 0 210 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="United Tractors">
          {/* UT Geometric Monogram */}
          <g transform="translate(6, 7)">
            <rect x="0" y="0" width="34" height="34" rx="4" fill="#000000" />
            <path d="M7 8 H13 V20 C13 23 15 25 18 25 C21 25 23 23 23 20 V8 H29 V20 C29 27 24 31 18 31 C12 31 7 27 7 20 Z" fill="#FFFFFF" />
            <rect x="15" y="4" width="22" height="6" fill="#D9232A" />
          </g>
          <text x="48" y="23" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="13" letterSpacing="1">
            UNITED TRACTORS
          </text>
          <text x="48" y="34" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="9" letterSpacing="0.5" fill="#71717A">
            MEMBER OF ASTRA
          </text>
        </svg>
      );

    case "patria":
      return (
        <svg viewBox="0 0 160 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="PATRIA">
          {/* Red and Black shield mark */}
          <g transform="translate(6, 6)">
            <polygon points="18,0 36,9 36,27 18,36 0,27 0,9" fill="#D9232A" />
            <polygon points="18,4 32,11 32,25 18,32 4,25 4,11" fill="#000000" />
            <text x="18" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" fill="#FFFFFF" textAnchor="middle">
              P
            </text>
          </g>
          <text x="48" y="29" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" letterSpacing="1.5">
            PATRIA
          </text>
        </svg>
      );

    case "pama":
      return (
        <svg viewBox="0 0 160 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="PAMAPERSADA">
          <g transform="translate(6, 8)">
            <polygon points="16,0 32,9 32,23 16,32 0,23 0,9" fill="#000000" />
            <polygon points="16,4 28,11 28,21 16,28 4,21 4,11" fill="#D9232A" />
          </g>
          <text x="46" y="26" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" letterSpacing="2">
            PAMA
          </text>
          <text x="46" y="36" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7" letterSpacing="0.8" fill="#71717A">
            PAMAPERSADA NUSANTARA
          </text>
        </svg>
      );

    case "kpc":
      return (
        <svg viewBox="0 0 160 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="KPC">
          <g transform="translate(6, 6)">
            <circle cx="18" cy="18" r="17" fill="#000000" />
            <circle cx="18" cy="18" r="14" fill="#D9232A" />
            <path d="M12 10 L18 26 L24 10" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <text x="48" y="26" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" letterSpacing="2">
            KPC
          </text>
          <text x="48" y="36" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7.5" letterSpacing="0.5" fill="#71717A">
            KALTIM PRIMA COAL
          </text>
        </svg>
      );

    case "berau":
      return (
        <svg viewBox="0 0 175 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="Berau Coal">
          <g transform="translate(6, 8)">
            <rect x="0" y="0" width="30" height="30" rx="6" fill="#D9232A" />
            <path d="M8 8 H22 V15 H14 V17 H20 V22 H8 Z" fill="#FFFFFF" />
          </g>
          <text x="44" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" letterSpacing="1">
            BERAU COAL
          </text>
          <text x="44" y="35" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="8" letterSpacing="0.5" fill="#71717A">
            ENERGY &amp; MINING
          </text>
        </svg>
      );

    case "triatra":
      return (
        <svg viewBox="0 0 160 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="Triatra">
          <g transform="translate(6, 8)">
            <polygon points="15,0 30,30 0,30" fill="#000000" />
            <polygon points="15,8 24,26 6,26" fill="#D9232A" />
          </g>
          <text x="44" y="26" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="17" letterSpacing="1.5">
            TRIATRA
          </text>
          <text x="44" y="36" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="7" letterSpacing="0.5" fill="#71717A">
            SINERGIA MADANI
          </text>
        </svg>
      );

    case "pmp":
      return (
        <svg viewBox="0 0 190 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="Patria Maritim Perkasa">
          <g transform="translate(6, 7)">
            <circle cx="17" cy="17" r="16" fill="#D9232A" />
            <path d="M7 17 Q17 7 27 17 Q17 27 7 17 Z" fill="#FFFFFF" />
          </g>
          <text x="46" y="23" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="15" letterSpacing="1">
            PMP
          </text>
          <text x="46" y="34" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="8" letterSpacing="0.5" fill="#71717A">
            PATRIA MARITIM PERKASA
          </text>
        </svg>
      );

    case "trust":
      return (
        <svg viewBox="0 0 160 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="TRUST Melak">
          <g transform="translate(6, 8)">
            <rect x="0" y="0" width="30" height="30" rx="5" fill="#000000" />
            <path d="M6 7 H24 V12 H18 V25 H12 V12 H6 Z" fill="#D9232A" />
          </g>
          <text x="44" y="26" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="19" letterSpacing="1.5">
            TRUST
          </text>
          <text x="44" y="36" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7.5" letterSpacing="0.5" fill="#71717A">
            TAMBANG RAYA USAHA TAMA
          </text>
        </svg>
      );

    case "ipr":
      return (
        <svg viewBox="0 0 170 48" className="h-9 sm:h-10 w-auto fill-current" aria-label="IPR Tabang">
          <g transform="translate(6, 8)">
            <circle cx="15" cy="15" r="15" fill="#000000" />
            <text x="15" y="21" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="14" fill="#D9232A" textAnchor="middle">
              IPR
            </text>
          </g>
          <text x="42" y="24" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="16" letterSpacing="1">
            IPR TABANG
          </text>
          <text x="42" y="35" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="7" letterSpacing="0.5" fill="#71717A">
            INDONESIA PRATAMA REGION
          </text>
        </svg>
      );

    default:
      return null;
  }
}

export default function ClientLogosCarousel() {
  // Duplicated list to create a seamless infinite scroll loop
  const duplicatedClients = [...clients, ...clients];

  return (
    <div className="w-full overflow-hidden py-4 select-none">
      {/* Scrollable Container with horizontal touch support and continuous CSS marquee */}
      <div
        className="w-full overflow-x-auto overscroll-x-contain pb-2 focus:outline-hidden scrollbar-none"
        tabIndex={0}
        role="region"
        aria-label="Carousel Logo Klien dan Mitra Strategis PT DPP"
      >
        <div className="animate-marquee items-center gap-10 sm:gap-14 px-4">
          {duplicatedClients.map((client, index) => (
            <div
              key={`${client.id}-${index}`}
              className="shrink-0 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-90 hover:opacity-100 hover:scale-105"
              title={client.name}
            >
              <ClientLogoSvg client={client} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
