import React, { useState } from 'react';
import { Plus, Trash2, Book, GraduationCap, Target, Users, Sparkles, Loader2 } from 'lucide-react';
import { type CourseSyllabus, type DraftChapter, type GradingComponent, type SemesterWeekDraft } from '../../types';
import { useAuthStore } from '../../store/authStore';

interface Props {
  syllabus: CourseSyllabus;
  setSyllabus: (s: CourseSyllabus) => void;
  chapters: DraftChapter[];
  grading: GradingComponent[];
  weeks: SemesterWeekDraft[];
  courseDescription: string;
}

export default function StepSyllabus({ syllabus, setSyllabus, chapters, grading, weeks, courseDescription }: Props) {
  const { user } = useAuthStore();
  const [generating, setGenerating] = useState(false);

  // Sync profile data on mount
  React.useEffect(() => {
    if (user) {
      let ohString = '';
      if (user.professor?.office_hours) {
        try {
          const oh = JSON.parse(user.professor.office_hours);
          ohString = oh.map((s: any) => `${s.day}: ${s.start}-${s.end}`).join(', ');
        } catch {
          ohString = user.professor.office_hours;
        }
      }

      setSyllabus({
        ...syllabus,
        instructor_name: user.name || syllabus.instructor_name,
        instructor_email: user.email || syllabus.instructor_email,
        instructor_phone: user.phone_number || syllabus.instructor_phone,
        office_hours: ohString || syllabus.office_hours,
        zoom_link: user.professor?.meeting_link || syllabus.zoom_link,
      });
    }
  }, [user]);

  const updateField = (field: keyof CourseSyllabus, value: any) => {
    setSyllabus({ ...syllabus, [field]: value });
  };

  // Class Time Picker Helper
  const [selectedDays, setSelectedDays] = React.useState<string[]>([]);
  const [startTime, setStartTime] = React.useState('08:00');
  const [endTime, setEndTime] = React.useState('09:20');
  const [location, setLocation] = React.useState('');

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  React.useEffect(() => {
    if (selectedDays.length > 0) {
      const timeStr = `${selectedDays.join('/')} ${startTime}-${endTime}${location ? ` @ ${location}` : ''}`;
      updateField('class_time_location', timeStr);
    }
  }, [selectedDays, startTime, endTime, location]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const generateSyllabus = () => {
    setGenerating(true);
    setTimeout(() => {
      // 1. Instructor Info
      const instructor_name = user?.name || '';
      const instructor_email = user?.email || '';
      const instructor_phone = user?.phone_number || '';
      const zoom_link = user?.professor?.meeting_link || '';
      
      // 2. Office Hours matching professor profile
      let office_hours = '';
      if (user?.professor?.office_hours) {
        try {
          const oh = JSON.parse(user.professor.office_hours);
          office_hours = oh.map((s: any) => `${s.day}: ${s.start}-${s.end}`).join(', ');
        } catch {
          office_hours = user.professor.office_hours;
        }
      }

      // 3. Objectives from Chapters
      const newObjectives = chapters.map(ch => ({ text: `Understand the principles and applications of ${ch.title}` }));
      if (newObjectives.length === 0) newObjectives.push({ text: 'Master the fundamental concepts of this course' });

      // 4. Outcomes from Topics
      const allTopics = chapters.flatMap(ch => ch.topics.map(t => t.title));
      const newOutcomes = allTopics.slice(0, 5).map(t => ({
        text: `Demonstrate proficiency in ${t}`
      }));

      // 5. Description matching plan
      const gradingSummary = grading.map(g => `${g.name} (${g.weight}%)`).join(', ');
      const autoDescription = `${courseDescription}\n\nAssessment Policy: This course evaluates students through ${gradingSummary}. The semester spans ${weeks.length} weeks of intensive learning.`;

      setSyllabus({
        ...syllabus,
        instructor_name,
        instructor_email,
        instructor_phone,
        office_hours,
        zoom_link,
        description: autoDescription,
        objectives: newObjectives,
        learning_outcomes: newOutcomes,
      });
      setGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Generation Button */}
      <button
        onClick={generateSyllabus}
        disabled={generating || chapters.length === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-3xl hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-200 disabled:opacity-50 group"
      >
        {generating ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Auto-generating Curriculum Data…</>
        ) : (
          <>
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
            Auto-generate Syllabus from Plan
          </>
        )}
      </button>

      {/* General Information */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Book className="w-5 h-5 text-blue-600" /> General Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Course Code" value={syllabus.course_code || ''} onChange={v => updateField('course_code', v)} placeholder="e.g. 0702324" />
          <Input label="Semester" value={syllabus.semester || ''} onChange={v => updateField('semester', v)} placeholder="e.g. Second Semester 2025/2026" />
          <Input label="Instructor Name" value={syllabus.instructor_name || ''} onChange={v => updateField('instructor_name', v)} />
          <Input label="Instructor Email" value={syllabus.instructor_email || ''} onChange={v => updateField('instructor_email', v)} />
          <Input label="Instructor Phone" value={syllabus.instructor_phone || ''} onChange={v => updateField('instructor_phone', v)} />
          <Input label="Zoom Link" value={syllabus.zoom_link || ''} onChange={v => updateField('zoom_link', v)} placeholder="https://zoom.us/j/..." />
          <div className="md:col-span-1">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Office Hours (Synced with Profile)</label>
             <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 italic">
               {syllabus.office_hours || 'No office hours set in profile'}
             </div>
          </div>
          
          {/* Class Time Picker */}
          <div className="md:col-span-2 bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
             <label className="text-xs font-black text-gray-700 uppercase tracking-widest">Class Schedule Picker</label>
             <div className="flex flex-wrap gap-2">
                {days.map(d => (
                  <button 
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedDays.includes(d) ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                  >
                    {d}
                  </button>
                ))}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">End Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Location / Room</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. EN101" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
             </div>
             <div className="pt-2 border-t border-gray-200">
                <p className="text-[10px] font-black text-gray-400 uppercase">Generated Class String</p>
                <p className="text-sm font-bold text-blue-600">{syllabus.class_time_location || 'Not set'}</p>
             </div>
          </div>
        </div>
      </section>

      {/* Description & Objectives */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" /> Course Description & Objectives
        </h3>
        <div className="space-y-2">
           <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Syllabus Description</label>
           <textarea 
             value={syllabus.description || ''} 
             onChange={e => updateField('description', e.target.value)}
             className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none min-h-[120px]"
             placeholder="Detailed description of the course..."
           />
        </div>
        
        <div className="space-y-3">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Course Objectives</label>
          {(syllabus.objectives || []).map((obj, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                value={obj.text} 
                onChange={e => {
                  const newObjs = [...syllabus.objectives];
                  newObjs[idx].text = e.target.value;
                  updateField('objectives', newObjs);
                }}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <button onClick={() => updateField('objectives', syllabus.objectives.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-50 rounded-xl">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={() => updateField('objectives', [...(syllabus.objectives || []), { text: '' }])} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
            <Plus className="w-4 h-4" /> Add Objective
          </button>
        </div>
      </section>

      {/* Textbooks */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> Required Textbooks
        </h3>
        <div className="space-y-4">
          {(syllabus.textbooks || []).map((book, idx) => (
            <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group">
              <button onClick={() => updateField('textbooks', syllabus.textbooks.filter((_, i) => i !== idx))} className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                <Input label="Title" value={book.title} onChange={v => {
                   const newB = [...syllabus.textbooks]; newB[idx].title = v; updateField('textbooks', newB);
                }} />
                <Input label="Author" value={book.author || ''} onChange={v => {
                   const newB = [...syllabus.textbooks]; newB[idx].author = v; updateField('textbooks', newB);
                }} />
              </div>
            </div>
          ))}
          <button onClick={() => updateField('textbooks', [...(syllabus.textbooks || []), { title: '', author: '' }])} className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add Textbook
          </button>
        </div>
      </section>

      {/* Learning Outcomes */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" /> Learning Outcomes
        </h3>
        <div className="space-y-3">
          {(syllabus.learning_outcomes || []).map((out, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <input 
                  placeholder="Outcome Description" 
                  value={out.text} 
                  onChange={e => {
                    const newO = [...syllabus.learning_outcomes]; 
                    newO[idx].text = e.target.value; 
                    updateField('learning_outcomes', newO);
                  }} 
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none" 
                />
              </div>
              <button onClick={() => updateField('learning_outcomes', syllabus.learning_outcomes.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-50 rounded-xl mt-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={() => updateField('learning_outcomes', [...(syllabus.learning_outcomes || []), { text: '' }])} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
            <Plus className="w-4 h-4" /> Add Outcome
          </button>
        </div>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
      />
    </div>
  );
}
