"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';

export default function SitesOperationMaster() {
  const modal = useModal();
  const [data, setData] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    siteName: '', 
    longitude: '', 
    latitude: '', 
    slaDueDate: '' 
  });

  useEffect(() => {
    const saved = localStorage.getItem('ugz_master_sites_operation');
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  const saveToLocal = (newData: any[]) => {
    setData(newData);
    localStorage.setItem('ugz_master_sites_operation', JSON.stringify(newData));
  };

  const handleSave = () => {
    if (!formData.siteName) return;
    
    if (isEditing) {
      const updated = data.map(item => 
        item.id === isEditing ? { ...item, ...formData } : item
      );
      saveToLocal(updated);
    } else {
      const newItem = { id: Date.now().toString(), ...formData };
      saveToLocal([...data, newItem]);
    }
    
    setIsEditing(null);
    setFormData({ siteName: '', longitude: '', latitude: '', slaDueDate: '' });
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data ini?", true)) {
      saveToLocal(data.filter(item => item.id !== id));
    }
  };

  const startEdit = (item: any) => {
    setIsEditing(item.id);
    setFormData({ 
      siteName: item.siteName, 
      longitude: item.longitude || '', 
      latitude: item.latitude || '', 
      slaDueDate: item.slaDueDate || '' 
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setFormData({ siteName: '', longitude: '', latitude: '', slaDueDate: '' });
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/master-data" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Master Data
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-primary">Sites Operation Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola master data operasional site (lokasi & SLA)</p>
          </div>
        </div>

        <div className="p-6 bg-surface-container-low border-b border-table-border">
          <div className="flex flex-col gap-4 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Site Name</label>
                <input 
                  type="text" 
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                  placeholder="e.g. HO Jakarta, Site Berau"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">SLA Due Date (Days)</label>
                <input 
                  type="number" 
                  value={formData.slaDueDate}
                  onChange={(e) => setFormData({ ...formData, slaDueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                  placeholder="e.g. 14"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Longitude</label>
                <input 
                  type="text" 
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                  placeholder="e.g. 106.8227"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Latitude</label>
                <input 
                  type="text" 
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                  placeholder="e.g. -6.1731"
                />
              </div>
            </div>
            <div className="flex gap-2 self-start mt-2">
              {isEditing && (
                <button onClick={cancelEdit} className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded text-sm hover:bg-outline-variant transition-colors flex items-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
              <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2">
                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? 'Update' : 'Add New'}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-on-surface bg-table-header-bg uppercase border-b border-table-border">
              <tr>
                <th className="px-6 py-3 w-16">No</th>
                <th className="px-6 py-3">Site Name</th>
                <th className="px-6 py-3">Coordinate</th>
                <th className="px-6 py-3">SLA (Days)</th>
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
                    <td className="px-6 py-4 font-medium text-black">{item.siteName}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-[11px]">
                      {item.latitude || '-'}, {item.longitude || '-'}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{item.slaDueDate ? `${item.slaDueDate} Hari` : '-'}</td>
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
