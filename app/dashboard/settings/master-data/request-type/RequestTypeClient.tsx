"use client";

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { createRequestType, updateRequestType, deleteRequestType } from "@/app/actions/master-data";
import { MasterRequestType } from '@prisma/client';
import { useClientTable } from '@/hooks/useClientTable';
import TableControls from '@/components/ui/TableControls';

interface RequestTypeClientProps {
  initialData: MasterRequestType[];
}

export default function RequestTypeClient({ initialData }: RequestTypeClientProps) {
  const modal = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [isPending, startTransition] = useTransition();

  const table = useClientTable({
    data: initialData,
    searchKeys: ['name', 'code']
  });

  const handleSave = () => {
    if (!formData.name) return;
    
    startTransition(async () => {
      try {
        if (isEditing) {
          const res = await updateRequestType(isEditing, formData);
          if (!res.success) throw new Error(res.error);
        } else {
          const res = await createRequestType(formData);
          if (!res.success) throw new Error(res.error);
        }
        
        setIsEditing(null);
        setFormData({ name: '', code: '' });
        setIsModalOpen(false);
      } catch (error: any) {
         console.error(error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data ini?", true)) {
      startTransition(async () => {
         await deleteRequestType(id);
      });
    }
  };

  const startEdit = (item: MasterRequestType) => {
    setIsEditing(item.id);
    setFormData({ name: item.name, code: item.code || '' });
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
            <h2 className="text-lg font-bold text-primary">Request Type Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola master data jenis permintaan / request</p>
          </div>
          <button 
            onClick={() => { setIsEditing(null); setFormData({ name: "", code: "" }); setIsModalOpen(true); }}
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
                  {isEditing ? "Edit Request Type" : "Add New Request Type"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="text-on-surface-variant hover:text-status-error transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Request Type Code (Opsional)</label>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                    placeholder="e.g. REQ-NEW"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Request Type Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                    placeholder="e.g. Penambahan Baru"
                  />
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

        <TableControls {...table} />

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
                <th className="px-6 py-3">Request Type Name</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                table.paginatedData.map((item, index) => (
                  <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">{table.startIndex + index}</td>
                    <td className="px-6 py-4 font-medium text-black">{item.code || '-'}</td>
                    <td className="px-6 py-4 font-medium text-black">{item.name}</td>
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
