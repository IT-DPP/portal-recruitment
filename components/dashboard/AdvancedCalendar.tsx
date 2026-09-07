"use client";

import React, { useState } from 'react';
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
}

export default function AdvancedCalendar({ events, onEventClick }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');

  const eventPropGetter = (event: AdvancedCalendarEvent) => {
    let backgroundColor = '#3b82f6'; // default blue

    if (event.isCandidateMode) {
      // In candidate mode, use distinct colors for different stages
      if (event.stageName?.includes('HR')) {
        backgroundColor = '#eab308'; // yellow-500
      } else if (event.stageName?.includes('User')) {
        backgroundColor = '#22c55e'; // green-500
      } else if (event.stageName?.includes('CV')) {
        backgroundColor = '#0f4c81'; // dark blue
      } else if (event.stageName?.includes('Psikotes')) {
        backgroundColor = '#1976D2';
      } else if (event.stageName?.includes('Technical')) {
        backgroundColor = '#0288D1';
      } else if (event.stageName?.includes('Offering')) {
        backgroundColor = '#00796B';
      } else if (event.stageName?.includes('MCU')) {
        backgroundColor = '#2E7D32';
      } else {
        backgroundColor = '#3b82f6';
      }
    } else {
      // General mode
      if (event.type === 'hr') {
        backgroundColor = '#eab308'; // yellow-500
      } else if (event.type === 'user') {
        backgroundColor = '#22c55e'; // green-500
      } else if (event.type === 'skill') {
        backgroundColor = '#3b82f6'; // blue-500
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-on-surface">Recruitment Calendar</h3>
        <div className="flex gap-4 text-xs font-medium text-on-surface-variant">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"></div>HR Interview</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div>User Interview</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Skill/Technical</div>
          <div className="flex items-center gap-1.5 ml-4 border-l pl-4 border-table-border">
            <div className="w-3 h-3 rounded-full bg-[#0f4c81]"></div>Pipeline Stages (Candidate Mode)
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
          date={currentDate}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          view={currentView}
          onView={(newView) => setCurrentView(newView)}
          onSelectEvent={onEventClick}
          popup={true}
        />
      </div>
    </div>
  );
}
