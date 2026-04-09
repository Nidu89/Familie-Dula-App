import { googleCalendarProvider } from "./google"
import { icloudCalendarProvider } from "./icloud"
import type { CalendarProvider } from "./types"

export type { CalendarProvider, ExternalCalendar, ExternalEvent, ProviderCredentials, GoogleCredentials, ICloudCredentials } from "./types"

const providers: Record<string, CalendarProvider> = {
  google: googleCalendarProvider,
  icloud: icloudCalendarProvider,
}

export function getProvider(providerName: string): CalendarProvider {
  const provider = providers[providerName]
  if (!provider) {
    throw new Error(`Unknown calendar provider: ${providerName}`)
  }
  return provider
}
