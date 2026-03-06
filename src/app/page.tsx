import { redirect } from "next/navigation"

export default function RootPage() {
  // Redireciona a raiz para o dashboard dentro do grupo (app)
  redirect("/dashboard")
}
