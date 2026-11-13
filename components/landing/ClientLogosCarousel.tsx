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

export default function ClientLogosCarousel() {
  // Duplicated list (repeated 4x) to create a completely seamless infinite loop
  const duplicatedLogos = [
    ...clientLogos,
    ...clientLogos,
    ...clientLogos,
    ...clientLogos,
  ];

  return (
    <div className="w-full overflow-hidden py-6 select-none bg-white">
      {/* Scrollable Container with horizontal touch support and continuous CSS marquee */}
      <div
        className="w-full overflow-x-auto overscroll-x-contain pb-2 focus:outline-hidden scrollbar-none"
        tabIndex={0}
        role="region"
        aria-label="Carousel Logo Klien dan Mitra Strategis PT DPP"
      >
        <div className="animate-marquee items-center gap-12 sm:gap-16 lg:gap-20 px-6">
          {duplicatedLogos.map((client, index) => (
            <div
              key={`${client.id}-${index}`}
              className="shrink-0 flex items-center justify-center p-3 h-20 transition-all duration-300 hover:scale-105"
              title={client.name}
            >
              <Image
                src={client.src}
                alt={client.name}
                width={client.width}
                height={client.height}
                className="max-h-12 sm:max-h-14 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
