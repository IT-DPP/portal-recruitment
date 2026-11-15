"use client";

import React from "react";
import Image from "next/image";

export interface ClientLogoItem {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
}

const clientLogos: ClientLogoItem[] = [
  {
    id: "patria-astra",
    name: "PATRIA member of ASTRA",
    src: "/images/branding/clients/patria-astra.png",
    width: 320,
    height: 78,
  },
  {
    id: "triatra",
    name: "TRIATRA",
    src: "/images/branding/clients/triatra.png",
    width: 320,
    height: 41,
  },
  {
    id: "united-tractors",
    name: "UNITED TRACTORS member of ASTRA",
    src: "/images/branding/clients/united-tractors.png",
    width: 320,
    height: 72,
  },
  {
    id: "patria-maritim",
    name: "PATRIA Maritim Perkasa",
    src: "/images/branding/clients/patria-maritim-perkasa.png",
    width: 280,
    height: 72,
  },
  {
    id: "patria-lines",
    name: "PATRIA Maritime Lines",
    src: "/images/branding/clients/patria-maritime-lines.png",
    width: 280,
    height: 78,
  },
];

export default function ClientLogosCarousel({ compact = false }: { compact?: boolean }) {
  // Duplicated list (repeated 4x) to create a completely seamless infinite loop
  const duplicatedLogos = [
    ...clientLogos,
    ...clientLogos,
    ...clientLogos,
    ...clientLogos,
  ];

  return (
    <div className={`w-full overflow-hidden select-none ${compact ? "py-2 bg-transparent" : "py-4 bg-white"}`}>
      {/* Scrollable Container with horizontal touch support and continuous CSS marquee */}
      <div
        className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden scrollbar-none"
        tabIndex={0}
        role="region"
        aria-label="Carousel Logo Klien dan Mitra Strategis PT DPP"
      >
        <div className="animate-marquee items-center gap-8 sm:gap-12 lg:gap-14 px-4">
          {duplicatedLogos.map((client, index) => (
            <div
              key={`${client.id}-${index}`}
              className="shrink-0 flex items-center justify-center p-1.5 transition-all duration-200 hover:opacity-100 opacity-80"
              title={client.name}
            >
              <Image
                src={client.src}
                alt={client.name}
                width={client.width}
                height={client.height}
                className={compact ? "max-h-6 sm:max-h-7 md:max-h-8 w-auto object-contain" : "max-h-10 sm:max-h-12 w-auto object-contain"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
