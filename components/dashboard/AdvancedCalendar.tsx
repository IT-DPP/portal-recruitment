"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export interface AdvancedCalendarEvent extends Event {
  type: string;
  count?: number;
  stageName?: string;
  candidateName?: string;
  isCandidateMode?: boolean;
  applicationsData?: any[]; // Array of application objects for General mode
  singleDetailData?: any;   // Single object for Candidate mode
}

interface Props {
  events: AdvancedCalendarEvent[];
  onEventClick?: (event: AdvancedCalendarEvent) => void;
  currentDate?: Date;
  onNavigate?: (newDate: Date) => void;
}

export default function AdvancedCalendar({ events, onEventClick, currentDate: propDate, onNavigate: propOnNavigate }: Props) {
  const [internalDate, setInternalDate] = useState<Date>(() => propDate || new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  // Sync internal date if propDate changes
  useEffect(() => {
    if (propDate) {
      setInternalDate(propDate);
    }
  }, [propDate]);

  const activeDate = propDate || internalDate;

  const handleDateNavigate = (newDate: Date) => {
    setInternalDate(newDate);
    propOnNavigate?.(newDate);
  };

  const eventPropGetter = (event: AdvancedCalendarEvent) => {
    let backgroundColor = '#3b82f6'; // default blue

    if (event.isCandidateMode) {
      // In candidate mode, use distinct colors for different stages
      if (event.stageName?.includes('HR')) {
        backgroundColor = '#eab308'; // yellow-500
      } else if (event.stageName?.includes('User')) {
        backgroundColor = '#22c55e'; // green-500
      } else if (event.stageName?.includes('CV') || event.stageName?.includes('Admin') || event.stageName?.includes('Screening')) {
        backgroundColor = '#0f4c81'; // dark blue
      } else if (event.stageName?.includes('Psikotes')) {
        backgroundColor = '#6366f1'; // indigo-500
      } else if (event.stageName?.includes('Technical') || event.stageName?.includes('Skill')) {
        backgroundColor = '#0288D1'; // sky-600
      } else if (event.stageName?.includes('Offering')) {
        backgroundColor = '#0d9488'; // teal-600
      } else if (event.stageName?.includes('MCU')) {
        backgroundColor = '#16a34a'; // green-600
      } else {
        backgroundColor = '#3b82f6';
      }
    } else {
      // General mode (current active schedules)
      if (event.type === 'hr') {
        backgroundColor = '#eab308'; // yellow-500
      } else if (event.type === 'user') {
        backgroundColor = '#22c55e'; // green-500
      } else if (event.type === 'skill') {
        backgroundColor = '#0288D1'; // sky-600
      } else if (event.type === 'psikotes') {
        backgroundColor = '#6366f1'; // indigo-500
      } else if (event.type === 'mcu') {
        backgroundColor = '#16a34a'; // green-600
      } else if (event.type === 'offering') {
        backgroundColor = '#0d9488'; // teal-600
      } else if (event.type === 'administration') {
        backgroundColor = '#0f4c81'; // dark blue
      }
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.95,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '11.5px',
        padding: '3px 6px',
        fontWeight: 'bold',
        textAlign: event.isCandidateMode ? 'left' as any : 'center' as any,
        marginBottom: '3px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-table-border p-5 h-[700px] flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-bold text-on-surface">Recruitment Calendar</h3>
        <div className="flex flex-wrap gap-3 text-xs font-medium text-on-surface-variant">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"></div>HR Intv</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div>User Intv</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#0288D1]"></div>Skill/Tech</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#6366f1]"></div>Psikotes</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#16a34a]"></div>MCU</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#0d9488]"></div>Offering</div>
          <div className="flex items-center gap-1.5 ml-2 border-l pl-3 border-table-border">
            <div className="w-3 h-3 rounded-full bg-[#0f4c81]"></div>Administrasi / Pipeline
          </div>
        </div>
      </div>
      
      {/* Calendar specific styles to make the toolbar look more modern */}
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-toolbar button {
          border-radius: 8px !important;
          color: #374151 !important;
          font-weight: 500 !important;
          border-color: #e5e7eb !important;
          margin-right: 4px;
        }
        .rbc-toolbar button:active, .rbc-toolbar button.rbc-active {
          background-color: #3b82f6 !important;
          color: white !important;
          border-color: #3b82f6 !important;
        }
        .rbc-toolbar button:hover:not(.rbc-active) {
          background-color: #f3f4f6 !important;
        }
        .rbc-today {
          background-color: #eff6ff !important;
        }
        .rbc-event {
          transition: transform 0.1s ease;
        }
        .rbc-event:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
      `}} />
      
      <div className="flex-1 overflow-hidden">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventPropGetter}
          views={['month', 'week', 'day']}
          toolbar={true}
          date={activeDate}
          onNavigate={handleDateNavigate}
          view={currentView}
          onView={(newView) => setCurrentView(newView)}
          onSelectEvent={onEventClick}
          popup={true}
        />
      </div>
    </div>
  );
}
