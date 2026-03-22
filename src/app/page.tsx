import { redirect } from "next/navigation"

export default function Home() {
  // Middleware leitet zu /login (nicht eingeloggt), /onboarding (keine Familie)
  // oder /dashboard (eingeloggt + Familie) weiter.
  redirect("/dashboard")
}
