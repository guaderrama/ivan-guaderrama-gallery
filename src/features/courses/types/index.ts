
// --- Course Types ---

export interface CourseExample {
  title: string;
  content: string;
  result: string;
  lesson: string;
}

export interface CourseActivity {
  title: string;
  description: string;
  steps: string[];
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  keyPoints: string[];
  quote?: {
    text: string;
    author?: string;
    source?: string;
  };
  examples?: CourseExample[]; // Scientific evidence or case studies
  activities?: CourseActivity[]; // Practical exercises
}

export interface CourseQuote {
    text: string;
    author?: string;
    highlight?: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct option
  explanation: string; // Text to show after answering
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  coverImage?: string; // Can be a URL or a placeholder color/pattern
  quotes?: CourseQuote[]; // Introductory phrases/philosophy
  modules: CourseModule[];
  quiz?: QuizQuestion[];
}
