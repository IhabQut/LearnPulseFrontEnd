import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ImageIcon, Check, ChevronRight, ChevronLeft, Layout, Sparkles,
  BookOpen, FileText, ListChecks, BarChart3, CalendarDays, Eye
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { type DraftChapter, type GradingComponent, type SemesterWeekDraft } from '../types';

import StepTextbook from '../components/CourseBuilder/StepTextbook';
import StepChapters from '../components/CourseBuilder/StepChapters';
import StepGrading from '../components/CourseBuilder/StepGrading';
import StepSemesterPlan from '../components/CourseBuilder/StepSemesterPlan';

const STEPS = [
  { label: 'Basics', icon: BookOpen },
  { label: 'Visuals', icon: ImageIcon },
  { label: 'Textbook', icon: FileText },
  { label: 'Chapters', icon: ListChecks },
  { label: 'Grading', icon: BarChart3 },
  { label: 'Schedule', icon: CalendarDays },
  { label: 'Review', icon: Eye },
];

const categories = ['Computer Science', 'Business', 'Design', 'Marketing', 'Languages', 'Science'];

export default function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createCourse, bulkSaveChapters, saveGrading, saveSemesterPlan } = useCourseStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Computer Science', image: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Textbook
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Chapters
  const [chapters, setChapters] = useState<DraftChapter[]>([]);

  // Grading
  const [gradingComponents, setGradingComponents] = useState<GradingComponent[]>([
    { name: 'Midterm Exam', weight: 25, component_type: 'exam' },
    { name: 'Final Exam', weight: 35, component_type: 'exam' },
    { name: 'Quizzes', weight: 20, component_type: 'assessment' },
    { name: 'Participation', weight: 10, component_type: 'participation' },
    { name: 'Homework', weight: 10, component_type: 'homework' },
  ]);

  // Semester
  const [totalWeeks, setTotalWeeks] = useState(14);
  const [semesterWeeks, setSemesterWeeks] = useState<SemesterWeekDraft[]>([]);
  const [genPlan, setGenPlan] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
    reader.readAsDataURL(f);
  };

  const canNext = () => {
    if (step === 1) return formData.title && formData.description;
    if (step === 4) return chapters.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const courseId = await createCourse({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        image: formData.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      }, user.id);

      if (chapters.length > 0) await bulkSaveChapters(courseId, chapters);
      if (gradingComponents.length > 0) await saveGrading(courseId, gradingComponents);
      if (semesterWeeks.length > 0) await saveSemesterPlan(courseId, semesterWeeks);

      navigate('/courses');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWeight = gradingComponents.reduce((s, c) => s + c.weight, 0);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-3 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-blue-600" />
          Create New Course
        </h1>
        <p className="text-gray-500 font-medium text-lg">Design a learning experience that inspires your students.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const num = i + 1;
          const Icon = s.icon;
          return (
            <React.Fragment key={num}>
              <button
                onClick={() => num < step && setStep(num)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all whitespace-nowrap ${
                  step === num ? 'text-blue-600' : step > num ? 'text-blue-400 hover:text-blue-600 cursor-pointer' : 'text-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === num ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' :
                  step > num ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > num ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="font-bold text-xs hidden lg:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-4 lg:w-8 rounded-full flex-shrink-0 ${step > num ? 'bg-blue-400' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8"
        >
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Course Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Advanced Machine Learning"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will students learn in this course?" rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none" />
              </div>
            </div>
          )}

          {/* Step 2: Visuals */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Course Thumbnail</label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-12 transition-all hover:bg-gray-50 group cursor-pointer relative overflow-hidden">
                {formData.image ? (
                  <div className="absolute inset-0">
                    <img src={formData.image} className="w-full h-full object-cover" alt="preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-bold">Click to upload thumbnail</p>
                    <p className="text-gray-400 text-sm mt-1">Recommended size: 1200x800px</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          )}

          {/* Step 3: Textbook */}
          {step === 3 && (
            <StepTextbook file={file} setFile={setFile} analyzing={analyzing} setAnalyzing={setAnalyzing}
              chapters={chapters} setChapters={setChapters} category={formData.category} />
          )}

          {/* Step 4: Chapters */}
          {step === 4 && <StepChapters chapters={chapters} setChapters={setChapters} />}

          {/* Step 5: Grading */}
          {step === 5 && <StepGrading components={gradingComponents} setComponents={setGradingComponents} />}

          {/* Step 6: Semester Plan */}
          {step === 6 && (
            <StepSemesterPlan chapters={chapters} weeks={semesterWeeks} setWeeks={setSemesterWeeks}
              totalWeeks={totalWeeks} setTotalWeeks={setTotalWeeks} generating={genPlan} setGenerating={setGenPlan} />
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Layout className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <p className="text-sm font-bold text-blue-800">Review everything before publishing. All data will be saved to the course.</p>
              </div>
              <div className="space-y-3">
                <Row label="Title" value={formData.title} />
                <Row label="Category" value={formData.category} />
                <Row label="Description" value={formData.description} />
                <Row label="Textbook" value={file ? file.name : 'None uploaded'} />
                <Row label="Chapters" value={`${chapters.length} chapters`} />
                <Row label="Grading" value={`${gradingComponents.length} components (${totalWeight}%)`} />
                <Row label="Semester Plan" value={`${semesterWeeks.length} weeks`} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-4 pt-8 mt-6 border-t border-gray-100">
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
              className="bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            {step < 7 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()}
                className="bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {STEPS[step]?.label || 'Next'} <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Layout className="w-5 h-5" /> Publish Course</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-50">
      <span className="text-gray-400 font-bold text-sm">{label}</span>
      <span className="text-gray-900 font-semibold text-sm text-right max-w-[60%]">{value}</span>
    </div>
  );
}
