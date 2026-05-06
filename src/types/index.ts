export type Topic = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  is_open?: boolean;
};

export type Chapter = {
  id: string;
  title: string;
  summary: string;
  topics: Topic[];
  is_final_quiz_open?: boolean;
};

export type Material = {
  id: string;
  name: string;
  type: string;
  url: string;
};

export type Objective = { text: string };
export type Textbook = { title: string; author?: string };
export type Outcome = { text: string };
export type WeekTopic = { title: string };

export type CourseSyllabus = {
  id?: string;
  course_id?: string;
  course_code: string;
  semester: string;
  instructor_name: string;
  instructor_email: string;
  instructor_phone: string;
  office_hours: string;
  class_time_location: string;
  zoom_link?: string;
  description: string;
  objectives: Objective[];
  textbooks: Textbook[];
  learning_outcomes: Outcome[];
};

export type Course = {
  id: string;
  title: string;
  professor_id?: string;
  professor_name?: string;
  description: string;
  category?: string;
  image?: string | null;
  is_open?: boolean;
  student_count?: number;
  user_role?: string;
  chapters: Chapter[];
  materials: Material[];
  syllabus?: CourseSyllabus;
};

// ─── AI Course Builder ───────────────────────────────────────────

export type DraftTopic = {
  title: string;
  description: string;
};

export type DraftChapter = {
  title: string;
  summary: string;
  topics: DraftTopic[];
};

export type GradingComponent = {
  name: string;
  weight: number;
  component_type: string;
};

export type SemesterWeekDraft = {
  id?: string;
  week_num: number;
  chapter_title: string;
  topics: WeekTopic[];
  notes: string;
};
