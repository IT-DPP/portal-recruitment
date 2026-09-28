"use client";

import React, { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/providers/ModalProvider';
import { createSite, updateSite, deleteSite } from "@/app/actions/master-data";
import { MasterSite, MasterCustomer, MasterProvince, MasterCity, MasterPipelineStage, SiteSla } from '@prisma/client';
import { useClientTable } from '@/hooks/useClientTable';
import TableControls from '@/components/ui/TableControls';
import SearchableSelect from '@/components/ui/SearchableSelect';

type SiteWithRelations = MasterSite & { 
  customer: MasterCustomer;
  city: MasterCity;
  province: MasterProvince;
  siteSlas: SiteSla[];
};

interface SiteClientProps {
  initialData: SiteWithRelations[];
  customers: MasterCustomer[];
  provinces: MasterProvince[];
  cities: MasterCity[];
  stages: MasterPipelineStage[];
}

export default function SiteClient({ initialData, customers, provinces, cities, stages }: SiteClientProps) {
  const modal = useModal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    customerId: '',
    provinceId: '',
    cityId: '',
    latitude: '',
    longitude: '',
    useSpecificSla: false,
    siteSlas: stages.map(s => ({ stageId: s.id, slaDays: s.slaDays, reminderDays: s.reminderDays }))
  });
  const [isPending, startTransition] = useTransition();
  const [filterCustomer, setFilterCustomer] = useState('');

  const filteredData = React.useMemo(() => {
    if (!filterCustomer) return initialData;
    return initialData.filter(item => item.customerId === filterCustomer);
  }, [initialData, filterCustomer]);

  const table = useClientTable({
    data: filteredData,
    searchKeys: ['name', 'code', 'customer.name', 'city.name', 'province.name']
  });

  const availableCities = cities.filter(c => c.provinceId === formData.provinceId);
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const provinceOptions = provinces.map(p => ({ value: p.id, label: p.name }));
  const cityOptions = availableCities.map(c => ({ value: c.id, label: c.name }));

  const handleSave = () => {
    if (!formData.name || !formData.customerId || !formData.provinceId || !formData.cityId) return;
    
    // SLA Validation
    if (formData.useSpecificSla) {
      for (const sla of formData.siteSlas) {
        if (sla.reminderDays > sla.slaDays) {
          alert('SLA Reminder tidak boleh lebih besar dari Total Hari SLA pada tahapan tertentu.');
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        };

        if (isEditing) {
          const res = await updateSite(isEditing, payload);
          if (!res.success) throw new Error(res.error);
        } else {
          const res = await createSite(payload);
          if (!res.success) throw new Error(res.error);
        }
        
        setIsEditing(null);
        setFormData({ 
          name: '', code: '', customerId: '', provinceId: '', cityId: '', latitude: '', longitude: '',
          useSpecificSla: false,
          siteSlas: stages.map(s => ({ stageId: s.id, slaDays: s.slaDays, reminderDays: s.reminderDays }))
        });
        setIsModalOpen(false);
      } catch (error: any) {
         console.error(error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if(await modal.confirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data ini?", true)) {
      startTransition(async () => {
         await deleteSite(id);
      });
    }
  };

  const startEdit = (item: SiteWithRelations) => {
    setIsEditing(item.id);
    
    // Map existing SLA or fallback to default global
    const slasToUse = stages.map(s => {
      const existing = item.siteSlas?.find(x => x.stageId === s.id);
      return existing 
        ? { stageId: s.id, slaDays: existing.slaDays, reminderDays: existing.reminderDays }
        : { stageId: s.id, slaDays: s.slaDays, reminderDays: s.reminderDays };
    });

    setFormData({ 
      name: item.name, 
      code: item.code || '', 
      customerId: item.customerId,
      provinceId: item.provinceId,
      cityId: item.cityId,
      latitude: item.latitude?.toString() || '',
      longitude: item.longitude?.toString() || '',
      useSpecificSla: item.useSpecificSla,
      siteSlas: slasToUse
    });
    setIsModalOpen(true);
  };

  const handleSlaChange = (stageId: string, field: 'slaDays' | 'reminderDays', val: number) => {
    setFormData(prev => {
      const newSlas = prev.siteSlas.map(sla => {
        if (sla.stageId === stageId) {
          const maxVal = Math.max(0, val);
          return { ...sla, [field]: maxVal };
        }
        return sla;
      });
      return { ...prev, siteSlas: newSlas };
    });
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
            <p className="text-xs text-on-surface-variant">Kelola master data lokasi operasional</p>
          </div>
          <button 
            onClick={() => { 
              setIsEditing(null); 
              setFormData({ 
                name: "", code: "", customerId: '', provinceId: '', cityId: '', latitude: '', longitude: '',
                useSpecificSla: false,
                siteSlas: stages.map(s => ({ stageId: s.id, slaDays: s.slaDays, reminderDays: s.reminderDays }))
              }); 
              setIsModalOpen(true); 
            }}
            disabled={isPending}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-table-border flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-bold text-lg text-primary">
                  {isEditing ? "Edit Site" : "Add New Site"}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="text-on-surface-variant hover:text-status-error transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface mb-1">Customer <span className="text-status-error">*</span></label>
                  <SearchableSelect
                    options={customerOptions}
                    value={formData.customerId}
                    onChange={(val) => setFormData({ ...formData, customerId: val })}
                    disabled={isPending}
                    placeholder="Pilih Customer"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface mb-1">Site Code (Opsional)</label>
                  <input 
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                    placeholder="e.g. SIT-01"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-on-surface mb-1">Site Name <span className="text-status-error">*</span></label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                    placeholder="e.g. HO Sudirman"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface mb-1">Provinsi <span className="text-status-error">*</span></label>
                  <SearchableSelect
                    options={provinceOptions}
                    value={formData.provinceId}
                    onChange={(val) => setFormData({ ...formData, provinceId: val, cityId: '' })}
                    disabled={isPending}
                    placeholder="Pilih Provinsi"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface mb-1">Kota <span className="text-status-error">*</span></label>
                  <SearchableSelect
                    options={cityOptions}
                    value={formData.cityId}
                    onChange={(val) => setFormData({ ...formData, cityId: val })}
                    disabled={isPending || !formData.provinceId}
                    placeholder="Pilih Kota"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface mb-1">Latitude</label>
                  <input 
                    type="number" step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                    placeholder="-6.1751"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface mb-1">Longitude</label>
                  <input 
                    type="number" step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-outline-variant rounded text-sm focus:outline-none focus:border-primary text-black disabled:bg-gray-100"
                    placeholder="106.8650"
                  />
                </div>

                {/* SLA Configuration Toggle */}
                <div className="col-span-2 mt-4 pt-4 border-t border-table-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.useSpecificSla}
                      onChange={(e) => setFormData({ ...formData, useSpecificSla: e.target.checked })}
                      disabled={isPending}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                    <span className="text-sm font-semibold text-black">Gunakan SLA Spesifik untuk Site Ini</span>
                  </label>
                  <p className="text-xs text-on-surface-variant mt-1 ml-6">
                    Jika tidak dicentang, site ini akan menggunakan konfigurasi SLA Global.
                  </p>
                </div>

                {/* Specific SLA Table */}
                {formData.useSpecificSla && (
                  <div className="col-span-2">
                    <div className="overflow-x-auto border border-table-border rounded-lg mt-2">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-surface-container-lowest text-on-surface border-b border-table-border">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Stage</th>
                            <th className="px-3 py-2 font-semibold text-center w-24">SLA (Hari)</th>
                            <th className="px-3 py-2 font-semibold text-center w-24">Reminder</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-table-border">
                          {stages.map((stage) => {
                            const slaData = formData.siteSlas.find(s => s.stageId === stage.id) || { slaDays: stage.slaDays, reminderDays: stage.reminderDays };
                            const isUnlimitedStage = ['Training User', 'Induction', 'PWKT'].includes(stage.name);
                            return (
                              <tr key={stage.id} className="hover:bg-surface-container-lowest">
                                <td className="px-3 py-2 font-medium text-black">{stage.name}</td>
                                <td className="px-3 py-2 text-center">
                                  {isUnlimitedStage && slaData.slaDays === 0 ? (
                                    <button 
                                      onClick={() => handleSlaChange(stage.id, 'slaDays', 1)}
                                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase"
                                    >
                                      Unlimited
                                    </button>
                                  ) : (
                                    <input 
                                      type="number" min="0"
                                      value={slaData.slaDays === 0 ? '' : slaData.slaDays}
                                      onChange={(e) => handleSlaChange(stage.id, 'slaDays', parseInt(e.target.value) || 0)}
                                      disabled={isPending}
                                      className="w-16 px-1 py-1 border border-outline-variant rounded text-center focus:outline-none focus:border-primary text-black"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {isUnlimitedStage && slaData.slaDays === 0 ? (
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">N/A</span>
                                  ) : (
                                    <input 
                                      type="number" min="0"
                                      value={slaData.reminderDays === 0 ? '' : slaData.reminderDays}
                                      onChange={(e) => handleSlaChange(stage.id, 'reminderDays', parseInt(e.target.value) || 0)}
                                      disabled={isPending}
                                      className="w-16 px-1 py-1 border border-outline-variant rounded text-center focus:outline-none focus:border-primary text-black"
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
                  disabled={isPending || !formData.name || !formData.customerId || !formData.provinceId || !formData.cityId}
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
              options={customerOptions}
              value={filterCustomer}
              onChange={(val) => {
                setFilterCustomer(val);
                table.setPage(1);
              }}
              placeholder="Filter by Customer..."
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
                <th className="px-6 py-3">Site Name</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Location</th>
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
                    <td className="px-6 py-4 font-medium text-black">
                      <div>{item.name}</div>
                      {item.code && <div className="text-[10px] text-on-surface-variant font-mono">{item.code}</div>}
                    </td>
                    <td className="px-6 py-4 font-medium text-black">{item.customer.name}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">
                      <div>{item.city.name}, {item.province.name}</div>
                      {(item.latitude || item.longitude) && (
                        <div className="font-mono text-[10px] mt-1">{item.latitude}, {item.longitude}</div>
                      )}
                    </td>
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
