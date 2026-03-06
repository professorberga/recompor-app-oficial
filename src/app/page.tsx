import { redirect } from "next/navigation"

export default function RootPage() {
  // Redireciona para o dashboard dentro do grupo de rotas persistente
  redirect("/dashboard")
}
