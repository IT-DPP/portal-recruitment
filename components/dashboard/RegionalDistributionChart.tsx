"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface RegionalData {
  province: string;
  count: number;
}

interface Props {
  data: RegionalData[];
}

export default function RegionalDistributionChart({ data }: Props) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-table-border p-5 flex-1 min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-on-surface text-sm">Regional Distribution</h3>
        <span className="text-[11px] font-medium text-slate-500">Top 10 Provinsi</span>
      </div>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="province" type="category" width={100} tick={{ fontSize: 11 }} />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
            <Bar dataKey="count" fill="#D9232A" radius={[0, 4, 4, 0]} name="Kandidat" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
