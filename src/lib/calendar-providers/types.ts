/**
 * Provider abstraction layer for calendar integrations.
 * Each provider (Google, iCloud, future Outlook) implements this interface.
 */

export interface ExternalCalendar {
  id: string
  name: string
  color?: string
}

export interface ExternalEvent {
  externalEventId: string
  title: string
  description?: string
  location?: string
  startAt: string      // ISO 8601
  endAt: string        // ISO 8601
  allDay: boolean
  calendarName?: string
}

export interface ProviderCredentials {
  provider: "google" | "icloud"
  [key: string]: unknown
}

export interface GoogleCredentials extends ProviderCredentials {
  provider: "google"
  accessToken: string
  refreshToken: string
  expiresAt: number      // Unix timestamp (ms)
}

export interface ICloudCredentials extends ProviderCredentials {
  provider: "icloud"
  appleId: string
  appPassword: string
  caldavUrl: string
}

export interface CalendarProvider {
  /** List available calendars for the user */
  fetchCalendars(credentials: ProviderCredentials): Promise<ExternalCalendar[]>

  /** Fetch events from selected calendars in a date range */
  fetchEvents(
    credentials: ProviderCredentials,
    calendarIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<ExternalEvent[]>

  /** Validate that credentials are still valid */
  validateCredentials(credentials: ProviderCredentials): Promise<boolean>
}
