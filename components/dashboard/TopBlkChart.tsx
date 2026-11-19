"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface BlkData {
  name: string;
  count: number;
}

interface Props {
  data: BlkData[];
}

const COLORS = ['#D9232A', '#B91C1C', '#D97706', '#10b981', '#6366f1'];

export default function TopBlkChart({ data }: Props) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-table-border p-5 flex-1 min-h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-on-surface text-sm">Top 5 BLK/LPK/Institusi</h3>
        <span className="text-[11px] font-medium text-slate-500">Sourcing Terbanyak</span>
      </div>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Kandidat">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
