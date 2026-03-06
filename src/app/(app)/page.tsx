import { redirect } from "next/navigation"

export default function AppRootPage() {
  // Redireciona para /dashboard para manter consistência com o menu lateral
  redirect("/dashboard")
}
