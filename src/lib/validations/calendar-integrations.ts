import { z } from "zod"

export const providerEnum = z.enum(["google", "icloud"])

export const connectICloudSchema = z.object({
  appleId: z
    .string()
    .trim()
    .min(1, "Apple-ID erforderlich.")
    .max(200)
    .email("Ungueltige Apple-ID (E-Mail erwartet)."),
  appPassword: z
    .string()
    .trim()
    .min(1, "App-spezifisches Passwort erforderlich.")
    .max(200),
})

export type ConnectICloudValues = z.infer<typeof connectICloudSchema>

export const updateSelectedCalendarsSchema = z.object({
  integrationId: z.string().uuid("Ungueltige Integrations-ID."),
  selectedCalendars: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
  ),
})

export type UpdateSelectedCalendarsValues = z.infer<typeof updateSelectedCalendarsSchema>

export const disconnectIntegrationSchema = z.object({
  integrationId: z.string().uuid("Ungueltige Integrations-ID."),
})

export type DisconnectIntegrationValues = z.infer<typeof disconnectIntegrationSchema>

export const syncIntegrationSchema = z.object({
  integrationId: z.string().uuid("Ungueltige Integrations-ID."),
})

export type SyncIntegrationValues = z.infer<typeof syncIntegrationSchema>

export const updateSyncIntervalSchema = z.object({
  integrationId: z.string().uuid("Ungueltige Integrations-ID."),
  syncIntervalMinutes: z.number().int().min(15).max(60),
})

export type UpdateSyncIntervalValues = z.infer<typeof updateSyncIntervalSchema>
