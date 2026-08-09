"use client";

import React from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
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

export interface InterviewEvent extends Event {
  type: 'hr' | 'user' | 'skill';
  count: number;
}

interface Props {
  events: InterviewEvent[];
}

export default function InterviewCalendar({ events }: Props) {
  const eventPropGetter = (event: InterviewEvent) => {
    let backgroundColor = '#3b82f6'; // default blue
    if (event.type === 'hr') {
      backgroundColor = '#eab308'; // yellow-500
    } else if (event.type === 'user') {
      backgroundColor = '#22c55e'; // green-500
    } else if (event.type === 'skill') {
      backgroundColor = '#3b82f6'; // blue-500
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '11px',
        padding: '2px 4px',
        fontWeight: 'bold',
        textAlign: 'center' as any,
        marginBottom: '2px'
      }
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-table-border p-5 h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-on-surface">Interview & Test Schedule</h3>
        <div className="flex gap-4 text-xs font-medium text-on-surface-variant">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"></div>HR</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div>User</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Skill</div>
        </div>
      </div>
      <div className="flex-1">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventPropGetter}
          views={['month']}
          toolbar={false}
          defaultView="month"
        />
      </div>
    </div>
  );
}

