"use client"

import { useState } from "react"
import { BrainCircuit, Search, Info, Plus, Sparkles, Send } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { generateBloomAssessmentItems } from "@/ai/flows/bloom-assessment-item-generator"
import { useToast } from "@/hooks/use-toast"

const BLOOM_LEVELS = [
  { value: 'Remember', label: 'Lembrar', color: 'bg-blue-100 text-blue-700' },
  { value: 'Understand', label: 'Entender', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'Apply', label: 'Aplicar', color: 'bg-teal-100 text-teal-700' },
  { value: 'Analyze', label: 'Analisar', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'Evaluate', label: 'Avaliar', color: 'bg-violet-100 text-violet-700' },
  { value: 'Create', label: 'Criar', color: 'bg-pink-100 text-pink-700' },
]

export default function AssessmentPage() {
  const [subject, setSubject] = useState<"Portuguese" | "Math">("Portuguese")
  const [competency, setCompetency] = useState("")
  const [bloomLevel, setBloomLevel] = useState<any>("Remember")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<string[]>([])
  const { toast } = useToast()

  const handleGenerateAI = async () => {
    if (!competency) {
      toast({ title: "Campo obrigatório", description: "Por favor, descreva a competência para gerar os itens.", variant: "destructive" })
      return
    }
    
    setIsLoading(true)
    try {
      const result = await generateBloomAssessmentItems({
        subject,
        competency,
        bloomLevel,
        numItems: 3
      })
      setGeneratedItems(result.items)
    } catch (error) {
      toast({ title: "Erro na IA", description: "Não foi possível gerar os itens de avaliação no momento.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Avaliação Bloom</h2>
        <p className="text-muted-foreground mt-1">Avalie competências e gere atividades baseadas na taxonomia de Bloom.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 border-none shadow-md bg-white h-fit">
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>Defina o foco da avaliação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Matéria</Label>
              <Select value={subject} onValueChange={(v: any) => setSubject(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portuguese">Português</SelectItem>
                  <SelectItem value="Math">Matemática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Competência / Habilidade</Label>
              <Input 
                placeholder="Ex: Resolução de frações" 
                value={competency}
                onChange={(e) => setCompetency(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Nível de Bloom</Label>
              <div className="grid grid-cols-2 gap-2">
                {BLOOM_LEVELS.map((level) => (
                  <Button
                    key={level.value}
                    variant={bloomLevel === level.value ? "default" : "outline"}
                    className={`justify-start h-9 text-xs font-medium ${bloomLevel === level.value ? 'bg-primary shadow-md' : ''}`}
                    onClick={() => setBloomLevel(level.value)}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              className="w-full gap-2 mt-4 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
              onClick={handleGenerateAI}
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4" /> 
              {isLoading ? "Gerando..." : "Gerar Atividades com IA"}
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-none shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Roteiro de Avaliação</CardTitle>
              <CardDescription>Atividades sugeridas para esta competência</CardDescription>
            </div>
            <BrainCircuit className="h-6 w-6 text-primary/40" />
          </CardHeader>
          <CardContent>
            {generatedItems.length > 0 ? (
              <div className="space-y-4">
                {generatedItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/50 group hover:border-primary/50 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium leading-relaxed">{item}</p>
                      <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Sparkles className="h-12 w-12 mb-4" />
                <p className="max-w-[250px]">Use a IA ao lado para gerar itens de avaliação personalizados para sua aula.</p>
              </div>
            )}
          </CardContent>
          {generatedItems.length > 0 && (
            <CardFooter className="border-t p-4 flex justify-between">
              <span className="text-xs text-muted-foreground italic">Powered by Bloom Intelligence Flow</span>
              <Button size="sm" variant="outline" className="text-primary border-primary">Salvar no Diário</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}