import { createDAVClient, DAVCalendar } from "tsdav"
import type {
  CalendarProvider,
  ExternalCalendar,
  ExternalEvent,
  ICloudCredentials,
  ProviderCredentials,
} from "./types"

const ICLOUD_CALDAV_URL = "https://caldav.icloud.com"

function asICloud(creds: ProviderCredentials): ICloudCredentials {
  return creds as ICloudCredentials
}

async function getDAVClient(creds: ICloudCredentials) {
  return createDAVClient({
    serverUrl: creds.caldavUrl || ICLOUD_CALDAV_URL,
    credentials: {
      username: creds.appleId,
      password: creds.appPassword,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  })
}

/** Parse an iCal VEVENT string into an ExternalEvent */
function parseVEvent(
  icalData: string,
  calendarName: string
): ExternalEvent | null {
  const getField = (field: string): string | null => {
    // Handle multi-line folded values (RFC 5545 line folding)
    const regex = new RegExp(`^${field}[;:](.*)`, "m")
    const match = icalData.match(regex)
    if (!match) return null
    let value = match[1]
    // Unfold continuation lines
    const lines = icalData.split("\n")
    const idx = lines.findIndex((l) => l.match(regex))
    if (idx >= 0) {
      let i = idx + 1
      while (i < lines.length && (lines[i].startsWith(" ") || lines[i].startsWith("\t"))) {
        value += lines[i].substring(1)
        i++
      }
    }
    return value.trim()
  }

  const uid = getField("UID")
  const summary = getField("SUMMARY")
  const dtstart = getField("DTSTART")
  const dtend = getField("DTEND")

  if (!uid || !dtstart) return null

  const isAllDay = !dtstart.includes("T")

  function parseICalDate(raw: string): string {
    // Remove VALUE=DATE: prefix if present
    const cleaned = raw.replace(/^VALUE=DATE(-TIME)?:/, "").replace(/^.*:/, "")
    if (cleaned.length === 8) {
      // YYYYMMDD format (all-day)
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}T00:00:00`
    }
    if (cleaned.includes("T")) {
      // YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
      const d = cleaned.replace("Z", "")
      return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}`
    }
    return cleaned
  }

  const startAt = parseICalDate(dtstart)
  // If no DTEND, assume same day for all-day or +1 hour for timed
  const endAt = dtend
    ? parseICalDate(dtend)
    : isAllDay
      ? startAt
      : new Date(new Date(startAt).getTime() + 3600000).toISOString()

  return {
    externalEventId: uid,
    title: summary ?? "(Kein Titel)",
    description: getField("DESCRIPTION") ?? undefined,
    location: getField("LOCATION") ?? undefined,
    startAt,
    endAt,
    allDay: isAllDay,
    calendarName,
  }
}

export const icloudCalendarProvider: CalendarProvider = {
  async fetchCalendars(credentials) {
    const creds = asICloud(credentials)
    const client = await getDAVClient(creds)

    const calendars: DAVCalendar[] = await client.fetchCalendars()

    return calendars.map(
      (cal): ExternalCalendar => ({
        id: cal.url,
        name: typeof cal.displayName === "string" ? cal.displayName : "Unnamed",
        color: undefined,
      })
    )
  },

  async fetchEvents(credentials, calendarIds, startDate, endDate) {
    const creds = asICloud(credentials)
    const client = await getDAVClient(creds)

    const allEvents: ExternalEvent[] = []

    const calendars: DAVCalendar[] = await client.fetchCalendars()
    const selectedCalendars = calendars.filter((c) =>
      calendarIds.includes(c.url)
    )

    for (const cal of selectedCalendars) {
      const objects = await client.fetchCalendarObjects({
        calendar: cal,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      })

      for (const obj of objects) {
        if (!obj.data) continue
        const calName = typeof cal.displayName === "string" ? cal.displayName : "iCloud"
        const event = parseVEvent(obj.data, calName)
        if (event) {
          allEvents.push(event)
        }
      }
    }

    return allEvents
  },

  async validateCredentials(credentials) {
    try {
      const creds = asICloud(credentials)
      const client = await getDAVClient(creds)
      await client.fetchCalendars()
      return true
    } catch {
      return false
    }
  },
}
