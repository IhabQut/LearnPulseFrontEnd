import React from 'react';
import { Upload, FileText, X, Sparkles, Loader2 } from 'lucide-react';
import { type DraftChapter } from '../../types';

// ── Mock AI data by category ──────────────────────────────────
const MOCK_CHAPTERS: Record<string, DraftChapter[]> = {
  'Computer Science': [
    { title: 'Introduction to Computing', summary: 'Fundamental concepts of computation and problem solving', topics: [{ title: 'What is Computer Science?', description: 'Overview of the field' }, { title: 'Binary & Data Representation', description: 'How computers store information' }] },
    { title: 'Programming Fundamentals', summary: 'Variables, control flow, and functions', topics: [{ title: 'Variables & Types', description: 'Storing data in programs' }, { title: 'Control Structures', description: 'Conditionals and loops' }, { title: 'Functions', description: 'Code reuse and abstraction' }] },
    { title: 'Data Structures', summary: 'Arrays, linked lists, stacks, queues, and trees', topics: [{ title: 'Arrays & Lists', description: 'Sequential data storage' }, { title: 'Stacks & Queues', description: 'LIFO and FIFO structures' }, { title: 'Trees & Graphs', description: 'Hierarchical and networked data' }] },
    { title: 'Algorithms', summary: 'Sorting, searching, and complexity analysis', topics: [{ title: 'Sorting Algorithms', description: 'Bubble, merge, quick sort' }, { title: 'Searching Algorithms', description: 'Linear and binary search' }, { title: 'Big-O Notation', description: 'Measuring algorithm efficiency' }] },
    { title: 'Object-Oriented Programming', summary: 'Classes, inheritance, polymorphism', topics: [{ title: 'Classes & Objects', description: 'Encapsulation basics' }, { title: 'Inheritance', description: 'Code reuse through hierarchy' }] },
    { title: 'Databases', summary: 'SQL, relational models, and NoSQL basics', topics: [{ title: 'Relational Databases', description: 'Tables, keys, and relationships' }, { title: 'SQL Fundamentals', description: 'Querying data' }] },
  ],
  'Business': [
    { title: 'Introduction to Business', summary: 'The role of business in society', topics: [{ title: 'Types of Business', description: 'Sole proprietorship, partnerships, corporations' }, { title: 'Business Ethics', description: 'Ethical decision making' }] },
    { title: 'Marketing Fundamentals', summary: 'The 4Ps and market research', topics: [{ title: 'Market Research', description: 'Understanding customer needs' }, { title: 'Marketing Mix', description: 'Product, Price, Place, Promotion' }] },
    { title: 'Financial Accounting', summary: 'Balance sheets, income statements', topics: [{ title: 'Financial Statements', description: 'Reading and interpreting reports' }, { title: 'Budgeting', description: 'Planning and controlling finances' }] },
    { title: 'Management & Leadership', summary: 'Planning, organizing, leading, controlling', topics: [{ title: 'Leadership Styles', description: 'Transformational vs transactional' }, { title: 'Team Management', description: 'Building effective teams' }] },
  ],
  default: [
    { title: 'Introduction', summary: 'Course overview and foundations', topics: [{ title: 'Course Overview', description: 'What you will learn' }, { title: 'Historical Context', description: 'Background and evolution' }] },
    { title: 'Core Concepts', summary: 'Fundamental principles and theories', topics: [{ title: 'Key Principles', description: 'Core theoretical framework' }, { title: 'Terminology', description: 'Essential vocabulary' }] },
    { title: 'Applied Methods', summary: 'Practical applications and techniques', topics: [{ title: 'Methodology', description: 'Research and practice methods' }, { title: 'Case Studies', description: 'Real-world examples' }] },
    { title: 'Advanced Topics', summary: 'Deeper exploration of specialized areas', topics: [{ title: 'Current Trends', description: 'Latest developments' }, { title: 'Future Directions', description: 'Emerging research areas' }] },
    { title: 'Review & Assessment', summary: 'Comprehensive review and evaluation', topics: [{ title: 'Summary Review', description: 'Key takeaways' }, { title: 'Final Project', description: 'Capstone assessment' }] },
  ],
};

export function getMockChapters(category: string): DraftChapter[] {
  return MOCK_CHAPTERS[category] || MOCK_CHAPTERS['default'];
}

interface Props {
  file: File | null;
  setFile: (f: File | null) => void;
  analyzing: boolean;
  setAnalyzing: (v: boolean) => void;
  chapters: DraftChapter[];
  setChapters: (c: DraftChapter[]) => void;
  category: string;
}

export default function StepTextbook({ file, setFile, analyzing, setAnalyzing, chapters, setChapters, category }: Props) {
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const analyzeFile = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setChapters(getMockChapters(category));
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer relative"
      >
        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setFile(null)} className="ml-4 p-2 hover:bg-red-50 rounded-xl transition-all">
              <X className="w-5 h-5 text-red-500" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-bold text-gray-700">Drag & drop your textbook here</p>
            <p className="text-sm text-gray-400 mt-1">PDF, DOCX, or TXT — up to 50MB</p>
          </>
        )}
        <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>

      {file && chapters.length === 0 && (
        <button
          onClick={analyzeFile}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI is analyzing your material…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze with AI
            </>
          )}
        </button>
      )}

      {chapters.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
          <Sparkles className="w-6 h-6 text-green-600" />
          <p className="font-bold text-green-800 text-sm">AI generated {chapters.length} chapters — edit them in the next step!</p>
        </div>
      )}
    </div>
  );
}
