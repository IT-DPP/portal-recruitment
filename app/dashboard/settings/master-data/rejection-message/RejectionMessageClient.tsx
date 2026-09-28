"use client";

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { createRejectionMessage, updateRejectionMessage, deleteRejectionMessage } from "@/app/actions/master-data";
import { MasterRejectionMessage, MasterPipelineStage } from '@prisma/client';
import { useClientTable } from '@/hooks/useClientTable';
import TableControls from '@/components/ui/TableControls';
import SearchableSelect from '@/components/ui/SearchableSelect';

type RejectionMessageWithStage = MasterRejectionMessage & {
  stage?: MasterPipelineStage | null;
};

interface RejectionMessageClientProps {
  initialData: RejectionMessageWithStage[];
  stages: MasterPipelineStage[];
}

export default function RejectionMessageClient({ initialData, stages }: RejectionMessageClientProps) {
  const modal = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ message: '', code: '', stageId: '' });
  const [isPending, startTransition] = useTransition();
  const [filterStage, setFilterStage] = useState('');

  const filteredData = React.useMemo(() => {
    if (!filterStage) return initialData;
    return initialData.filter(item => item.stageId === filterStage);
  }, [initialData, filterStage]);

  const table = useClientTable({
    data: filteredData,
    searchKeys: ['message', 'code', 'stage.name']
  });

  const stageOptions = stages.map(s => ({ value: s.id, label: s.name }));

  const handleSave = () => {
    if (!formData.message || !formData.stageId) return;
    
    startTransition(async () => {
      try {
        if (isEditing) {
          const res = await updateRejectionMessage(isEditing, formData);
          if (!res.success) throw new Error(res.error);
        } else {
          const res = await createRejectionMessage(formData);
          if (!res.success) throw new Error(res.error);
        }
        
        setIsEditing(null);
        setFormData({ message: '', code: '', stageId: '' });
        setIsModalOpen(false);
      } catch (error: any) {
         console.error(error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data pesan penolakan ini?", true)) {
      startTransition(async () => {
         await deleteRejectionMessage(id);
      });
    }
  };

  const startEdit = (item: RejectionMessageWithStage) => {
    setIsEditing(item.id);
    setFormData({ message: item.message, code: item.code || '', stageId: item.stageId || '' });
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
            <h2 className="text-lg font-bold text-primary">Rejection Message Master</h2>
            <p className="text-xs text-on-surface-variant">Kelola template pesan penolakan untuk setiap tahapan</p>
          </div>
          <button 
            onClick={() => { setIsEditing(null); setFormData({ message: "", code: "", stageId: "" }); setIsModalOpen(true); }}
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
                  {isEditing ? "Edit Rejection Message" : "Add New Message"}
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
                  <label className="block text-xs font-semibold text-on-surface mb-1">Message Code (Opsional)</label>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                    placeholder="e.g. R-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Pilih Tahapan (Stage) <span className="text-status-error">*</span></label>
                  <SearchableSelect
                    options={stageOptions}
                    value={formData.stageId}
                    onChange={(val) => setFormData({ ...formData, stageId: val })}
                    disabled={isPending}
                    placeholder="Pilih Tahapan Rekrutmen"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Pesan Penolakan <span className="text-status-error">*</span></label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    disabled={isPending}
                    rows={4}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100 resize-none"
                    placeholder="e.g. Incomplete Documents"
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
                  disabled={isPending || !formData.message || !formData.stageId}
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
          <div className="w-48">
            <SearchableSelect
              options={stageOptions}
              value={filterStage}
              onChange={(val) => {
                setFilterStage(val);
                table.setPage(1);
              }}
              placeholder="Filter by Stage..."
            />
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
                <th className="px-6 py-3">Stage</th>
                <th className="px-6 py-3">Pesan Penolakan</th>
                <th className="px-6 py-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                table.paginatedData.map((item, index) => (
                  <tr key={item.id} className="bg-white border-b border-table-border hover:bg-surface-container-low/50">
                    <td className="px-6 py-4">{table.startIndex + index}</td>
                    <td className="px-6 py-4 font-medium text-black font-mono text-xs">{item.code || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-surface-container-high px-2 py-1 rounded text-xs font-medium text-on-surface">
                        {item.stage?.name || item.stageId}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-black whitespace-pre-wrap">{item.message}</td>
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
