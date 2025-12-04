export interface Question {
  number: number;
  text: string;
  type: 'pilihan_ganda' | 'esai';
  options?: string[]; // Only for multiple choice
}

export interface AnswerKey {
  questionNumber: number;
  answer: string;
  explanation: string;
}

export interface GridItem {
  basicCompetency: string; // KD
  material: string; // Materi Pokok
  indicator: string; // Indikator Soal
  questionNumber: number;
  cognitiveLevel: string; // C1-C6
  questionForm: string; // PG / Esai
}

export interface RubricItem {
  questionNumber: number | string;
  criteria: string;
  maxScore: number;
  levels: {
    score: number;
    description: string;
  }[];
}

export interface AssessmentResult {
  title: string;
  summary: string;
  questions: Question[];
  answerKeys: AnswerKey[];
  grid: GridItem[];
  rubric: RubricItem[];
}

export interface AssessmentConfig {
  gradeLevel: string; // Jenjang (SD, SMP, SMA, Kuliah)
  subject: string; // Mata Pelajaran
  topic: string; // Topik Materi
  questionCount: number;
  questionType: 'pilihan_ganda' | 'esai' | 'campuran';
  difficulty: 'mudah' | 'sedang' | 'sulit' | 'HOTS' | 'campuran_c1_c3' | 'campuran_c3_c6' | 'campuran_c1_c6';
}

export type InputMode = 'text' | 'file';