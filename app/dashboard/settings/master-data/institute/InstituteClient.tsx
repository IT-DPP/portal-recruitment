"use client";

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { createInstitute, updateInstitute, deleteInstitute } from "@/app/actions/master-data";
import { MasterInstitute } from '@prisma/client';
import { useClientTable } from '@/hooks/useClientTable';
import TableControls from '@/components/ui/TableControls';
import SearchableSelect from '@/components/ui/SearchableSelect';

interface InstituteClientProps {
  initialData: MasterInstitute[];
}

export default function InstituteClient({ initialData }: InstituteClientProps) {
  const modal = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: '', status: '', province: '', city: '', address: '' });
  const [isPending, startTransition] = useTransition();
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredData = React.useMemo(() => {
    return initialData.filter(item => {
      const matchType = filterType ? item.type === filterType : true;
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      return matchType && matchStatus;
    });
  }, [initialData, filterType, filterStatus]);

  const table = useClientTable({
    data: filteredData,
    searchKeys: ['name', 'code', 'province', 'city']
  });

  const typeOptions = [
    { value: 'Perguruan Tinggi', label: 'Perguruan Tinggi' },
    { value: 'SLTA', label: 'SLTA' },
    { value: 'SLTP', label: 'SLTP' },
    { value: 'SD', label: 'SD' },
    { value: 'BPVP', label: 'BPVP' },
    { value: 'BLK', label: 'BLK' },
    { value: 'LPK', label: 'LPK' }
  ];

  const statusOptions = [
    { value: 'Negeri', label: 'Negeri' },
    { value: 'Swasta', label: 'Swasta' }
  ];

  const handleSave = () => {
    if (!formData.name) return;
    
    startTransition(async () => {
      try {
        if (isEditing) {
          const res = await updateInstitute(isEditing, formData);
          if (!res.success) throw new Error(res.error);
        } else {
          const res = await createInstitute(formData);
          if (!res.success) throw new Error(res.error);
        }
        
        setIsEditing(null);
        setFormData({ name: '', code: '', type: '', status: '', province: '', city: '', address: '' });
        setIsModalOpen(false);
      } catch (error: any) {
         console.error(error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data ini?", true)) {
      startTransition(async () => {
         await deleteInstitute(id);
      });
    }
  };

  const startEdit = (item: MasterInstitute) => {
    setIsEditing(item.id);
    setFormData({ 
      name: item.name, 
      code: item.code || '',
      type: item.type || '',
      status: item.status || '',
      province: item.province || '',
      city: item.city || '',
      address: item.address || ''
    });
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
            <h2 className="text-lg font-bold text-primary">Institute Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola master data institusi / universitas</p>
          </div>
          <button 
            onClick={() => { setIsEditing(null); setFormData({ name: '', code: '', type: '', status: '', province: '', city: '', address: '' }); setIsModalOpen(true); }}
            disabled={isPending}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit Institute" : "Add New Institute"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="text-on-surface-variant hover:text-status-error transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-on-surface mb-1">Institute Name <span className="text-status-error">*</span></label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isPending}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                      placeholder="e.g. Universitas Indonesia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Code (Opsional)</label>
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      disabled={isPending}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                      placeholder="e.g. INS-UI"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Jenjang / Tipe</label>
                    <SearchableSelect
                      options={typeOptions}
                      value={formData.type}
                      onChange={(val) => setFormData({ ...formData, type: val })}
                      disabled={isPending}
                      placeholder="Pilih Jenjang"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Status</label>
                    <SearchableSelect
                      options={statusOptions}
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      disabled={isPending}
                      placeholder="Pilih Status"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Provinsi</label>
                    <input 
                      type="text" 
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      disabled={isPending}
                      className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                      placeholder="e.g. DKI Jakarta"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-surface-container-lowest border-t border-table-border flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded text-sm hover:bg-outline-variant transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending || !formData.name}
                  className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        <TableControls {...table}>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-40">
              <SearchableSelect
                options={typeOptions}
                value={filterType}
                onChange={(val) => {
                  setFilterType(val);
                  table.setPage(1);
                }}
                placeholder="Filter by Jenjang..."
              />
            </div>
            <div className="w-40">
              <SearchableSelect
                options={statusOptions}
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val);
                  table.setPage(1);
                }}
                placeholder="Filter by Status..."
              />
            </div>
          </div>
        </TableControls>

        <div className="relative overflow-x-auto min-h-[300px]">
          {isPending && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-on-surface bg-table-header-bg uppercase border-b border-table-border">
              <tr>
                <th className="px-6 py-3 w-16">No</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Institute Name</th>
                <th className="px-6 py-3">Jenjang</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Lokasi</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                table.paginatedData.map((item, index) => (
                  <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">{table.startIndex + index}</td>
                    <td className="px-6 py-4 font-medium text-black font-mono text-[11px]">{item.code || '-'}</td>
                    <td className="px-6 py-4 font-medium text-black">{item.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{item.type || '-'}</td>
                    <td className="px-6 py-4">
                      {item.status ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                          item.status === 'Negeri' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {item.status}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">{item.province || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => startEdit(item)} disabled={isPending} className="text-primary hover:text-primary-container mr-3 disabled:opacity-50">
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={isPending} className="text-status-error hover:text-red-700 disabled:opacity-50">
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
