"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { MasterPipelineStage } from "@prisma/client";
import { updateGlobalSla } from "@/app/actions/master-data";

export default function SLAClient({ initialData }: { initialData: MasterPipelineStage[] }) {
  const [slaData, setSlaData] = useState<Record<string, { totalDays: number; reminderDays: number }>>({});
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const initial: Record<string, { totalDays: number; reminderDays: number }> = {};
    initialData.forEach(s => {
      initial[s.id] = { totalDays: s.slaDays, reminderDays: s.reminderDays };
    });
    setSlaData(initial);
  }, [initialData]);

  const handleUpdate = (stageId: string, field: 'totalDays' | 'reminderDays', value: number) => {
    setSlaData(prev => {
      const currentData = prev[stageId] || { totalDays: 0, reminderDays: 0 };
      let newTotalDays = field === 'totalDays' ? Math.max(0, value) : currentData.totalDays;
      let newReminderDays = field === 'reminderDays' ? Math.max(0, value) : currentData.reminderDays;
      
      if (newReminderDays > newTotalDays) {
        if (field === 'totalDays') {
          newReminderDays = newTotalDays;
        } else {
          newReminderDays = newTotalDays;
        }
      }

      return {
        ...prev,
        [stageId]: {
          totalDays: newTotalDays,
          reminderDays: newReminderDays
        }
      };
    });
    setErrorMsg('');
    setSuccessMsg(false);
  };

  const handleSave = () => {
    // Validation
    for (const stage of initialData) {
      const data = slaData[stage.id] || { totalDays: 0, reminderDays: 0 };
      if (data.reminderDays > data.totalDays) {
        setErrorMsg(`Reminder pada ${stage.name} tidak boleh lebih besar dari Total Hari.`);
        return;
      }
    }

    startTransition(async () => {
      const payload = initialData.map(stage => ({
        id: stage.id,
        slaDays: slaData[stage.id]?.totalDays || 0,
        reminderDays: slaData[stage.id]?.reminderDays || 0
      }));

      const res = await updateGlobalSla(payload);
      if (res.success) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      } else {
        setErrorMsg(res.error || 'Terjadi kesalahan saat menyimpan');
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary tracking-tight">Global SLA Configuration</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Atur durasi hari dan reminder untuk masing-masing tahap rekrutmen secara default (Global).
          Konfigurasi SLA khusus (per-Site) dapat diatur melalui menu Site Operations.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-status-error border border-red-200 rounded text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-sm font-semibold">
          Konfigurasi SLA berhasil disimpan.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-on-surface bg-table-header-bg uppercase border-b border-table-border">
              <tr>
                <th className="px-6 py-4 w-12">Stage</th>
                <th className="px-6 py-4">Nama Tahapan</th>
                <th className="px-6 py-4 text-center">Total SLA (Hari)</th>
                <th className="px-6 py-4 text-center">Reminder (Hari)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">Belum ada tahapan pipeline yang dikonfigurasi di database.</td>
                </tr>
              ) : (
                initialData.map((stage, idx) => {
                  const data = slaData[stage.id] || { totalDays: stage.slaDays, reminderDays: stage.reminderDays };
                  // Example logic: PWKT, Induction, Training usually Unlimited
                  const isUnlimitedStage = ['Training User', 'Induction', 'PWKT'].includes(stage.name);
                  
                  return (
                    <tr key={stage.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-on-surface-variant text-center">{stage.orderIndex}</td>
                      <td className="px-6 py-4 font-semibold text-black">{stage.name}</td>
                      <td className="px-6 py-4 text-center">
                        {isUnlimitedStage && data.totalDays === 0 ? (
                          <button 
                            onClick={() => handleUpdate(stage.id, 'totalDays', 1)}
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
                            onChange={e => handleUpdate(stage.id, 'totalDays', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 border border-outline-variant rounded text-center text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black disabled:opacity-50 disabled:bg-gray-100"
                            placeholder="0"
                            disabled={isPending}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isUnlimitedStage && data.totalDays === 0 ? (
                          <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                            N/A
                          </span>
                        ) : (
                          <input 
                            type="number" 
                            min="0"
                            value={data.reminderDays === 0 ? '' : data.reminderDays}
                            onChange={e => handleUpdate(stage.id, 'reminderDays', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 border border-outline-variant rounded text-center text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black disabled:opacity-50 disabled:bg-gray-100"
                            placeholder="0"
                            disabled={isPending}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isPending || initialData.length === 0}
            className="px-6 py-2.5 bg-primary text-white rounded text-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? 'Menyimpan...' : 'Simpan SLA'}
          </button>
        </div>
      </div>
    </div>
  );
}
