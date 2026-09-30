"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/app/actions/master-data';

export default function DepartmentMaster() {
  const modal = useModal();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getDepartments();
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return;
    setIsSaving(true);
    
    if (isEditing) {
      const res = await updateDepartment(isEditing, { name: formData.name });
      if (res.success) {
        await loadData();
      } else {
        alert(res.error);
      }
    } else {
      const res = await createDepartment({ name: formData.name });
      if (res.success) {
        await loadData();
      } else {
        alert(res.error);
      }
    }
    
    setIsSaving(false);
    setIsEditing(null);
    setFormData({ name: '' });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data ini?", true)) {
      const res = await deleteDepartment(id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error);
      }
    }
  };

  const startEdit = (item: any) => {
    setIsEditing(item.id);
    setFormData({ name: item.name });
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
            <h2 className="text-lg font-bold text-primary">Department Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola master data departemen</p>
          </div>
          <button 
            onClick={() => { setIsEditing(null); setFormData({ name: "" }); setIsModalOpen(true); }}
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
                  {isEditing ? "Edit Department" : "Add New Department"}
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
                  <label className="block text-xs font-semibold text-on-surface mb-1">Department Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                    placeholder="Enter department name"
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
                  disabled={isSaving}
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
                <th className="px-6 py-3">Department Name</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-on-surface-variant">Belum ada data.</td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">{index + 1}</td>
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
