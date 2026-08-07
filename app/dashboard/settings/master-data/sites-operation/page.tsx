"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';

const STAGES = [
  { id: 'stage_1', title: 'Administration' },
  { id: 'stage_2', title: 'HR Interview' },
  { id: 'stage_3', title: 'Psychological Test' },
  { id: 'stage_4', title: 'Test Skill Verification' },
  { id: 'stage_5', title: 'User Interview' },
  { id: 'stage_6', title: 'Offering Letter' },
  { id: 'stage_7', title: 'MCU' },
  { id: 'stage_8', title: 'Training User' },
  { id: 'stage_9', title: 'Induction' },
  { id: 'stage_10', title: 'PWKT' },
];

export default function SitesOperationMaster() {
  const modal = useModal();
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    siteName: '', 
    longitude: '', 
    latitude: '', 
    slaMethod: 'Internal SLA',
    specificSla: {} as Record<string, { totalDays: number; reminderDays: number }>
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

  const handleUpdateSpecificSla = (stageId: string, field: 'totalDays' | 'reminderDays', value: number) => {
    setFormData(prev => {
      const currentSla = { ...prev.specificSla };
      const currentData = currentSla[stageId] || { totalDays: 0, reminderDays: 0 };
      
      let newTotalDays = field === 'totalDays' ? Math.max(0, value) : currentData.totalDays;
      let newReminderDays = field === 'reminderDays' ? Math.max(0, value) : currentData.reminderDays;
      
      if (newReminderDays > newTotalDays) {
        newReminderDays = newTotalDays;
      }

      currentSla[stageId] = {
        totalDays: newTotalDays,
        reminderDays: newReminderDays
      };

      return { ...prev, specificSla: currentSla };
    });
  };

  const handleSave = () => {
    if (!formData.siteName) return;
    
    // Validate specific SLA if selected
    if (formData.slaMethod === 'Specific') {
      for (const stage of STAGES) {
        const data = formData.specificSla[stage.id] || { totalDays: 0, reminderDays: 0 };
        if (data.reminderDays > data.totalDays) {
          alert(`Reminder pada ${stage.title} tidak boleh lebih besar dari Total Hari.`);
          return;
        }
      }
    }

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
    setFormData({ siteName: '', longitude: '', latitude: '', slaMethod: 'Internal SLA', specificSla: {} });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data ini?", true)) {
      saveToLocal(data.filter(item => item.id !== id));
    }
  };

  const startEdit = (item: any) => {
    setIsEditing(item.id);
    
    // Ensure default specificSla if missing
    let initialSla = item.specificSla || {};
    if (Object.keys(initialSla).length === 0) {
      STAGES.forEach(s => {
        initialSla[s.id] = { totalDays: 0, reminderDays: 0 };
      });
    }

    setFormData({ 
      siteName: item.siteName, 
      longitude: item.longitude || '', 
      latitude: item.latitude || '', 
      slaMethod: item.slaMethod || 'Internal SLA',
      specificSla: initialSla
    });
    setIsModalOpen(true);
  };

  const startAdd = () => {
    setIsEditing(null);
    
    const initialSla: Record<string, any> = {};
    STAGES.forEach(s => {
      initialSla[s.id] = { totalDays: 0, reminderDays: 0 };
    });

    setFormData({ siteName: '', longitude: '', latitude: '', slaMethod: 'Internal SLA', specificSla: initialSla });
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
            <h2 className="text-lg font-bold text-primary">Sites Operation Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola master data operasional site (lokasi & SLA)</p>
          </div>
          <button 
            onClick={startAdd}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest shrink-0">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit Site Operation" : "Add New Site Operation"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-on-surface-variant hover:text-status-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Site Name <span className="text-status-error">*</span></label>
                    <input 
                      type="text" 
                      value={formData.siteName}
                      onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                      placeholder="e.g. HO Jakarta, Site Berau"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Select SLA Methode</label>
                    <select
                      value={formData.slaMethod}
                      onChange={(e) => setFormData({ ...formData, slaMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black bg-white"
                    >
                      <option value="Internal SLA">Internal SLA</option>
                      <option value="Specific">Define Specific for this Site Operation</option>
                    </select>
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

                {formData.slaMethod === 'Specific' && (
                  <div className="mt-8 border border-table-border rounded-lg overflow-hidden">
                    <div className="bg-surface-container-lowest p-4 border-b border-table-border">
                      <h4 className="font-bold text-sm text-primary">Specific SLA Configuration</h4>
                      <p className="text-xs text-on-surface-variant mt-1">Konfigurasi SLA khusus untuk site ini.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-on-surface bg-table-header-bg uppercase border-b border-table-border">
                          <tr>
                            <th className="px-4 py-3 w-12">Stage</th>
                            <th className="px-4 py-3">Nama Tahapan</th>
                            <th className="px-4 py-3 text-center">Total SLA (Hari)</th>
                            <th className="px-4 py-3 text-center">Reminder (Hari)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-table-border">
                          {STAGES.map((stage, idx) => {
                            const data = formData.specificSla[stage.id] || { totalDays: 0, reminderDays: 0 };
                            const isUnlimitedStage = ['stage_8', 'stage_9', 'stage_10'].includes(stage.id);
                            return (
                              <tr key={stage.id} className="hover:bg-surface-container-lowest transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-on-surface-variant text-center">{idx + 1}</td>
                                <td className="px-4 py-3 font-semibold text-black">{stage.title}</td>
                                <td className="px-4 py-3 text-center">
                                  {isUnlimitedStage && data.totalDays === 0 ? (
                                    <button 
                                      type="button"
                                      onClick={() => handleUpdateSpecificSla(stage.id, 'totalDays', 1)}
                                      title="Klik untuk mengubah hari"
                                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-200 hover:bg-blue-100 transition-colors"
                                    >
                                      Unlimited
                                    </button>
                                  ) : (
                                    <input 
                                      type="number" 
                                      min="0"
                                      value={data.totalDays === 0 ? '' : data.totalDays}
                                      onChange={e => handleUpdateSpecificSla(stage.id, 'totalDays', parseInt(e.target.value) || 0)}
                                      className="w-20 px-2 py-1.5 border border-outline-variant rounded text-center text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black"
                                      placeholder="0"
                                    />
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isUnlimitedStage && data.totalDays === 0 ? (
                                    <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                                      N/A
                                    </span>
                                  ) : (
                                    <input 
                                      type="number" 
                                      min="0"
                                      value={data.reminderDays === 0 ? '' : data.reminderDays}
                                      onChange={e => handleUpdateSpecificSla(stage.id, 'reminderDays', parseInt(e.target.value) || 0)}
                                      className="w-20 px-2 py-1.5 border border-outline-variant rounded text-center text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black"
                                      placeholder="0"
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-2 shrink-0">
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
                <th className="px-6 py-3">Site Name</th>
                <th className="px-6 py-3">Coordinate</th>
                <th className="px-6 py-3">SLA Methode</th>
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
                    <td className="px-6 py-4">
                      {item.slaMethod === 'Specific' ? (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold uppercase border border-amber-200">
                          Specific
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-bold uppercase border border-gray-200">
                          Internal
                        </span>
                      )}
                    </td>
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
