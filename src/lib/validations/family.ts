import { z } from "zod"

export const createFamilySchema = z.object({
  familyName: z
    .string()
    .min(1, "Familienname ist erforderlich")
    .min(2, "Familienname muss mindestens 2 Zeichen lang sein")
    .max(50, "Familienname darf maximal 50 Zeichen lang sein"),
})

export type CreateFamilyFormValues = z.infer<typeof createFamilySchema>

export const joinFamilyByCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Einladungscode ist erforderlich")
    .length(6, "Einladungscode muss genau 6 Zeichen lang sein")
    .regex(/^\d{6}$/, "Einladungscode muss aus 6 Ziffern bestehen"),
})

export type JoinFamilyByCodeFormValues = z.infer<typeof joinFamilyByCodeSchema>

export const updateFamilyNameSchema = z.object({
  familyName: z
    .string()
    .min(1, "Familienname ist erforderlich")
    .min(2, "Familienname muss mindestens 2 Zeichen lang sein")
    .max(50, "Familienname darf maximal 50 Zeichen lang sein"),
})

export type UpdateFamilyNameFormValues = z.infer<typeof updateFamilyNameSchema>

export const inviteByEmailSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail-Adresse ist erforderlich")
    .email("Bitte gib eine gueltige E-Mail-Adresse ein"),
})

export type InviteByEmailFormValues = z.infer<typeof inviteByEmailSchema>

export const updateRoleSchema = z.object({
  memberId: z.string().uuid("Ungueltige Mitglieds-ID"),
  role: z.enum(["admin", "adult", "child"], {
    error: "Ungueltige Rolle",
  }),
})

export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>

export const removeMemberSchema = z.object({
  memberId: z.string().uuid("Ungueltige Mitglieds-ID"),
})

export type RemoveMemberFormValues = z.infer<typeof removeMemberSchema>
