import { OverviewCards } from "@/components/dashboard/OverviewCards"
import { EvolutionChart } from "@/components/dashboard/EvolutionChart"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Bem-vindo, Professor</h2>
        <p className="text-muted-foreground mt-1">Aqui está o resumo do desempenho das suas turmas hoje.</p>
      </div>

      <OverviewCards />

      <div className="grid gap-6 md:grid-cols-6">
        <EvolutionChart />
        
        <Card className="col-span-2 border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Ações Recomendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Chamada Pendente</span>
                  <Badge variant="outline" className="text-accent border-accent">Urgente</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Turma 9º Ano A - Matemática ainda não teve a chamada registrada hoje.</p>
              </div>
              
              <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Relatório AI</span>
                  <Badge variant="secondary">Novo</Badge>
                </div>
                <p className="text-xs text-muted-foreground">3 alunos da Turma 8º B atingiram novos níveis de competência Bloom.</p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Planejamento</span>
                  <Badge variant="outline">Aviso</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Seu cronograma de conteúdos de Português termina em 3 dias.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
