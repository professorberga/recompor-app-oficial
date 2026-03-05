export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';

export type Subject = 'Portuguese' | 'Math';

export interface Student {
  id: string;
  name: string;
  email?: string;
  birthDate?: string;
  classId: string;
  observations: string[];
}

export interface Class {
  id: string;
  name: string;
  subject: Subject;
  teacherId: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  competency: string;
  skill: string;
  bloomLevel: BloomLevel;
  score: number;
  date: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  status: 'present' | 'absent';
}

export interface LessonPlan {
  id: string;
  classId: string;
  date: string;
  title: string;
  content: string;
}