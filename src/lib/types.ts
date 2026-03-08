
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';

export type Subject = 'Portuguese' | 'Math';

export type UserRole = 'Admin' | 'Professor';

export interface TeacherAssignment {
  classId: string;
  className: string;
  subject: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subjects: string[]; // Legado, mantido para compatibilidade
  assignments?: TeacherAssignment[];
  schoolName?: string;
  academicYear?: string;
  activeBimestre?: string;
  assignedClasses?: string[];
  scheduleInfo?: string;
}

export interface SystemUser extends TeacherProfile {
  status: 'Ativo' | 'Inativo';
}

export interface Discipline {
  id: string;
  name: string;
  classId: string;
  teacherId: string;
  schedule: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  classId: string;
  callNumber: string;
  ra: string;
  raDigit: string;
  status: 'Ativo' | 'Inativo';
  photo: string | null;
  enrollments: string[]; 
  history: {
    attendance: Array<{ date: string; status: 'present' | 'absent' }>;
    assessments: Array<{ 
      subject: string; 
      competency: string; 
      level: BloomLevel; 
      score: number; 
      date: string 
    }>;
    occurrences: Array<{ 
      id: string; 
      date: string; 
      type: string; 
      description: string 
    }>;
    observations: string[];
  };
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  subject: string;
}

export interface AssessmentRecord {
  id: string;
  title: string;
  subject: Subject;
  classIds: string[];
  bloomLevel: string;
  date: string;
  rubric: RubricCriterion[];
  grades: Record<string, number>;
  studentCriterionGrades: Record<string, Record<string, string>>;
}

export interface RubricLevel {
  id: string;
  label: string;
  points: number;
}

export interface RubricCriterion {
  id: string;
  title: string;
  levels: RubricLevel[];
}
