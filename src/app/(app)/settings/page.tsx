"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { 
  School, Settings as SettingsIcon, Plus, UserPlus, Pencil, History, Loader2, Save, UserCheck, CheckCircle2, X, PlusCircle, Key, Trash2
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
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { TeacherProfile, TeacherAssignment } from "@/lib/types"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase/provider"
import { doc, setDoc, collection, query, getDocs, where, getDoc } from "firebase/firestore"
import { initializeApp, deleteApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { firebaseConfig } from "@/firebase/config"
import { format, startOfWeek, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

// Grade Horária Atualizada
const LESSONS_LIST = [
  "1ª aula (07:00 - 07:50)",
  "2ª aula (07:50 - 08:40)",
  "3ª aula (08:40 - 09:30)",
  "4ª aula (09:45 - 10:35)",
  "5ª aula (10:35 - 11:25)",
  "6ª aula (12:25 - 13:15)",
  "7ª aula (13:15 - 14:05)",
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

  const sortedTeachers = useMemo(() => {
    return [...allTeachers].sort((a, b) => (a.name || "").localeCompare(b.name || "", 'pt-BR'));
  }, [allTeachers]);

  const globalClassesRef = useMemoFirebase(() => collection(firestore, 'classes'), [firestore])
  const { data: globalClasses = [] } = useCollection(globalClassesRef)

  const sortedGlobalClasses = useMemo(() => {
    return [...globalClasses].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [globalClasses]);

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isUserLoading && profile && !isSaving) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || ""
      })
    }
  }, [profile, isUserLoading, isSaving])

  useEffect(() => {
    if (!isUserLoading && schoolConfig && !isSaving) {
      setSchoolData({
        schoolName: schoolConfig.schoolName || "",
        academicYear: schoolConfig.academicYear || "",
        activeBimestre: schoolConfig.activeBimestre || "1"
      })
    }
  }, [schoolConfig, isUserLoading, isSaving])

  const runAudit = useCallback(async () => {
    if (!isAdmin || !firestore) return;
    setIsAuditing(true);
    const results: any[] = [];
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end: today });

    try {
      for (const teacher of allTeachers) {
        if (!teacher.assignments || teacher.assignments.length === 0) continue;
        
        for (const assignment of teacher.assignments) {
          const matchingDays = days.filter(d => {
            const dayName = format(d, 'EEEE', { locale: ptBR }).toLowerCase();
            return dayName.includes(assignment.dayOfWeek?.toLowerCase() || '');
          });
          
          for (const day of matchingDays) {
            const dateStr = format(day, "yyyy-MM-dd");
            const lessonId = `${assignment.classId}_${dateStr}_${teacher.id}`;
            
            const recordsQuery = query(
              collection(firestore, 'attendanceRecords'),
              where('classId', '==', assignment.classId),
              where('date', '==', dateStr),
              where('teacherId', '==', teacher.id)
            );
            const recordsSnap = await getDocs(recordsQuery);
            
            const lessonRef = doc(firestore, 'lessons', lessonId);
            const lessonSnap = await getDoc(lessonRef);
            
            let status = 'pending'; 
            if (!recordsSnap.empty) {
              const lessonData = lessonSnap.exists() ? lessonSnap.data() : null;
              status = (lessonData && lessonData.content && lessonData.content.trim() !== "") ? 'complete' : 'partial';
            }

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
      setAuditData(results.reverse());
    } catch (err) {
      toast({ title: "Erro na auditoria", description: "Falha ao consultar coleções globais.", variant: "destructive" });
    } finally {
      setIsAuditing(false);
    }
  }, [isAdmin, firestore, allTeachers, globalClasses, toast]);

  const handleSaveProfile = useCallback(async () => {
    if (!user || !firestore) return
    setIsSaving(true)
    try {
      await setDoc(doc(firestore, "teachers", user.uid), profileData, { merge: true });
      toast({ title: "Perfil atualizado" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false)
    }
  }, [user, firestore, profileData, toast]);

  const handleSaveSchool = useCallback(async () => {
    if (!isAdmin || !firestore) return
    setIsSaving(true)
    try {
      await setDoc(doc(firestore, "settings", "school"), schoolData, { merge: true });
      toast({ title: "Configurações da escola atualizadas" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false)
    }
  }, [isAdmin, firestore, schoolData, toast]);

  const handleSaveTeacher = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !editingTeacher?.email || !editingTeacher?.name || !firestore) {
      toast({ title: "Nome e E-mail obrigatórios", variant: "destructive" });
      return;
    }
    setIsSaving(true)
    
    try {
      let finalTeacherId = editingTeacher.id;

      // Se for um novo professor ou forçado re-provisionamento de senha
      if (!finalTeacherId || editingTeacher.password) {
        try {
          const secondaryAppName = `provision-${Date.now()}`;
          const provisionApp = initializeApp(firebaseConfig, secondaryAppName);
          const provisionAuth = getAuth(provisionApp);
          
          // Se não tem ID, cria no Auth para obter o UID
          if (!finalTeacherId) {
            const userCred = await createUserWithEmailAndPassword(
              provisionAuth, 
              editingTeacher.email, 
              editingTeacher.password || "padrao123"
            );
            finalTeacherId = userCred.user.uid;
          } else {
            // Se já tem ID, apenas tenta atualizar ou garantir existência (hack opcional)
          }
          await deleteApp(provisionApp);
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use' && !finalTeacherId) {
            // Fallback: se o e-mail já existe, o handshake do login cuidará do pareamento
            finalTeacherId = editingTeacher.email.replace(/[.@]/g, '_');
          }
        }
      }

      // Limpa os IDs temporários usados na interface antes de salvar no Firestore
      const assignmentsToSave = (editingTeacher.assignments || []).map(({ tempId, ...rest }: any) => rest);

      await setDoc(doc(firestore, "teachers", finalTeacherId!), {
        ...editingTeacher,
        assignments: assignmentsToSave,
        id: finalTeacherId,
        role: editingTeacher.role || 'Professor'
      }, { merge: true })
      
      setIsTeacherDialogOpen(false)
      setEditingTeacher(null)
      toast({ title: "Docente sincronizado com UID" })
    } catch (error) {
      toast({ title: "Falha na gravação", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }, [isAdmin, firestore, editingTeacher, toast]);

  /**
   * Executa a exclusão de um professor através da API Administrativa.
   * Remove tanto o acesso (Auth) quanto os dados de perfil (Firestore).
   */
  const handleDeleteTeacher = useCallback(async (uid: string) => {
    if (!isAdmin || !user) return;
    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ uid })
      });

      if (response.ok) {
        toast({ title: "Usuário Excluído", description: "O acesso e o perfil foram removidos do sistema." });
      } else {
        const err = await response.json();
        toast({ 
          title: "Erro na Exclusão", 
          description: err.error || "Não foi possível completar a operação.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ title: "Falha na Comunicação", description: "Erro ao contactar o servidor de administração.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [isAdmin, user, toast]);

  const updateAssignment = useCallback((index: number, field: keyof TeacherAssignment, value: string) => {
    setEditingTeacher(prev => {
      if (!prev || !prev.assignments) return prev;
      const next = [...prev.assignments];
      const assignment = { ...next[index], [field]: value };
      
      if (field === 'classId') {
        const classInfo = globalClasses.find(c => c.id === value);
        assignment.className = classInfo?.name || "";
        if (!assignment.subject) {
          assignment.subject = classInfo?.subject === 'Portuguese' ? 'Português' : 'Matemática';
        }
      }
      
      next[index] = assignment;
      return { ...prev, assignments: next };
    });
  }, [globalClasses]);

  const removeAssignment = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTeacher(prev => {
      if (!prev || !prev.assignments) return prev;
      const next = [...prev.assignments];
      next.splice(index, 1);
      return { ...prev, assignments: next };
    });
  }, []);

  const addAssignment = useCallback(() => {
    setEditingTeacher(prev => ({
      ...prev, 
      assignments: [
        ...(prev?.assignments || []), 
        { 
          tempId: Math.random().toString(36).substr(2, 9),
          classId: "", 
          className: "", 
          subject: "Português", 
          dayOfWeek: "Segunda", 
          lessonNumber: LESSONS_LIST[0] 
        }
      ]
    }));
  }, []);

  const handleNewTeacher = useCallback(() => {
    setEditingTeacher({ 
      id: "",
      name: "", 
      email: "", 
      assignments: [], 
      role: 'Professor', 
      password: "" 
    });
    setIsTeacherDialogOpen(true);
  }, []);

  if (!mounted || isUserLoading) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase">Gestão & Auditoria</h2>
          <p className="text-muted-foreground mt-1">Padronização por UID e controle de conformidade.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("grid w-full bg-white border h-auto p-1 shadow-sm", isAdmin ? "grid-cols-4" : "grid-cols-1")}>
          <TabsTrigger value="profile" className="font-bold py-2 uppercase text-[10px]">Meus Dados</TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="school" className="font-bold py-2 uppercase text-[10px]">Escola</TabsTrigger>
              <TabsTrigger value="users" className="font-bold py-2 uppercase text-[10px]">Docentes</TabsTrigger>
              <TabsTrigger value="audit" className="font-bold py-2 uppercase text-[10px]" onClick={() => !isAuditing && runAudit()}>Auditoria</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader><CardTitle className="text-xl font-black uppercase text-primary">Perfil Docente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase">Nome Completo</Label><Input value={profileData.name} onChange={(e) => setProfileData(prev => ({...prev, name: e.target.value}))} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase">E-mail Institucional</Label><Input value={user?.email || ""} disabled className="bg-muted opacity-60" /></div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="font-bold shadow-lg">{isSaving ? "Gravando..." : "Salvar Perfil"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="school" className="mt-6">
              <Card className="border-none shadow-md bg-white">
                <CardHeader><CardTitle className="text-xl font-black uppercase text-primary">Configurações Escolares</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase">Nome da Escola</Label><Input value={schoolData.schoolName} onChange={(e) => setSchoolData(prev => ({...prev, schoolName: e.target.value}))} /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase">Ano Letivo</Label><Input value={schoolData.academicYear} onChange={(e) => setSchoolData(prev => ({...prev, academicYear: e.target.value}))} /></div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Bimestre Ativo</Label>
                      <Select value={schoolData.activeBimestre} onValueChange={(v) => setSchoolData(prev => ({...prev, activeBimestre: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="1">1º Bimestre</SelectItem><SelectItem value="2">2º Bimestre</SelectItem><SelectItem value="3">3º Bimestre</SelectItem><SelectItem value="4">4º Bimestre</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSaveSchool} disabled={isSaving} className="font-bold shadow-lg">Salvar Configurações</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-6 space-y-6">
              <Card className="border-none shadow-md bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle className="text-xl font-black uppercase text-primary">Quadro Docente</CardTitle></div>
                  <Button onClick={handleNewTeacher} className="font-bold shadow-md"><UserPlus className="h-4 w-4 mr-2" /> Novo Docente</Button>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b font-black uppercase text-[9px] tracking-widest text-muted-foreground">
                        <tr><th className="px-6 py-4">Docente</th><th className="px-6 py-4">Perfil</th><th className="px-6 py-4">Ações</th></tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {sortedTeachers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-black block uppercase text-xs text-primary">{t.name}</span>
                              <span className="text-[10px] font-medium opacity-60 italic">{t.email}</span>
                            </td>
                            <td className="px-6 py-4"><Badge variant={t.role === 'Admin' ? 'default' : 'outline'} className="font-black text-[9px] uppercase">{t.role}</Badge></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingTeacher(t); setIsTeacherDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                {user?.uid !== t.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="font-black uppercase text-primary">Excluir Docente?</AlertDialogTitle>
                                        <AlertDialogDescription className="font-bold text-xs uppercase">
                                          Esta ação removerá permanentemente o acesso institucional e o perfil de <strong>{t.name}</strong>. Esta operação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="font-bold uppercase text-[10px]">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteTeacher(t.id)} 
                                          className="bg-destructive font-black uppercase text-[10px] tracking-widest"
                                        >
                                          Confirmar Exclusão
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-6 space-y-6">
              <Card className="border-none shadow-md bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle className="text-xl font-black uppercase text-primary">Auditoria de Lançamentos</CardTitle></div>
                  <Button variant="outline" onClick={runAudit} disabled={isAuditing} className="font-bold shadow-sm">
                    {isAuditing ? <Loader2 className="animate-spin h-4 w-4" /> : <History className="h-4 w-4 mr-2" />} Atualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditData.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-3 h-3 rounded-full shadow-inner", a.status === 'complete' ? 'bg-green-500' : a.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500')} />
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase text-primary">{a.teacherName} • {a.className}</span>
                            <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">{a.subject} • {a.date} ({a.lesson.split(' ')[0]})</span>
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
          </>
        )}
      </Tabs>

      <Dialog open={isTeacherDialogOpen} onOpenChange={(open) => { setIsTeacherDialogOpen(open); if (!open) setEditingTeacher(null); }} modal={true}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 bg-white shadow-2xl overflow-hidden">
          <DialogHeader className="p-8 bg-primary text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Atribuição Docente</DialogTitle>
            <DialogDescription className="text-white/70 font-bold text-xs uppercase tracking-widest">Sincronização institucional via UID.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-8">
            <form id="teacher-form" onSubmit={handleSaveTeacher} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-black uppercase">Nome do Docente</Label><Input value={editingTeacher?.name || ""} onChange={(e) => setEditingTeacher(prev => ({...prev, name: e.target.value}))} className="h-11" /></div>
                <div className="space-y-2"><Label className="text-xs font-black uppercase">E-mail Institucional</Label><Input value={editingTeacher?.email || ""} onChange={(e) => setEditingTeacher(prev => ({...prev, email: e.target.value}))} className="h-11" /></div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase">Perfil de Acesso</Label>
                  <Select value={editingTeacher?.role} onValueChange={(v: any) => setEditingTeacher(prev => ({...prev, role: v}))}><SelectTrigger className="h-11 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Professor">Professor</SelectItem><SelectItem value="Admin">Administrador</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-xs font-black uppercase">Senha de Acesso</Label><Input type="password" value={editingTeacher?.password || ""} onChange={(e) => setEditingTeacher(prev => ({...prev, password: e.target.value}))} placeholder="Mínimo 6 caracteres" className="h-11" /></div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between"><h4 className="text-xs font-black uppercase text-primary">Grade Horária Semanal</h4><Button type="button" variant="outline" size="sm" onClick={addAssignment}><PlusCircle className="h-4 w-4 mr-2" /> Nova Aula</Button></div>
                <div className="space-y-3">
                  {editingTeacher?.assignments?.map((a, idx) => (
                    <div key={(a as any).tempId || idx} className="grid grid-cols-5 gap-3 p-4 border-2 rounded-xl bg-white relative group shadow-sm">
                      <div className="space-y-1"><Label className="text-[9px] uppercase font-black">Turma</Label><Select value={a.classId} onValueChange={(v) => updateAssignment(idx, 'classId', v)}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{sortedGlobalClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase font-black">Disciplina</Label><Select value={a.subject} onValueChange={(v) => updateAssignment(idx, 'subject', v)}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Português">Português</SelectItem><SelectItem value="Matemática">Matemática</SelectItem></SelectContent></Select></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase font-black">Dia</Label><Select value={a.dayOfWeek} onValueChange={(v) => updateAssignment(idx, 'dayOfWeek', v)}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-1"><Label className="text-[9px] uppercase font-black">Aula</Label><Select value={a.lessonNumber} onValueChange={(v) => updateAssignment(idx, 'lessonNumber', v)}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{LESSONS_LIST.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                      <div className="flex items-end justify-center"><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={(e) => removeAssignment(e, idx)}><X className="h-4 w-4" /></Button></div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="p-6 border-t bg-slate-100 shrink-0">
            <Button type="submit" form="teacher-form" disabled={isSaving} className="w-full h-12 font-black uppercase text-xs tracking-widest">{isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />} Sincronizar Docente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
