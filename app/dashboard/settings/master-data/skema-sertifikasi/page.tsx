"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { useClientTable } from '@/hooks/useClientTable';
import TableControls from '@/components/ui/TableControls';
import {
  getCertificationSchemas,
  createCertificationSchema,
  updateCertificationSchema,
  deleteCertificationSchema,
} from '@/app/actions/master-data';
import { MASTER_SKEMA_SERTIFIKASI } from '@/lib/masterData';

export default function SkemaSertifikasiMaster() {
  const modal = useModal();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getCertificationSchemas();
    if (res.success && res.data) {
      if (res.data.length === 0) {
        // Auto-seed from MASTER_SKEMA_SERTIFIKASI if database is empty
        try {
          for (const item of MASTER_SKEMA_SERTIFIKASI) {
            await createCertificationSchema({ name: item.name, code: item.id });
          }
          const seeded = await getCertificationSchemas();
          if (seeded.success && seeded.data) {
            setData(seeded.data);
          }
        } catch {
          setData(res.data);
        }
      } else {
        setData(res.data);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const table = useClientTable({
    data,
    searchKeys: ['name', 'code', 'id'],
    initialRowsPerPage: 10,
    debounceMs: 300,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setIsSaving(true);

    if (isEditing) {
      const res = await updateCertificationSchema(isEditing, {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
      });
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Gagal mengupdate data");
      }
    } else {
      const res = await createCertificationSchema({
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
      });
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Gagal menambah data");
      }
    }

    setIsSaving(false);
    setIsEditing(null);
    setFormData({ name: '', code: '' });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus skema sertifikasi ini?", true)) {
      const res = await deleteCertificationSchema(id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Gagal menghapus data");
      }
    }
  };

  const startEdit = (item: any) => {
    setIsEditing(item.id);
    setFormData({ name: item.name, code: item.code || item.id || '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/master-data" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Master Data
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-primary">Skema Sertifikasi (BNSP) Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola master data skema sertifikasi BNSP dalam database</p>
          </div>
          <button 
            onClick={() => { setIsEditing(null); setFormData({ name: "", code: "" }); setIsModalOpen(true); }}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {/* Reusable Table Controls with Debounced Search, Rows Per Page & Pagination */}
        <TableControls
          {...table}
          searchPlaceholder="Cari nama atau kode skema sertifikasi..."
          rowsPerPageOptions={[10, 25, 50, 100]}
          isLoading={isLoading}
        />

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit Skema Sertifikasi" : "Add New Skema Sertifikasi"}
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
                  <label className="block text-xs font-semibold text-on-surface mb-1">Kode / ID Skema</label>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black font-mono"
                    placeholder="Contoh: SKM-K3-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Nama Skema Sertifikasi</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                    placeholder="Contoh: Ahli K3 Umum"
                  />
                </div>
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
                  disabled={isSaving || !formData.name.trim()}
                  className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
                <th className="px-6 py-3">ID / Kode</th>
                <th className="px-6 py-3">Nama Skema Sertifikasi</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
                    </div>
                  </td>
                </tr>
              ) : table.paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                    {table.debouncedSearch ? "Tidak ada skema sertifikasi yang sesuai pencarian." : "Belum ada data."}
                  </td>
                </tr>
              ) : (
                table.paginatedData.map((item, index) => (
                  <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">{table.startIndex + index}</td>
                    <td className="px-6 py-4 font-mono text-black font-semibold">{item.code || item.id}</td>
                    <td className="px-6 py-4 font-medium text-black">{item.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => startEdit(item)} className="text-primary hover:text-primary-container mr-3">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-status-error hover:text-red-700">
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
