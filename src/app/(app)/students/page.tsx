"use client"

import { useState } from "react"
import { Search, UserPlus, Filter, MoreHorizontal, GraduationCap, Eye, BrainCircuit, FileText, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { personalizedLearningSuggestions, PersonalizedLearningSuggestionsOutput } from "@/ai/flows/personalized-learning-suggestions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Beatriz Silva', class: '9º Ano A', subject: 'Português', trend: 'up', bloomLevel: 'Apply' },
  { id: '2', name: 'Bruno Oliveira Souza', class: '9º Ano A', subject: 'Português', trend: 'stable', bloomLevel: 'Understand' },
  { id: '3', name: 'Carlos Eduardo Santos', class: '9º Ano A', subject: 'Português', trend: 'up', bloomLevel: 'Analyze' },
  { id: '4', name: 'Daniela Lima Ferreira', class: '9º Ano B', subject: 'Português', trend: 'down', bloomLevel: 'Remember' },
  { id: '5', name: 'Eduardo Pereira Costa', class: '9º Ano B', subject: 'Português', trend: 'up', bloomLevel: 'Create' },
]

export default function StudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [aiInsight, setAiInsight] = useState<PersonalizedLearningSuggestionsOutput | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const { toast } = useToast()

  const generateAiInsight = async (student: any) => {
    setIsAiLoading(true)
    try {
      const result = await personalizedLearningSuggestions({
        studentName: student.name,
        assessmentData: [
          { competency: 'Interpretação de Texto', skill: 'Leitura Crítica', score: 85, notes: 'Demonstra boa compreensão mas falha em inferências complexas.' },
          { competency: 'Gramática', skill: 'Sintaxe', score: 70 },
        ],
        observationalNotes: [
          'Participativo em sala.',
          'Às vezes disperso em atividades em grupo.',
          'Melhorou significativamente na última redação.'
        ]
      })
      setAiInsight(result)
    } catch (error) {
      toast({ title: "Erro na IA", description: "Não foi possível gerar os insights agora.", variant: "destructive" })
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gestão de Alunos</h2>
          <p className="text-muted-foreground mt-1">Acompanhe perfis individuais e histórico de aprendizagem.</p>
        </div>
        <Button className="gap-2 shadow-lg">
          <UserPlus className="h-4 w-4" /> Cadastrar Aluno
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou turma..." className="pl-10 bg-muted/20 border-none" />
        </div>
        <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filtros</Button>
      </div>

      <div className="grid gap-4">
        {MOCK_STUDENTS.map((student) => (
          <Card key={student.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
            <CardContent className="p-0 flex items-center h-20">
              <div className="w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="px-6 flex-1 grid grid-cols-4 items-center">
                <div className="flex items-center gap-3 col-span-1">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary">
                    {student.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-sm truncate">{student.name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Turma</span>
                  <span className="text-sm font-medium">{student.class}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nível Bloom Atual</span>
                  <Badge variant="secondary" className="w-fit text-[10px] h-5">{student.bloomLevel}</Badge>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                        setSelectedStudent(student)
                        setAiInsight(null)
                      }}>
                        <Eye className="h-4 w-4" /> Ficha
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                      <DialogHeader className="p-6 bg-primary text-primary-foreground">
                        <DialogTitle className="text-2xl flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                            {selectedStudent?.name.charAt(0)}
                          </div>
                          {selectedStudent?.name}
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80">
                          {selectedStudent?.class} • {selectedStudent?.subject}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="flex-1 p-6">
                        <div className="grid gap-6">
                          <div className="grid grid-cols-3 gap-4">
                            <Card className="p-4 bg-muted/10 border-border/50">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">Frequência</span>
                              <p className="text-2xl font-bold text-primary mt-1">94%</p>
                            </Card>
                            <Card className="p-4 bg-muted/10 border-border/50">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">Média Bloom</span>
                              <p className="text-2xl font-bold text-primary mt-1">{selectedStudent?.bloomLevel}</p>
                            </Card>
                            <Card className="p-4 bg-muted/10 border-border/50">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">Participação</span>
                              <p className="text-2xl font-bold text-primary mt-1">Alta</p>
                            </Card>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-lg flex items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-accent" />
                                Insights Inteligentes (IA)
                              </h4>
                              <Button 
                                size="sm" 
                                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md gap-2"
                                onClick={() => generateAiInsight(selectedStudent)}
                                disabled={isAiLoading}
                              >
                                <Sparkles className="h-4 w-4" /> 
                                {isAiLoading ? "Analisando..." : "Gerar Relatório IA"}
                              </Button>
                            </div>

                            {aiInsight ? (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                <Card className="p-4 border-accent/20 bg-accent/5">
                                  <h5 className="font-bold text-sm mb-2 text-accent-foreground">Resumo de Progresso</h5>
                                  <p className="text-sm leading-relaxed">{aiInsight.progressSummary}</p>
                                </Card>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h5 className="font-bold text-xs uppercase text-green-600">Pontos Fortes</h5>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                      {aiInsight.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                  </div>
                                  <div className="space-y-2">
                                    <h5 className="font-bold text-xs uppercase text-amber-600">Áreas de Melhoria</h5>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                      {aiInsight.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
                                    </ul>
                                  </div>
                                </div>
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                  <h5 className="font-bold text-sm mb-2 text-primary">Sugestões de Aprendizagem</h5>
                                  <ul className="space-y-2">
                                    {aiInsight.learningSuggestions.map((s, i) => (
                                      <li key={i} className="text-sm flex gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ) : !isAiLoading && (
                              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl border-muted">
                                <Sparkles className="h-8 w-8 text-muted mb-2" />
                                <p className="text-sm text-muted-foreground">Clique no botão acima para gerar uma análise profunda do estudante.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                        <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" /> Exportar PDF</Button>
                        <Button className="bg-primary text-primary-foreground">Salvar Observações</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar Aluno</DropdownMenuItem>
                      <DropdownMenuItem>Lançar Ocorrência</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remover da Turma</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}