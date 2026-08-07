"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/components/providers/ModalProvider";

export default function CityMaster() {
  const modal = useModal();
  const [data, setData] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", provinceId: "" });

  useEffect(() => {
    const savedCities = localStorage.getItem("ugz_master_city");
    if (savedCities) {
      setData(JSON.parse(savedCities));
    }

    const savedProvinces = localStorage.getItem("ugz_master_province");
    if (savedProvinces) {
      setProvinces(JSON.parse(savedProvinces));
    }
  }, []);

  const saveToLocal = (newData: any[]) => {
    setData(newData);
    localStorage.setItem("ugz_master_city", JSON.stringify(newData));
  };

  const handleSave = () => {
    if (!formData.name || !formData.provinceId) return;

    if (isEditing) {
      const updated = data.map((item) =>
        item.id === isEditing ? { ...item, ...formData } : item,
      );
      saveToLocal(updated);
    } else {
      const newItem = { id: Date.now().toString(), ...formData };
      saveToLocal([...data, newItem]);
    }

    setIsEditing(null);
    setFormData({ name: "", provinceId: "" });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (
      await modal.confirm(
        "Konfirmasi Hapus",
        "Apakah Anda yakin ingin menghapus data ini?",
        true,
      )
    ) {
      saveToLocal(data.filter((item) => item.id !== id));
    }
  };

  const startEdit = (item: any) => {
    setIsEditing(item.id);
    setFormData({ name: item.name, provinceId: item.provinceId });
    setIsModalOpen(true);
  };

  const getProvinceName = (provinceId: string) => {
    const prov = provinces.find((p) => p.id === provinceId);
    return prov ? prov.name : "-";
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/settings/master-data"
        className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Master Data
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-primary">
              City / Regency Master
            </h2>
            <p className="text-xs text-on-surface-variant">
              Kelola master data kota/kabupaten dengan relasi ke provinsi
            </p>
          </div>
          <button 
            onClick={() => { setIsEditing(null); setFormData({ name: "", provinceId: "" }); setIsModalOpen(true); }}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit City / Regency" : "Add New City / Regency"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-on-surface-variant hover:text-status-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Province <span className="text-status-error">*</span>
                  </label>
                  <select
                    value={formData.provinceId}
                    onChange={(e) =>
                      setFormData({ ...formData, provinceId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black bg-white"
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    {provinces.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    City / Regency Name <span className="text-status-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                    placeholder="e.g. Bandung, Jakarta Selatan"
                  />
                </div>
                {provinces.length === 0 && (
                  <p className="text-xs text-status-warning">
                    Peringatan: Anda belum menambahkan data Provinsi. Harap tambahkan
                    Provinsi terlebih dahulu.
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded text-sm hover:bg-outline-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={provinces.length === 0}
                  className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-on-surface bg-table-header-bg uppercase border-b border-table-border">
              <tr>
                <th className="px-6 py-3 w-16">No</th>
                <th className="px-6 py-3">City / Regency Name</th>
                <th className="px-6 py-3">Province</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-on-surface-variant"
                  >
                    Belum ada data.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b border-table-border hover:bg-surface-container-low/50"
                  >
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-black">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {getProvinceName(item.provinceId)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-primary hover:text-primary-container mr-3"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-status-error hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
