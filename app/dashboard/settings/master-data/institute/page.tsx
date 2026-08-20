"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { MASTER_INSTITUTE, type Institute, type InstituteType, type InstituteStatus } from '@/lib/masterData';

const INSTITUTE_TYPES: InstituteType[] = ["Perguruan Tinggi", "SLTA", "SLTP", "SD", "BPVP", "BLK", "LPK"];
const INSTITUTE_STATUSES: InstituteStatus[] = ["Swasta", "Negeri"];

const TYPE_COLORS: Record<InstituteType, string> = {
  "Perguruan Tinggi": "bg-purple-100 text-purple-700",
  "SLTA": "bg-blue-100 text-blue-700",
  "SLTP": "bg-cyan-100 text-cyan-700",
  "SD": "bg-teal-100 text-teal-700",
  "BPVP": "bg-amber-100 text-amber-700",
  "BLK": "bg-orange-100 text-orange-700",
  "LPK": "bg-rose-100 text-rose-700",
};

const emptyForm = {
  name: '',
  type: '' as InstituteType | '',
  status: '' as InstituteStatus | '',
  province: '',
  city: '',
  address: '',
  phone: '',
  website: '',
  npsn: '',
};

export default function InstituteMaster() {
  const modal = useModal();
  const [data, setData] = useState<Institute[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [filterType, setFilterType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem('ugz_master_institute');
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData(MASTER_INSTITUTE);
      localStorage.setItem('ugz_master_institute', JSON.stringify(MASTER_INSTITUTE));
    }
  }, []);

  const saveToLocal = (newData: Institute[]) => {
    setData(newData);
    localStorage.setItem('ugz_master_institute', JSON.stringify(newData));
  };

  const handleSave = () => {
    if (!formData.name || !formData.type || !formData.status || !formData.province || !formData.address) return;
    
    if (isEditing) {
      const updated = data.map(item => 
        item.id === isEditing ? { 
          ...item, 
          name: formData.name,
          type: formData.type as InstituteType,
          status: formData.status as InstituteStatus,
          province: formData.province,
          city: formData.city || undefined,
          address: formData.address,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          npsn: formData.npsn || undefined,
        } : item
      );
      saveToLocal(updated);
    } else {
      const newItem: Institute = { 
        id: `INS-${Date.now()}`, 
        name: formData.name,
        type: formData.type as InstituteType,
        status: formData.status as InstituteStatus,
        province: formData.province,
        city: formData.city || undefined,
        address: formData.address,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        npsn: formData.npsn || undefined,
      };
      saveToLocal([...data, newItem]);
    }
    
    setIsEditing(null);
    setFormData({ ...emptyForm });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data institute ini?", true)) {
      saveToLocal(data.filter(item => item.id !== id));
    }
  };

  const startEdit = (item: Institute) => {
    setIsEditing(item.id);
    setFormData({ 
      name: item.name,
      type: item.type,
      status: item.status,
      province: item.province,
      city: item.city || '',
      address: item.address,
      phone: item.phone || '',
      website: item.website || '',
      npsn: item.npsn || '',
    });
    setIsModalOpen(true);
  };

  const filteredData = data.filter(item => {
    const matchType = !filterType || item.type === filterType;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.province.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/settings/master-data" className="inline-flex items-center text-sm text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Master Data
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="p-6 border-b border-table-border bg-surface-container-lowest">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Institute Master</h2>
              <p className="text-xs text-on-surface-variant">Kelola master data institusi pendidikan, pelatihan & training center</p>
            </div>
            <button 
              onClick={() => { setIsEditing(null); setFormData({ ...emptyForm }); setIsModalOpen(true); }}
              className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama institusi atau provinsi..."
                className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
              />
            </div>
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-9 pr-8 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black appearance-none bg-white min-w-[180px]"
              >
                <option value="">Semua Jenis</option>
                {INSTITUTE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest shrink-0">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit Institute" : "Add New Institute"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-on-surface-variant hover:text-status-error transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-on-surface mb-1">Nama Instansi <span className="text-status-error">*</span></label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                      placeholder="Contoh: Universitas Indonesia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Jenis <span className="text-status-error">*</span></label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InstituteType }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                    >
                      <option value="">Pilih Jenis</option>
                      {INSTITUTE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Status <span className="text-status-error">*</span></label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as InstituteStatus }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                    >
                      <option value="">Pilih Status</option>
                      {INSTITUTE_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Provinsi <span className="text-status-error">*</span></label>
                    <input 
                      type="text" 
                      value={formData.province}
                      onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                      placeholder="Contoh: DKI Jakarta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Kota/Kabupaten</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                      placeholder="Opsional"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-on-surface mb-1">Alamat Lengkap <span className="text-status-error">*</span></label>
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black resize-none"
                      placeholder="Alamat lengkap instansi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Telepon</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                      placeholder="Opsional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Website</label>
                    <input 
                      type="text" 
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                      placeholder="Opsional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">NPSN</label>
                    <input 
                      type="text" 
                      value={formData.npsn}
                      onChange={(e) => setFormData(prev => ({ ...prev, npsn: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black"
                      placeholder="Opsional"
                    />
                  </div>
                </div>
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
                <th className="px-4 py-3 w-12">No</th>
                <th className="px-4 py-3 w-24">ID</th>
                <th className="px-4 py-3">Nama Instansi</th>
                <th className="px-4 py-3 w-36">Jenis</th>
                <th className="px-4 py-3 w-24">Status</th>
                <th className="px-4 py-3">Provinsi</th>
                <th className="px-4 py-3">Kota</th>
                <th className="px-4 py-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant">Belum ada data.</td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-black text-xs">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-black">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${item.status === "Negeri" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-black">{item.province}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{item.city || '-'}</td>
                    <td className="px-4 py-3 text-right">
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

        {/* Footer count */}
        <div className="px-6 py-3 bg-surface-container-lowest border-t border-table-border text-xs text-on-surface-variant">
          Menampilkan {filteredData.length} dari {data.length} data
        </div>
      </div>
    </div>
  );
}
