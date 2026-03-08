
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  School, Settings as SettingsIcon, Bell, Plus, Search, BookOpen, Users, UserPlus, Mail, Trash2, Pencil, Clock, Info, ChevronRight, UserCheck, UserCircle, Loader2, ShieldAlert, Save, ShieldCheck, MoreHorizontal, PlusCircle, X, ClipboardList, AlertCircle, CheckCircle2, History
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogPortal } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TeacherProfile, UserRole, TeacherAssignment } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { doc, setDoc, collection, query, deleteDoc, getDocs, where } from "firebase/firestore"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const LESSONS = ['1ª aula', '2ª aula', '3ª aula', '4ª aula', '5ª aula', '6ª aula', '7ª aula', '8ª aula', '9ª aula'];

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const { user, profile, isAdmin, isUserLoading } = useUser()
  const firestore = useFirestore()
  
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Partial<TeacherProfile> | null>(null)
  const [auditData, setAuditData] = useState<any[]>([])
  const [isAuditing, setIsAuditing] = useState(false)

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    subjects: [] as string[],
    schoolName: "E.E. Professor Milton Santos",
    academicYear: "2024",
    activeBimestre: "4"
  })

  // CRITICAL: Prevent unauthorized query to /teachers for non-admins
  const teachersRef = useMemoFirebase(() => 
    isAdmin ? collection(firestore, "teachers") : null, 
    [isAdmin, firestore]
  )
  const { data: allTeachers = [], isLoading: isTeachersLoading } = useCollection(teachersRef)

  // Classes para atribuição: buscaremos na coleção de classes do professor logado (ou do Admin)
  const classesRef = useMemoFirebase(() => 
    user ? collection(firestore, 'teachers', user.uid, 'classes') : null, 
    [user, firestore]
  )
  const { data: globalClasses = [] } = useCollection(classesRef)

  useEffect(() => {
    setMounted(true)
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        subjects: profile.subjects || [],
        schoolName: profile.schoolName || "E.E. Professor Milton Santos",
        academicYear: profile.academicYear || "2024",
        activeBimestre: profile.activeBimestre || "4"
      })
    }
  }, [profile])

  const runAudit = async () => {
    if (!isAdmin) return;
    setIsAuditing(true);
    const results: any[] = [];
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = today;
    const days = eachDayOfInterval({ start, end });

    for (const teacher of allTeachers) {
      if (!teacher.assignments) continue;
      for (const assignment of teacher.assignments) {
        const matchingDays = days.filter(d => format(d, 'EEEE', { locale: ptBR }).toLowerCase().includes(assignment.dayOfWeek?.toLowerCase() || ''));
        
        for (const day of matchingDays) {
          const dateStr = format(day, "yyyy-MM-dd");
          const lessonId = `${assignment.classId}_${dateStr}`;
          
          const recordsSnap = await getDocs(query(
            collection(firestore, 'teachers', teacher.id, 'attendanceRecords'),
            where('classId', '==', assignment.classId),
            where('date', '==', dateStr)
          ));
          
          const lessonSnap = await getDocs(query(
            collection(firestore, 'teachers', teacher.id, 'lessons'),
            where('id', '==', lessonId)
          ));
          
          let status = 'pending'; 
          if (!recordsSnap.empty) {
            status = !lessonSnap.empty && lessonSnap.docs[0].data().content ? 'complete' : 'partial';
          }

          results.push({
            teacherName: teacher.name,
            className: assignment.className,
            subject: assignment.subject,
            date: dateStr,
            lesson: assignment.lessonNumber,
            status
          });
        }
      }
    }
    setAuditData(results);
    setIsAuditing(false);
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await setDoc(doc(firestore, "teachers", user.uid), profileData, { merge: true });
      toast({ title: "Configurações Salvas" });
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !editingTeacher?.email) return
    setIsSaving(true)
    const teacherId = editingTeacher.id || Math.random().toString(36).substr(2, 9)
    try {
      await setDoc(doc(firestore, "teachers", teacherId), {
        ...editingTeacher,
        id: teacherId,
        role: editingTeacher.role || 'Professor'
      }, { merge: true })
      setIsTeacherDialogOpen(false)
      setEditingTeacher(null)
      toast({ title: "Docente Registrado" })
    } catch (error) {
      toast({ title: "Erro ao gravar docente.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const updateAssignment = (index: number, field: keyof TeacherAssignment, value: string) => {
    if (!editingTeacher || !editingTeacher.assignments) return;
    const next = [...editingTeacher.assignments];
    const assignment = { ...next[index], [field]: value };
    if (field === 'classId') {
      assignment.className = globalClasses.find(c => c.id === value)?.name || "";
    }
    next[index] = assignment;
    setEditingTeacher({ ...editingTeacher, assignments: next });
  }

  if (!mounted || isUserLoading) return <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary">Configurações & Gestão</h2>
          <p className="text-muted-foreground mt-1">Identidade escolar e auditoria pedagógica.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white border h-auto p-1 shadow-sm">
          <TabsTrigger value="profile" className="font-bold py-2">Perfil</TabsTrigger>
          <TabsTrigger value="school" className="font-bold py-2">Escola</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="font-bold py-2">Docentes</TabsTrigger>}
          {isAdmin && <TabsTrigger value="audit" className="font-bold py-2" onClick={runAudit}>Auditoria</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Nome Completo</Label><Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input value={user?.email || ""} disabled className="bg-muted" /></div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar Perfil"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-6 space-y-6">
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Quadro Docente</CardTitle><CardDescription>Gerencie acessos e horários de aula.</CardDescription></div>
                <Button onClick={() => { setEditingTeacher({ assignments: [] }); setIsTeacherDialogOpen(true); }}><UserPlus className="h-4 w-4 mr-2" /> Novo Professor</Button>
              </CardHeader>
              <CardContent>
                {isTeachersLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div> : (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 border-b font-black uppercase text-[10px] tracking-widest">
                        <tr><th className="px-6 py-4">Docente</th><th className="px-6 py-4">Cargo</th><th className="px-6 py-4">Grade Horária</th><th className="px-6 py-4 text-right">Ações</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {allTeachers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4"><span className="font-bold block uppercase text-xs">{t.name}</span><span className="text-[10px] opacity-60">{t.email}</span></td>
                            <td className="px-6 py-4"><Badge variant={t.role === 'Admin' ? 'default' : 'secondary'}>{t.role}</Badge></td>
                            <td className="px-6 py-4"><span className="text-xs font-bold">{t.assignments?.length || 0} aulas previstas</span></td>
                            <td className="px-6 py-4 text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingTeacher(t); setIsTeacherDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button></td>
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
                <div><CardTitle>Auditoria de Lançamentos</CardTitle><CardDescription>Conferência entre grade prevista e registros realizados na semana.</CardDescription></div>
                <Button variant="outline" onClick={runAudit} disabled={isAuditing}>{isAuditing ? <Loader2 className="animate-spin h-4 w-4" /> : <History className="h-4 w-4" />}</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditData.length === 0 && !isAuditing && <div className="text-center py-20 opacity-30 italic">Nenhuma pendência encontrada para o período.</div>}
                  {auditData.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-3 h-3 rounded-full", a.status === 'complete' ? 'bg-green-500' : a.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500')} />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm uppercase">{a.teacherName} • {a.className}</span>
                          <span className="text-[10px] font-medium opacity-60">{a.subject} • {a.date} ({a.lesson})</span>
                        </div>
                      </div>
                      <Badge variant={a.status === 'complete' ? 'outline' : 'destructive'} className={cn(a.status === 'complete' && 'border-green-500 text-green-600 bg-green-50')}>
                        {a.status === 'complete' ? 'Realizado' : a.status === 'partial' ? 'Sem Conteúdo' : 'Pendente'}
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
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white">
          <DialogHeader className="p-6 border-b"><DialogTitle>Configurar Docente & Grade</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <form id="teacher-form" onSubmit={handleSaveTeacher} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={editingTeacher?.name || ""} onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input value={editingTeacher?.email || ""} onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <Select value={editingTeacher?.role} onValueChange={(v: any) => setEditingTeacher({...editingTeacher, role: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professor">Professor</SelectItem>
                      <SelectItem value="Admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between"><Label className="text-base font-bold">Grade Horária de Aulas</Label><Button type="button" variant="outline" size="sm" onClick={() => setEditingTeacher({...editingTeacher, assignments: [...(editingTeacher?.assignments || []), { classId: "", className: "", subject: "Português", dayOfWeek: "Segunda", lessonNumber: "1ª aula" }]})}><PlusCircle className="h-4 w-4 mr-2" /> Adicionar Aula</Button></div>
                <div className="space-y-3">
                  {editingTeacher?.assignments?.map((a, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-3 p-4 border rounded-xl bg-slate-50 relative group">
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold">Turma</Label><Select value={a.classId} onValueChange={(v) => updateAssignment(idx, 'classId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{globalClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold">Disciplina</Label><Select value={a.subject} onValueChange={(v) => updateAssignment(idx, 'subject', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Português">Português</SelectItem><SelectItem value="Matemática">Matemática</SelectItem></SelectContent></Select></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold">Dia</Label><Select value={a.dayOfWeek} onValueChange={(v) => updateAssignment(idx, 'dayOfWeek', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-1"><Label className="text-[10px] uppercase font-bold">Aula</Label><Select value={a.lessonNumber} onValueChange={(v) => updateAssignment(idx, 'lessonNumber', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LESSONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                      <div className="flex items-end justify-center"><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => { const next = [...(editingTeacher.assignments || [])]; next.splice(idx, 1); setEditingTeacher({...editingTeacher, assignments: next}); }}><X className="h-4 w-4" /></Button></div>
                    </div>
                  ))}
                  {(!editingTeacher?.assignments || editingTeacher.assignments.length === 0) && (
                    <div className="text-center py-10 border-2 border-dashed rounded-xl opacity-30 italic">Nenhuma aula na grade horária.</div>
                  )}
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-slate-50"><Button type="submit" form="teacher-form" className="w-full h-12 font-bold shadow-lg">Salvar Grade Horária no Firestore</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
