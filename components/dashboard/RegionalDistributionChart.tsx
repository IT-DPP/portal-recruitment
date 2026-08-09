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
    <div className="bg-white rounded-xl shadow-sm border border-table-border p-5 h-[400px] flex flex-col">
      <h3 className="font-bold text-on-surface mb-4">Regional Distribution</h3>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis dataKey="province" type="category" width={100} tick={{ fontSize: 12 }} />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Kandidat" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
