export type Topic = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

export type Chapter = {
  id: string;
  title: string;
  summary: string;
  topics: Topic[];
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
