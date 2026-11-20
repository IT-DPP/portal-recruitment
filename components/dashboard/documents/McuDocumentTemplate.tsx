"use client";

import React from "react";
import { McuClinic, DEFAULT_MCU_CONTACT } from "@/lib/mcu-clinics";

export interface McuCandidateItem {
  id?: string;
  nama: string;
  nik: string;
  posisi: string;
  kategori: string;
  paketMcu: string;
}

export interface McuDocumentTemplateProps {
  id?: string;
  nomorSurat: string;
  perihal?: string;
  klinik: McuClinic;
  candidates: McuCandidateItem[];
  contact?: typeof DEFAULT_MCU_CONTACT;
  tanggalSurat?: string;
  logoSrc?: string;
  showSignature?: boolean;
}

export default function McuDocumentTemplate({
  id = "mcu-pdf-template",
  nomorSurat,
  perihal = "Surat Pengantar MCU",
  klinik,
  candidates,
  contact = DEFAULT_MCU_CONTACT,
  tanggalSurat,
  logoSrc = "/logo_company.png",
  showSignature = true,
}: McuDocumentTemplateProps) {
  const currentDateFormatted =
    tanggalSurat ||
    new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div
      id={id}
      style={{
        width: "794px",
        minHeight: "1123px",
        backgroundColor: "#ffffff",
        padding: "36px 46px 36px 46px",
        fontFamily: "'Times New Roman', Times, serif",
        color: "#000000",
        fontSize: "13px",
        lineHeight: "1.45",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Background Watermark (Subtle) */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.035,
          pointerEvents: "none",
          textAlign: "center",
          zIndex: 0,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          style={{ width: "260px", height: "auto", margin: "0 auto 12px auto" }}
        />
        <div
          style={{
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "4px",
            color: "#000000",
          }}
        >
          DIAN PANDU PRATAMA
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header: Logo Company (Top Right) */}
        <table
          style={{
            width: "100%",
            marginBottom: "10px",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top" }}>
                {/* No. Surat & Perihal on the top-left */}
                <table style={{ borderCollapse: "collapse", fontSize: "13px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "80px", padding: "1px 0", verticalAlign: "top" }}>
                        No. Surat
                      </td>
                      <td style={{ width: "16px", padding: "1px 0", verticalAlign: "top" }}>
                        :
                      </td>
                      <td style={{ padding: "1px 0", fontWeight: "normal" }}>
                        {nomorSurat || "DPP/807/SKE/X/2026"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "1px 0", verticalAlign: "top" }}>Perihal</td>
                      <td style={{ padding: "1px 0", verticalAlign: "top" }}>:</td>
                      <td style={{ padding: "1px 0" }}>{perihal}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ textAlign: "right", verticalAlign: "top", padding: 0 }}>
                <div style={{ display: "inline-block", textAlign: "center" }}>
                  <img
                    src={logoSrc}
                    alt="Logo PT Dian Pandu Pratama"
                    style={{
                      width: "60px",
                      height: "48px",
                      margin: "0 auto 2px auto",
                      display: "block",
                      objectFit: "contain",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      textTransform: "lowercase",
                      letterSpacing: "0.5px",
                      margin: 0,
                      color: "#111111",
                    }}
                  >
                    dian pandu pratama
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Recipient Section */}
        <div style={{ marginTop: "12px", marginBottom: "14px", lineHeight: "1.4" }}>
          <p style={{ margin: "0 0 6px 0" }}>Kepada Yth,</p>
          <p style={{ margin: "0 0 2px 0", fontWeight: "bold" }}>
            {klinik?.name || klinik?.nama || "Klinik Rekanan MCU"}
          </p>
          <p
            style={{
              margin: "0 0 2px 0",
              fontWeight: "bold",
              maxWidth: "600px",
              lineHeight: "1.35",
            }}
          >
            {klinik?.address ||
              klinik?.alamat ||
              "Alamat klinik belum ditentukan"}
          </p>
          <p style={{ margin: 0, fontWeight: "bold" }}>Di-Tempat</p>
        </div>

        {/* Salutation & Intro */}
        <div style={{ marginBottom: "12px" }}>
          <p style={{ margin: "0 0 2px 0" }}>Dengan Hormat,</p>
          <p style={{ margin: 0 }}>
            Mohon untuk dapat diberikan pelayanan medis kepada karyawan PT. Dian
            Pandu Pratama, berikut :
          </p>
        </div>

        {/* Table of Candidates */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #000000",
            marginBottom: "14px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#d5dfb5" }}>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "5px 4px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "5%",
                }}
              >
                NO
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "5px 6px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "24%",
                }}
              >
                NAMA
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "5px 4px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "19%",
                }}
              >
                NIK
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "5px 4px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "14%",
                }}
              >
                POSISI
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "5px 4px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "14%",
                }}
              >
                KATEGORI
              </th>
              <th
                style={{
                  border: "1px solid #000000",
                  padding: "5px 6px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "24%",
                }}
              >
                PAKET MCU
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates && candidates.length > 0 ? (
              candidates.map((cand, idx) => (
                <tr key={cand.id || idx}>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px 4px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: "11px",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px 8px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontWeight: "normal",
                      fontSize: "11px",
                      textTransform: "uppercase",
                    }}
                  >
                    {cand.nama}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px 4px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: "11px",
                      fontFamily: "monospace, Courier, sans-serif",
                    }}
                  >
                    {cand.nik || "-"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px 4px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: "11px",
                      textTransform: "uppercase",
                    }}
                  >
                    {cand.posisi}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px 4px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: "11px",
                      textTransform: "uppercase",
                    }}
                  >
                    {cand.kategori || "PRE EMPLOYEE"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000000",
                      padding: "6px 8px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      fontSize: "10px",
                      lineHeight: "1.35",
                      textTransform: "uppercase",
                    }}
                  >
                    {cand.paketMcu || klinik?.defaultPaket}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    border: "1px solid #000000",
                    padding: "16px",
                    textAlign: "center",
                    color: "#666",
                    fontStyle: "italic",
                  }}
                >
                  Belum ada kandidat MCU yang dipilih.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Further Medical Attention Contact Section */}
        <div style={{ marginBottom: "12px", fontSize: "12.5px" }}>
          <p style={{ margin: "0 0 4px 0" }}>
            Apabila yang bersangkutan memerlukan tindakan medis lebih lanjut
            harap segera menghubungi :
          </p>
          <table
            style={{
              borderCollapse: "collapse",
              marginLeft: "18px",
              marginBottom: "6px",
              fontSize: "12.5px",
            }}
          >
            <tbody>
              <tr>
                <td style={{ width: "95px", padding: "1px 0" }}>Nama</td>
                <td style={{ width: "16px", padding: "1px 0" }}>:</td>
                <td style={{ padding: "1px 0" }}>
                  {contact?.picName || "Annisa Nur Cahya Rahmadani"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "1px 0" }}>Jabatan</td>
                <td style={{ padding: "1px 0" }}>:</td>
                <td style={{ padding: "1px 0" }}>
                  {contact?.picJabatan || "Recruitment Staff"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "1px 0" }}>No. Telepon</td>
                <td style={{ padding: "1px 0" }}>:</td>
                <td style={{ padding: "1px 0" }}>
                  {contact?.picPhone || "0895-2305-7314"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Results Email Instructions */}
        <div style={{ marginBottom: "12px", fontSize: "12.5px" }}>
          <p style={{ margin: "0 0 3px 0" }}>
            Kemudian untuk hasil MCU <strong>(WAJIB)</strong> harap dikirimkan ke
            :
          </p>
          <ul
            style={{
              margin: "2px 0 6px 0",
              paddingLeft: "26px",
              lineHeight: "1.4",
            }}
          >
            {(contact?.resultEmails || [
              "annisa.rahmadani@dpp.co.id",
              "indrajid.k@dpp.co.id",
              "RecruitmentTeam@dpp.co.id",
              "m.hidayat@dpp.co.id",
              "pretty.tm@dpp.co.id",
              "deo.felix@dpp.co.id",
            ]).map((email, idx) => (
              <li key={idx} style={{ marginBottom: "1px" }}>
                <a
                  href={`mailto:${email}`}
                  style={{
                    color: "#0000ee",
                    textDecoration: "underline",
                  }}
                >
                  {email}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Billing Address Section */}
        <div
          style={{
            marginLeft: "80px",
            marginBottom: "16px",
            fontSize: "12.5px",
            maxWidth: "600px",
            lineHeight: "1.35",
          }}
        >
          <p style={{ margin: "0 0 2px 0" }}>
            Tagihan biaya resume medis harap dikirimkan ke:
          </p>
          <p style={{ margin: "0 0 2px 0", fontWeight: "bold" }}>
            {contact?.billing?.company || "PT. Dian Pandu Pratama"}
          </p>
          <p style={{ margin: "0 0 2px 0" }}>
            Up : M Irfan Dzul Izzudin/{" "}
            <a
              href="mailto:irfandzul@dpp.co.id"
              style={{ color: "#0000ee", textDecoration: "underline" }}
            >
              irfandzul@dpp.co.id
            </a>
          </p>
          <p style={{ margin: 0 }}>
            {contact?.billing?.address ||
              "Jl. Jababeka Blok I Kawasan Industri Jababeka (Patria Pos 7) Desa Harja Mekar, Kec. Cikarang Utara, Kab. Bekasi, Jawa Barat, 17530"}
          </p>
        </div>

        {/* Closing Text */}
        <div style={{ marginBottom: "14px", fontSize: "12.5px" }}>
          <p style={{ margin: 0 }}>
            Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
          </p>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: "10px", fontSize: "12.5px" }}>
          <p style={{ margin: "0 0 3px 0" }}>
            {contact?.signee?.city || "Cikarang"},{" "}
            {currentDateFormatted}
          </p>
          <p style={{ margin: "0 0 2px 0" }}>Hormat kami,</p>
          <p style={{ margin: "0 0 2px 0" }}>
            {contact?.billing?.company || "PT. Dian Pandu Pratama"}
          </p>

          {/* Ruang Tanda Tangan Basah & Cap Stempel Fisik (Manual) */}
          <div
            style={{
              position: "relative",
              width: "160px",
              height: "64px",
              margin: "6px 0",
            }}
          />

          <p
            style={{
              margin: "0 0 2px 0",
              fontWeight: "bold",
              textDecoration: "underline",
              fontSize: "13px",
            }}
          >
            {contact?.signee?.name || "Mursidi"}
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#111111" }}>
            {contact?.signee?.title || "Recruitment & Development Dept. Head"}
          </p>
        </div>

        {/* Footer Address */}
        <div
          style={{
            marginTop: "32px",
            paddingTop: "8px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
            fontSize: "10px",
            color: "#333333",
          }}
        >
          <div style={{ textAlign: "right", lineHeight: "1.3" }}>
            <p style={{ margin: 0 }}>
              Jl. Jababeka XII Blok I Kawasan Industri
            </p>
            <p style={{ margin: 0 }}>Jababeka Cikarang 17530 – Indonesia</p>
          </div>
          <div
            style={{
              width: "2px",
              height: "24px",
              backgroundColor: "#dc2626",
            }}
          />
          <div style={{ fontSize: "16px", color: "#475569" }}>📍</div>
        </div>
      </div>
    </div>
  );
}
