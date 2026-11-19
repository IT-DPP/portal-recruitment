import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatWidget({ title, value, icon: Icon, trend, trendUp }: StatWidgetProps) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-table-border p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-on-surface-variant text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-on-surface mt-1">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center text-xs">
          <span className={`font-medium ${trendUp ? 'text-status-success' : 'text-status-error'}`}>
            {trend}
          </span>
          <span className="text-on-surface-variant ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
}
