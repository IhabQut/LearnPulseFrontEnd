import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ImageIcon, 
  Check, 
  ChevronRight,
  Layout,
  Zap,
  Sparkles
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createCourse } = useCourseStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
    image: '',
    level: 'Beginner'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Computer Science', 'Business', 'Design', 'Marketing', 'Languages', 'Science'];

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await createCourse({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        image: formData.image || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80`,
      }, user.id);
      navigate('/courses');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4 flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-blue-600" />
          Create New Course
        </h1>
        <p className="text-gray-500 font-medium text-lg">Design a learning experience that inspires your students.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center gap-4 mb-12">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 
                step > s ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              <span className="font-bold text-sm hidden sm:inline">
                {s === 1 ? 'Basics' : s === 2 ? 'Visuals' : 'Review'}
              </span>
            </div>
            {s < 3 && <div className={`h-0.5 flex-1 rounded-full ${step > s ? 'bg-blue-600' : 'bg-gray-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Course Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Advanced Machine Learning"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will students learn in this course?"
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.description}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue to Visuals
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8"
          >
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                Review Details
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Zap className="w-8 h-8 text-blue-600" />
                <p className="text-sm font-bold text-blue-800">Review your course details before publishing. You can add chapters and topics after creation.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between pb-4 border-b border-gray-100">
                  <span className="text-gray-400 font-bold">Title</span>
                  <span className="text-gray-900 font-black">{formData.title}</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-gray-100">
                  <span className="text-gray-400 font-bold">Category</span>
                  <span className="text-gray-900 font-black">{formData.category}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-gray-400 font-bold">Description</span>
                  <p className="text-gray-700 font-medium leading-relaxed">{formData.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Edit Visuals
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Layout className="w-5 h-5" />
                      Publish Course
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
