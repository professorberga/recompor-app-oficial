
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';

export type Subject = 'Portuguese' | 'Math';

export type UserRole = 'Admin' | 'Professor';

export interface TeacherAssignment {
  classId: string;
  className: string;
  subject: string;
  dayOfWeek?: string; // Segunda, Terça, etc.
  lessonNumber?: string; // 1ª aula, 2ª aula...
  timeSlot?: string; // 07:30-08:20
}

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subjects: string[]; 
  assignments?: TeacherAssignment[];
  schoolName?: string;
  academicYear?: string;
  activeBimestre?: string;
  assignedClasses?: string[];
  scheduleInfo?: string;
  password?: string;
}

export interface SystemUser extends TeacherProfile {
  status: 'Ativo' | 'Inativo';
}

export interface StudentEnrollment {
  classId: string;
  className: string;
  subject: string;
  teacherId: string;
  teacherName: string;
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
  teacherId: string;
  tutor?: string;
  enrollments?: StudentEnrollment[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  bimestre: string;
  status: 'Presente' | 'Falta';
  teacherId: string;
  subject?: string;
}

export interface StudentObservation {
  id: string;
  studentId: string;
  teacherId: string;
  classId: string;
  date: string;
  content: string;
  bimestre: string;
  teacherName?: string;
}

export interface LessonRecord {
  id: string;
  classId: string;
  date: string;
  teacherId: string;
  content: string;
  bimestre: string;
  subject: string;
}

export interface AssessmentRecord {
  id: string;
  title: string;
  subject: Subject;
  classIds: string[];
  bloomLevel: string;
  date: string;
  bimestre: string;
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
