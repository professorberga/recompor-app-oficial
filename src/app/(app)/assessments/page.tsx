"use client"

import { useState, useRef, useEffect } from "react"
import { BrainCircuit, FileDown, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [mounted, setMounted] = useState(false)
  const [subject, setSubject] = useState<"Portuguese" | "Math">("Portuguese")
  const [competency, setCompetency] = useState("")
  const [bloomLevel, setBloomLevel] = useState<any>("Remember")
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<string[]>([])
  const { toast } = useToast()
  
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      toast({
        title: "Atividades Geradas",
        description: "A IA criou novas questões baseadas na Taxonomia de Bloom.",
      })
    } catch (error) {
      toast({ title: "Erro na IA", description: "Não foi possível gerar os itens de avaliação no momento.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (generatedItems.length === 0 || !printRef.current) return
    setIsExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      
      const canvas = await html2canvas(printRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Atividades_Bloom_${subject}_${competency.replace(/\s+/g, '_')}.pdf`)
      
      toast({
        title: "Exportação concluída",
        description: "O PDF das atividades foi gerado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
      toast({ title: "Erro na exportação", description: "Não foi possível gerar o PDF.", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded"></div>
        <div className="h-4 w-96 bg-muted rounded"></div>
      </div>
    )
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
              <div className="space-y-4" ref={printRef}>
                <div className="hidden print:block mb-8 border-b-2 border-primary pb-4">
                  <h1 className="text-2xl font-bold text-primary">Recompor+ - Roteiro de Atividades</h1>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <p><strong>Disciplina:</strong> {subject === 'Portuguese' ? 'Língua Portuguesa' : 'Matemática'}</p>
                    <p><strong>Competência:</strong> {competency}</p>
                    <p><strong>Nível Bloom:</strong> {BLOOM_LEVELS.find(l => l.value === bloomLevel)?.label}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {generatedItems.map((item, idx) => (
                    <div key={idx} className="p-5 rounded-xl bg-muted/30 border border-border/50 group hover:border-primary/50 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-foreground/90 whitespace-pre-wrap">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Sparkles className="h-12 w-12 mb-4" />
                <p className="max-w-[250px]">Use a IA ao lado para gerar itens de avaliação personalizados para sua aula.</p>
              </div>
            )}
          </CardContent>
          {generatedItems.length > 0 && (
            <CardFooter className="border-t p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-xs text-muted-foreground italic">Powered by Recompor+ AI Intelligence</span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none gap-2"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  <FileDown className="h-4 w-4" />
                  {isExporting ? "Gerando..." : "Exportar PDF"}
                </Button>
                <Button className="flex-1 sm:flex-none bg-primary shadow-md">Salvar no Diário</Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
