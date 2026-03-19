import { redirect } from "next/navigation"

export default function Home() {
  // TODO: Middleware wird im /backend Skill eingerichtet
  // Vorlaeufig: Weiterleitung zur Login-Seite
  redirect("/login")
}
