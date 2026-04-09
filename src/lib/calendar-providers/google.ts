import { google } from "googleapis"
import type {
  CalendarProvider,
  ExternalCalendar,
  ExternalEvent,
  GoogleCredentials,
  ProviderCredentials,
} from "./types"

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`
  )
}

/** Build the Google OAuth consent URL */
export function getGoogleAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    state,
  })
}

/** Exchange authorization code for tokens */
export async function exchangeGoogleCode(
  code: string
): Promise<GoogleCredentials> {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Google OAuth: missing tokens")
  }

  return {
    provider: "google",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ?? Date.now() + 3600 * 1000,
  }
}

/** Refresh an expired Google access token */
async function refreshAccessToken(
  creds: GoogleCredentials
): Promise<GoogleCredentials> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: creds.refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return {
    ...creds,
    accessToken: credentials.access_token ?? creds.accessToken,
    expiresAt: credentials.expiry_date ?? Date.now() + 3600 * 1000,
  }
}

function asGoogle(creds: ProviderCredentials): GoogleCredentials {
  return creds as GoogleCredentials
}

async function getAuthedCalendar(creds: GoogleCredentials) {
  let activeCreds = creds
  // Refresh token if expired (with 5 min buffer)
  if (activeCreds.expiresAt < Date.now() + 5 * 60 * 1000) {
    activeCreds = await refreshAccessToken(activeCreds)
  }

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: activeCreds.accessToken,
    refresh_token: activeCreds.refreshToken,
  })

  return {
    calendar: google.calendar({ version: "v3", auth: oauth2Client }),
    updatedCreds: activeCreds,
  }
}

export const googleCalendarProvider: CalendarProvider = {
  async fetchCalendars(credentials) {
    const creds = asGoogle(credentials)
    const { calendar } = await getAuthedCalendar(creds)

    const res = await calendar.calendarList.list()
    const items = res.data.items ?? []

    return items.map(
      (item): ExternalCalendar => ({
        id: item.id ?? "",
        name: item.summary ?? "Unnamed",
        color: item.backgroundColor ?? undefined,
      })
    )
  },

  async fetchEvents(credentials, calendarIds, startDate, endDate) {
    const creds = asGoogle(credentials)
    const { calendar } = await getAuthedCalendar(creds)

    const allEvents: ExternalEvent[] = []

    for (const calendarId of calendarIds) {
      const res = await calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,    // expand recurring events
        orderBy: "startTime",
        maxResults: 250,
      })

      const calName =
        res.data.summary ?? calendarId

      for (const item of res.data.items ?? []) {
        if (item.status === "cancelled") continue

        const isAllDay = !!item.start?.date
        const startAt = item.start?.dateTime ?? item.start?.date ?? ""
        const endAt = item.end?.dateTime ?? item.end?.date ?? ""

        if (!startAt || !endAt) continue

        allEvents.push({
          externalEventId: item.id ?? "",
          title: item.summary ?? "(Kein Titel)",
          description: item.description ?? undefined,
          location: item.location ?? undefined,
          startAt: isAllDay ? `${startAt}T00:00:00` : startAt,
          endAt: isAllDay ? `${endAt}T00:00:00` : endAt,
          allDay: isAllDay,
          calendarName: calName,
        })
      }
    }

    return allEvents
  },

  async validateCredentials(credentials) {
    try {
      const creds = asGoogle(credentials)
      const { calendar } = await getAuthedCalendar(creds)
      await calendar.calendarList.list({ maxResults: 1 })
      return true
    } catch {
      return false
    }
  },
}
