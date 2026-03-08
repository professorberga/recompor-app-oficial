
"use client"

import { useState, useEffect } from "react"
import { 
  School, Settings as SettingsIcon, Plus, UserPlus, Pencil, History, Loader2, Save, UserCheck, CheckCircle2, X, PlusCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { TeacherProfile, TeacherAssignment } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { doc, setDoc, collection, query, getDocs, where, getDoc } from "firebase/firestore"
import { format, startOfWeek, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const LESSONS_LIST = [
  "1ª aula (07:00 - 07:50)",
  "2ª aula (07:50 - 08:40)",
  "3ª aula (08:40 - 09:30)",
  "4ª aula (09:50 - 10:40)",
  "5ª aula (10:40 - 11:30)",
  "6ª aula (11:30 - 12:20)",
  "7ª aula (13:30 - 14:20)",
  "8ª aula (14:20 - 15:10)",
  "9ª aula (15:10 - 16:00)"
];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const { user, profile, schoolConfig, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Partial<TeacherProfile> | null>(null)
  const [auditData, setAuditData] = useState<any[]>([])
  const [isAuditing, setIsAuditing] = useState(false)

  const [profileData, setProfileData] = useState({
    name: "",
    email: ""
  })

  const [schoolData, setSchoolData] = useState({
    schoolName: "",
    academicYear: "",
    activeBimestre: ""
  })

  const teachersRef = useMemoFirebase(() => 
    isAdmin ? collection(firestore, "teachers") : null, 
    [isAdmin, firestore]
  )
  const { data: allTeachers = [], isLoading: isTeachersLoading } = useCollection(teachersRef)

  const globalClassesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const { data: globalClasses = [] } = useCollection(globalClassesRef)

  useEffect(() => {
    setMounted(true)
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || ""
      })
    }
    if (schoolConfig) {
      setSchoolData({
        schoolName: schoolConfig.schoolName || "",
        academicYear: schoolConfig.academicYear || "",
        activeBimestre: schoolConfig.activeBimestre || "1"
      })
    }
  }, [profile, schoolConfig])

  const runAudit = async () => {
    if (!isAdmin) return;
    setIsAuditing(true);
    const results: any[] = [];
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end: today });

    try {
      for (const teacher of allTeachers) {
        if (!teacher.assignments || teacher.assignments.length === 0) continue;
        
        for (const assignment of teacher.assignments) {
          // Normalização do dia da semana para comparação
          const matchingDays = days.filter(d => {
            const dayName = format(d, 'EEEE', { locale: ptBR }).toLowerCase();
            return dayName.includes(assignment.dayOfWeek?.toLowerCase() || '');
          });
          
          for (const day of matchingDays) {
            const dateStr = format(day, "yyyy-MM-dd");
            const lessonId = `${assignment.classId}_${dateStr}`;
            
            // Verifica presença de registros de frequência
            const recordsQuery = query(
              collection(firestore, 'attendanceRecords'),
              where('classId', '==', assignment.classId),
              where('date', '==', dateStr),
              where('teacherId', '==', teacher.id)
            );
            const recordsSnap = await getDocs(recordsQuery);
            
            // Verifica presença de registro de aula (conteúdo)
            const lessonRef = doc(firestore, 'lessons', lessonId);
            const lessonSnap = await getDoc(lessonRef);
            
            let status = 'pending'; 
            if (!recordsSnap.empty) {
              const lessonData = lessonSnap.exists() ? lessonSnap.data() : null;
              status = (lessonData && lessonData.content && lessonData.content.trim() !== "") ? 'complete' : 'partial';
            }

            // Lookup seguro de nome de turma e disciplina
            const classInfo = globalClasses.find(c => c.id === assignment.classId);
            
            results.push({
              teacherName: teacher.name || "Sem Nome",
              className: assignment.className || classInfo?.name || "Turma s/ Nome",
              subject: assignment.subject || classInfo?.subject || "Sem Disciplina",
              date: format(day, "dd/MM (EEEE)", { locale: ptBR }),
              lesson: assignment.lessonNumber || "Aula s/ Ref",
              status
            });
          }
        }
      }
      // Ordena por data (mais recentes primeiro)
      setAuditData(results.reverse());
    } catch (err) {
      console.error(err);
      toast({ title: "Erro na auditoria", description: "Falha ao consultar coleções globais.", variant: "destructive" });
    } finally {
      setIsAuditing(false);
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await setDoc(doc(firestore, "teachers", user.uid), profileData, { merge: true });
      toast({ title: "Perfil atualizado" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSchool = async () => {
    if (!isAdmin) return
    setIsSaving(true)
    try {
      await setDoc(doc(firestore, "settings", "school"), schoolData, { merge: true });
      toast({ title: "Configurações da escola atualizadas" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !editingTeacher?.email || !editingTeacher?.name) {
      toast({ title: "Nome e E-mail obrigatórios", variant: "destructive" });
      return;
    }
    setIsSaving(true)
    
    const teacherId = editingTeacher.id || editingTeacher.email.replace(/[.@]/g, '_');
    
    try {
      await setDoc(doc(firestore, "teachers", teacherId), {
        ...editingTeacher,
        id: teacherId,
        role: editingTeacher.role || 'Professor'
      }, { merge: true })
      setIsTeacherDialogOpen(false)
      setEditingTeacher(null)
      toast({ title: "Docente atualizado institucionalmente" })
    } catch (error) {
      toast({ title: "Falha na gravação", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const updateAssignment = (index: number, field: keyof TeacherAssignment, value: string) => {
    if (!editingTeacher || !editingTeacher.assignments) return;
    const next = [...editingTeacher.assignments];
    const assignment = { ...next[index], [field]: value };
    
    // Sincroniza o nome da turma automaticamente ao selecionar o ID
    if (field === 'classId') {
      const classInfo = globalClasses.find(c => c.id === value);
      assignment.className = classInfo?.name || "";
      // Se a disciplina ainda for padrão, sugere a disciplina da turma
      if (!assignment.subject) {
        assignment.subject = classInfo?.subject === 'Portuguese' ? 'Português' : 'Matemática';
      }
    }
    
    next[index] = assignment;
    setEditingTeacher({ ...editingTeacher, assignments: next });
  }

  if (!mounted || isUserLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Gestão & Auditoria</h2>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Identidade institucional e controle de conformidade pedagógica." : "Meus dados e histórico docente."}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn(
          "grid w-full bg-white border h-auto p-1 shadow-sm",
          isAdmin ? "grid-cols-4 md:grid-cols-4" : "grid-cols-1 md:grid-cols-1"
        )}>
          <TabsTrigger value="profile" className="font-bold py-2 uppercase text-[10px]">Meus Dados</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="school" className="font-bold py-2 uppercase text-[10px]">Escola</TabsTrigger>
              <TabsTrigger value="users" className="font-bold py-2 uppercase text-[10px]">Docentes</TabsTrigger>
              <TabsTrigger value="audit" className="font-bold py-2 uppercase text-[10px]" onClick={runAudit}>Auditoria</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase text-primary">Perfil Docente</CardTitle>
              <CardDescription>Visualize e edite suas informações de contato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase">Nome Completo</Label><Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase">E-mail Institucional</Label><Input value={user?.email || ""} disabled className="bg-muted opacity-60" /></div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="font-bold shadow-lg">{isSaving ? "Gravando..." : "Salvar Perfil"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="school" className="mt-6">
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-black uppercase text-primary">Configurações Escolares</CardTitle>
                <CardDescription>Defina o nome da unidade e o período letivo vigente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label className="text-xs font-bold uppercase">Nome da Escola</Label><Input value={schoolData.schoolName} onChange={(e) => setSchoolData({...schoolData, schoolName: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold uppercase">Ano Letivo</Label><Input value={schoolData.academicYear} onChange={(e) => setSchoolData({...schoolData, academicYear: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Bimestre Ativo</Label>
                    <Select value={schoolData.activeBimestre} onValueChange={(v) => setSchoolData({...schoolData, activeBimestre: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Bimestre</SelectItem>
                        <SelectItem value="2">2º Bimestre</SelectItem>
                        <SelectItem value="3">3º Bimestre</SelectItem>
                        <SelectItem value="4">4º Bimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveSchool} disabled={isSaving} className="font-bold shadow-lg">Salvar Configurações da Escola</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="users" className="mt-6 space-y-6">
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="text-xl font-black uppercase text-primary">Quadro Docente</CardTitle><CardDescription className="font-bold text-xs">Gestão institucional de acessos e atribuições.</CardDescription></div>
                <Button onClick={() => { setEditingTeacher({ assignments: [], role: 'Professor' }); setIsTeacherDialogOpen(true); }} className="font-bold shadow-md"><UserPlus className="h-4 w-4 mr-2" /> Novo Docente</Button>
              </CardHeader>
              <CardContent>
                {isTeachersLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div> : (
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b font-black uppercase text-[9px] tracking-widest text-muted-foreground">
                        <tr><th className="px-6 py-4">Docente</th><th className="px-6 py-4">Perfil</th><th className="px-6 py-4">Grade</th><th className="px-6 py-4 text-right">Ações</th></tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {allTeachers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4"><span className="font-black block uppercase text-xs text-primary">{t.name}</span><span className="text-[10px] font-medium opacity-60 italic">{t.email}</span></td>
                            <td className="px-6 py-4"><Badge variant={t.role === 'Admin' ? 'default' : 'outline'} className="font-black text-[9px] uppercase tracking-tighter">{t.role}</Badge></td>
                            <td className="px-6 py-4"><span className="text-[10px] font-black text-muted-foreground uppercase">{t.assignments?.length || 0} aulas / semana</span></td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary" onClick={() => { setEditingTeacher(t); setIsTeacherDialogOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="audit" className="mt-6 space-y-6">
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="text-xl font-black uppercase text-primary">Auditoria de Lançamentos</CardTitle><CardDescription className="font-bold text-xs">Conferência reativa entre grade prevista e registros reais.</CardDescription></div>
                <div className="flex gap-2">
                   <Button variant="outline" onClick={runAudit} disabled={isAuditing} className="font-bold shadow-sm">
                    {isAuditing ? <Loader2 className="animate-spin h-4 w-4" /> : <History className="h-4 w-4 mr-2" />}
                    Atualizar Auditoria
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditData.length === 0 && !isAuditing && <div className="text-center py-24 opacity-30 italic font-bold uppercase tracking-widest text-xs">Nenhuma pendência detectada para esta semana.</div>}
                  {auditData.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-3 h-3 rounded-full shadow-inner", a.status === 'complete' ? 'bg-green-500' : a.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500')} />
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase text-primary">{a.teacherName} • {a.className}</span>
                          <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">
                            {a.subject} • {a.date} ({a.lesson.split(' ')[0]})
                          </span>
                        </div>
                      </div>
                      <Badge variant={a.status === 'complete' ? 'outline' : 'destructive'} className={cn("font-black text-[9px] uppercase", a.status === 'complete' && 'border-green-500 text-green-600 bg-green-50')}>
                        {a.status === 'complete' ? 'Ok' : a.status === 'partial' ? 'Sem Conteúdo' : 'Chamada Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Atribuição Docente</DialogTitle>
            <DialogDescription className="text-white/70 font-bold text-xs uppercase tracking-widest">Vincule turmas e defina a grade horária oficial no Firestore.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                <form id="teacher-form" onSubmit={handleSaveTeacher} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-xs font-black uppercase">Nome do Docente</Label><Input value={editingTeacher?.name || ""} onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})} placeholder="Ex: Marcio Bergamini" className="h-11" /></div>
                    <div className="space-y-2"><Label className="text-xs font-black uppercase">E-mail Institucional</Label><Input value={editingTeacher?.email || ""} onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})} placeholder="escola@educacao.sp.gov.br" className="h-11" /></div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase">Perfil de Acesso</Label>
                      <Select value={editingTeacher?.role} onValueChange={(v: any) => setEditingTeacher({...editingTeacher, role: v})}>
                        <SelectTrigger className="h-11 font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professor">Professor</SelectItem>
                          <SelectItem value="Admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary">Grade Horária Semanal</h4>
                      <Button type="button" variant="outline" size="sm" className="font-bold border-2" onClick={() => setEditingTeacher({...editingTeacher, assignments: [...(editingTeacher?.assignments || []), { classId: "", className: "", subject: "Português", dayOfWeek: "Segunda", lessonNumber: LESSONS_LIST[0] }]})}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Nova Aula
                      </Button>
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3 border-2 border-dashed rounded-xl p-4 bg-slate-50/50">
                      {editingTeacher?.assignments?.map((a, idx) => (
                        <div key={idx} className="grid grid-cols-5 gap-3 p-4 border-2 rounded-xl bg-white relative group hover:border-primary/30 transition-all shadow-sm">
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-black text-muted-foreground">Turma</Label>
                            <Select value={a.classId} onValueChange={(v) => updateAssignment(idx, 'classId', v)}>
                              <SelectTrigger className="bg-white h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent>{globalClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-black text-muted-foreground">Disciplina</Label>
                            <Select value={a.subject} onValueChange={(v) => updateAssignment(idx, 'subject', v)}>
                              <SelectTrigger className="bg-white h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Português">Português</SelectItem>
                                <SelectItem value="Matemática">Matemática</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-black text-muted-foreground">Dia</Label>
                            <Select value={a.dayOfWeek} onValueChange={(v) => updateAssignment(idx, 'dayOfWeek', v)}>
                              <SelectTrigger className="bg-white h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent>{DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-black text-muted-foreground">Aula</Label>
                            <Select value={a.lessonNumber} onValueChange={(v) => updateAssignment(idx, 'lessonNumber', v)}>
                              <SelectTrigger className="bg-white h-9 text-xs font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent>{LESSONS_LIST.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end justify-center"><Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { const next = [...(editingTeacher.assignments || [])]; next.splice(idx, 1); setEditingTeacher({...editingTeacher, assignments: next}); }}><X className="h-4 w-4" /></Button></div>
                        </div>
                      ))}
                      {(!editingTeacher?.assignments || editingTeacher.assignments.length === 0) && (
                        <div className="py-12 text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-30 italic">
                          Nenhuma aula atribuída. Clique em "Nova Aula" para começar.
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-6 border-t bg-slate-100 shrink-0">
            <Button type="submit" form="teacher-form" disabled={isSaving} className="w-full h-12 font-black shadow-xl uppercase tracking-widest text-xs">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isSaving ? "Gravando no Firestore..." : "Sincronizar Docente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
