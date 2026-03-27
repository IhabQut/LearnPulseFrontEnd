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
  instructorName: string;
  description: string;
  chapters: Chapter[];
  materials: Material[];
};

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Database Fundamentals',
    description: 'Learn the core concepts of relational databases, SQL, and database design.',
    instructorName: 'Dr.Ahmad Al-Farsi',
    materials: [
      { id: 'm1', name: 'Syllabus.pdf', type: 'PDF', url: '#' },
      { id: 'm2', name: 'Lecture 1 Slides', type: 'Slides', url: '#' }
    ],
    chapters: [
      {
        id: 'ch1',
        title: 'Chapter 1: Intro to Databases',
        summary: 'Key concepts: What is a DB, DBMS Architecture, Relational Model.',
        topics: [
          { id: 't1', title: 'What is a Database', description: 'Basic definition and use cases.', completed: true },
          { id: 't2', title: 'DBMS Architecture', description: '1-tier, 2-tier, and 3-tier architecture.', completed: false },
          { id: 't3', title: 'Relational Model', description: 'Tables, rows, and columns.', completed: false },
        ]
      },
      {
        id: 'ch2',
        title: 'Chapter 2: SQL Basics',
        summary: 'Key concepts: SELECT, INSERT, UPDATE, DELETE.',
        topics: [
          { id: 't4', title: 'SELECT statements', description: 'Querying data.', completed: false },
        ]
      }
    ]
  }
];

export const MOCK_LEADERBOARD = [
  { rank: 1, student: 'Sara', points: 120, id: 'u1' },
  { rank: 2, student: 'Ahmad', points: 110, id: 'u2' },
  { rank: 3, student: 'Lina', points: 95, id: 'u3' },
];

export const MOCK_DISCUSSIONS = [
  { id: 'd1', author: 'Ahmad', title: 'Error in installing MySQL', replies: 3, date: '2 hours ago', courseId: 'c1' },
  { id: 'd2', author: 'Lina', title: 'Chapter 1 Quiz difficulty', replies: 5, date: '1 day ago', courseId: 'c1', chapterId: 'ch1' }
];
