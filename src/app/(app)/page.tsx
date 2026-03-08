import { redirect } from "next/navigation"

export default function AppRootPage() {
  // Mantém consistência com o grupo de rotas
  redirect("/dashboard")
}
