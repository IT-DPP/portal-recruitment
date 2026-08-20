"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export default function PrivacyModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Mengecek apakah kandidat baru saja login
    const shouldShow = sessionStorage.getItem("showPrivacyModal");
    if (shouldShow === "true") {
      setIsOpen(true);
      // Hapus flag agar modal tidak muncul lagi pada saat refresh
      sessionStorage.removeItem("showPrivacyModal");
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 text-center relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-black rounded-lg transition-colors outline-none focus:ring-2 focus:ring-primary/20"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 mt-2 ring-8 ring-blue-50/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-extrabold text-black mb-3 tracking-tight">
            Komitmen Privasi & Keamanan Data
          </h3>
          
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            Informasi dan data pribadi Anda dijamin aman. Kami memastikan bahwa seluruh data yang Anda unggah <strong>hanya digunakan secara eksklusif untuk keperluan proses rekrutmen</strong> dan tidak akan dibagikan kepada pihak yang tidak berkepentingan.
          </p>
          
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm outline-none focus:ring-4 focus:ring-primary/20"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
