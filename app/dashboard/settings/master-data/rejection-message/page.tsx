"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { MASTER_REJECTION_MESSAGE } from '@/lib/masterData';

const STAGES = [
  { id: "stage_1", title: "Administration" },
  { id: "stage_2", title: "HR Interview" },
  { id: "stage_3", title: "Psychological Test" },
  { id: "stage_4", title: "Test Skill Verification" },
  { id: "stage_5", title: "User Interview" },
  { id: "stage_6", title: "Offering Letter" },
  { id: "stage_7", title: "MCU" },
  { id: "stage_8", title: "Training User" },
  { id: "stage_9", title: "Induction" },
  { id: "stage_10", title: "PWKT" },
];

export default function RejectionMessageMaster() {
  const modal = useModal();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ stageId: '', message: '' });

  useEffect(() => {
    const saved = localStorage.getItem('ugz_master_rejection_message');
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData(MASTER_REJECTION_MESSAGE);
      localStorage.setItem('ugz_master_rejection_message', JSON.stringify(MASTER_REJECTION_MESSAGE));
    }
  }, []);

  const saveToLocal = (newData: any[]) => {
    setData(newData);
    localStorage.setItem('ugz_master_rejection_message', JSON.stringify(newData));
  };

  const handleSave = () => {
    if (!formData.stageId || !formData.message) return;
    
    if (isEditing) {
      const updated = data.map(item => 
        item.id === isEditing ? { ...item, ...formData } : item
      );
      saveToLocal(updated);
    } else {
      const newItem = { id: `R-${Date.now()}`, ...formData };
      saveToLocal([...data, newItem]);
    }
    
    setIsEditing(null);
    setFormData({ stageId: '', message: '' });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data ini?", true)) {
      saveToLocal(data.filter(item => item.id !== id));
    }
  };

  const startEdit = (item: any) => {
    setIsEditing(item.id);
    setFormData({ stageId: item.stageId, message: item.message });
    setIsModalOpen(true);
  };

  const getStageTitle = (stageId: string) => {
    return STAGES.find(s => s.id === stageId)?.title || stageId;
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/master-data" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Master Data
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-primary">Rejection Message Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola master data pesan penolakan per stage</p>
          </div>
          <button 
            onClick={() => { setIsEditing(null); setFormData({ stageId: "", message: "" }); setIsModalOpen(true); }}
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
                  {isEditing ? "Edit Rejection Message" : "Add New Rejection Message"}
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
                  <label className="block text-xs font-semibold text-on-surface mb-1">Stage <span className="text-status-error">*</span></label>
                  <select
                    value={formData.stageId}
                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black bg-white"
                  >
                    <option value="">-- Pilih Stage --</option>
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Rejection Message <span className="text-status-error">*</span></label>
                  <input 
                    type="text" 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                    placeholder="Contoh: Dokumen Tidak Lengkap"
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
                  className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
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
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Stage</th>
                <th className="px-6 py-3">Rejection Message</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">Belum ada data.</td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 font-mono text-black">{item.id}</td>
                    <td className="px-6 py-4 font-medium text-black">{getStageTitle(item.stageId)}</td>
                    <td className="px-6 py-4 text-black">{item.message}</td>
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
