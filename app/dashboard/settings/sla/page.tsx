"use client";

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';

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

export default function SLAConfigurationPage() {
  const [slaData, setSlaData] = useState<Record<string, { totalDays: number; reminderDays: number }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ugz_master_sla');
    if (saved) {
      setSlaData(JSON.parse(saved));
    } else {
      // Initialize with default 0 if empty
      const initial: Record<string, any> = {};
      STAGES.forEach(s => {
        initial[s.id] = { totalDays: 0, reminderDays: 0 };
      });
      setSlaData(initial);
    }
  }, []);

  const handleUpdate = (stageId: string, field: 'totalDays' | 'reminderDays', value: number) => {
    setSlaData(prev => ({
      ...prev,
      [stageId]: {
        ...prev[stageId],
        [field]: value < 0 ? 0 : value
      }
    }));
    setErrorMsg('');
    setSuccessMsg(false);
  };

  const handleSave = () => {
    // Validation
    for (const stage of STAGES) {
      const data = slaData[stage.id] || { totalDays: 0, reminderDays: 0 };
      if (data.reminderDays > data.totalDays) {
        setErrorMsg(`Reminder pada ${stage.title} tidak boleh lebih besar dari Total Hari.`);
        return;
      }
    }

    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('ugz_master_sla', JSON.stringify(slaData));
      setIsSaving(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary tracking-tight">SLA Configuration</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Atur durasi hari dan reminder untuk masing-masing tahap rekrutmen.
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
              {STAGES.map((stage, idx) => {
                const data = slaData[stage.id] || { totalDays: 0, reminderDays: 0 };
                return (
                  <tr key={stage.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-on-surface-variant text-center">{idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-black">{stage.title}</td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number" 
                        min="0"
                        value={data.totalDays === 0 ? '' : data.totalDays}
                        onChange={e => handleUpdate(stage.id, 'totalDays', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 border border-outline-variant rounded text-center text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number" 
                        min="0"
                        value={data.reminderDays === 0 ? '' : data.reminderDays}
                        onChange={e => handleUpdate(stage.id, 'reminderDays', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 border border-outline-variant rounded text-center text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-black"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-surface-container-lowest border-t border-table-border flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-primary text-white rounded text-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Menyimpan...' : 'Simpan SLA'}
          </button>
        </div>
      </div>
    </div>
  );
}
