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
  week_num: number;
  chapter_title: string;
  topics_json: string;   // JSON array of topic title strings
  notes: string;
};
