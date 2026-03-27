import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { BrainCircuit, AlertTriangle, TrendingDown, CheckCircle2, Bot, ArrowLeft, RefreshCw } from 'lucide-react';
import { API_BASE } from '../lib/api';

type StrugglingTopic = {
  topic_title: string;
  chapter_title: string;
  fail_rate: number;
  common_mistake: string;
};

type StudentParticipation = {
  student_id: string;
  student_name: string;
  topics_completed: number;
  quizzes_taken: number;
};

type AIReportData = {
  course_title: string;
  total_students: number;
  struggling_topics: StrugglingTopic[];
  low_participation: StudentParticipation[];
  high_performers: StudentParticipation[];
  insight: string;
};

export default function AIAnalysis() {
  const { user } = useAuthStore();
  const { courses } = useCourseStore();
  const [searchParams] = useSearchParams();
  
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('course') || '');
  const [report, setReport] = useState<AIReportData | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'professor') {
    return <Navigate to="/" replace />;
  }

  const fetchReport = async (courseId: string) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/course/${courseId}`);
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchReport(selectedCourseId);
    } else if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [selectedCourseId, courses]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/admin" className="text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
           <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
             <BrainCircuit className="w-8 h-8 text-indigo-600 mr-3" />
             AI Learning Analytics
           </h1>
        </div>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          <option value="">Select Course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Generating analytics...</p>
        </div>
      )}

      {!loading && !report && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <BrainCircuit className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Select a course to view AI analytics.</p>
        </div>
      )}

      {!loading && report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Insight Banner */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-lg shadow-indigo-900/10 md:col-span-3 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
               <Bot className="w-full h-full transform scale-150 translate-x-1/4 translate-y-1/4" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-sm uppercase tracking-widest font-bold text-indigo-200 mb-2 flex items-center">
                 <Bot className="w-4 h-4 mr-2" /> AI Generated Insight Report — {report.course_title}
              </h2>
              <p className="text-xl font-medium leading-relaxed mb-4">
                "{report.insight}"
              </p>
              <div className="flex items-center space-x-4 text-sm font-bold text-indigo-200">
                <span>{report.total_students} Students</span>
                <span>•</span>
                <span>{report.struggling_topics.length} Topics Flagged</span>
              </div>
            </div>
          </div>

          {/* Struggling Topics */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm md:col-span-2">
             <h3 className="text-lg font-bold text-gray-900 flex items-center mb-6">
               <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
               Topics Requiring Attention
             </h3>
             
             <div className="space-y-4">
               {report.struggling_topics.length > 0 ? (
                 report.struggling_topics.map((topic, i) => {
                   const isHigh = topic.fail_rate > 40;
                   return (
                     <div key={i} className={`p-5 border rounded-2xl ${isHigh ? 'border-red-100 bg-red-50/30' : 'border-amber-100 bg-amber-50/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold text-lg ${isHigh ? 'text-red-900' : 'text-amber-900'}`}>{topic.topic_title}</h4>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isHigh ? 'High Priority' : 'Medium Priority'}
                          </span>
                        </div>
                        <p className={`text-sm mb-2 font-medium ${isHigh ? 'text-red-800/80' : 'text-amber-800/80'}`}>
                          {topic.chapter_title} • {topic.fail_rate}% fail rate
                        </p>
                        {topic.common_mistake && (
                          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Analysis</div>
                            <p className="font-medium text-gray-900 text-sm">{topic.common_mistake}</p>
                          </div>
                        )}
                     </div>
                   );
                 })
               ) : (
                 <div className="text-center py-8 text-gray-500 font-medium">No struggling topics detected. Great job!</div>
               )}
             </div>
          </div>

          {/* Student Participation */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
             <div>
               <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                 <TrendingDown className="w-5 h-5 text-gray-400 mr-2" />
                 Low Participation
               </h3>
               <p className="text-sm text-gray-500 font-medium mb-4">Students with no activity in this course.</p>
               <div className="space-y-3">
                  {report.low_participation.length > 0 ? (
                    report.low_participation.map((s, i) => (
                      <div key={i} className="flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mr-3">
                          {s.student_name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-700 flex-1">{s.student_name}</span>
                        <Link to={`/profile/${s.student_id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors">View</Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">All students are participating!</p>
                  )}
               </div>
             </div>
             
             <div className="pt-6 border-t border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 flex items-center mb-4">
                 <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                 High Performers
               </h3>
               <div className="space-y-2">
                 {report.high_performers.length > 0 ? (
                   report.high_performers.map((s, i) => (
                     <div key={i} className="flex items-center p-3 rounded-xl border border-emerald-50 bg-emerald-50/30">
                       <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mr-3">{s.student_name.charAt(0)}</div>
                       <div className="flex-1">
                         <span className="font-bold text-gray-900 text-sm">{s.student_name}</span>
                         <div className="text-xs text-gray-500">{s.topics_completed} topics • {s.quizzes_taken} quizzes</div>
                       </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-sm text-gray-500 italic">Not enough data yet.</p>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
