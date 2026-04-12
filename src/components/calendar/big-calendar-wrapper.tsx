"use client"

import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type View,
  type Event as RBCEvent,
  type NavigateAction,
} from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { de } from "date-fns/locale"

import "react-big-calendar/lib/css/react-big-calendar.css"

const locales = { "de-DE": de }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

interface BigCalendarWrapperProps {
  events: any[]
  view: View
  onView: (v: View) => void
  date: Date
  onNavigate: (...args: any[]) => void
  onSelectEvent: (event: any) => void
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void
  selectable: boolean
  eventPropGetter: (event: any) => { style: React.CSSProperties }
  components: any
  messages: any
  style?: React.CSSProperties
}

export function BigCalendarWrapper({
  events,
  view,
  onView,
  date,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
  selectable,
  eventPropGetter,
  components,
  messages,
  style,
}: BigCalendarWrapperProps) {
  return (
    <BigCalendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      view={view}
      onView={onView}
      date={date}
      onNavigate={onNavigate}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      selectable={selectable}
      eventPropGetter={eventPropGetter}
      components={components}
      messages={messages}
      culture="de-DE"
      style={style ?? { height: 600 }}
      popup
    />
  )
}
