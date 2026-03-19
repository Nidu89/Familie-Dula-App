import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail-Adresse ist erforderlich")
    .email("Bitte gib eine gueltige E-Mail-Adresse ein"),
  password: z
    .string()
    .min(1, "Passwort ist erforderlich")
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "E-Mail-Adresse ist erforderlich")
      .email("Bitte gib eine gueltige E-Mail-Adresse ein"),
    password: z
      .string()
      .min(1, "Passwort ist erforderlich")
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
    confirmPassword: z
      .string()
      .min(1, "Passwort-Bestaetigung ist erforderlich"),
    displayName: z
      .string()
      .min(1, "Anzeigename ist erforderlich")
      .min(2, "Anzeigename muss mindestens 2 Zeichen lang sein")
      .max(50, "Anzeigename darf maximal 50 Zeichen lang sein"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwoerter stimmen nicht ueberein",
    path: ["confirmPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail-Adresse ist erforderlich")
    .email("Bitte gib eine gueltige E-Mail-Adresse ein"),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Passwort ist erforderlich")
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
    confirmPassword: z
      .string()
      .min(1, "Passwort-Bestaetigung ist erforderlich"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwoerter stimmen nicht ueberein",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export const joinFamilySchema = z.object({
  familyCode: z
    .string()
    .min(1, "Familien-Code ist erforderlich")
    .min(6, "Familien-Code muss mindestens 6 Zeichen lang sein"),
})

export type JoinFamilyFormValues = z.infer<typeof joinFamilySchema>
