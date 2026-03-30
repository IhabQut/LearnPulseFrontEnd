import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { BookOpen, Trash2, Plus, Users, ChevronRight, X, Clock, Calendar } from 'lucide-react';
import { API_BASE } from '../lib/api';



type MeetingRequest = {
  id: string;
  user_id: string;
  user_name: string;
  professor_id: string;
  note: string;
  slot: string;
  meeting_type: string;
  status: string;
  date: string;
};

export default function ProfessorAdmin() {
  const { user } = useAuthStore();
  const { 
    courses,
    createChapter, deleteChapter, createTopic, deleteTopic
  } = useCourseStore();
  

  
  // Meeting management
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);

  // Course Content Management
  const [contentCourseId, setContentCourseId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  
  // Student Quiz Results


  if (!user || user.role !== 'professor') {
    return <Navigate to="/" replace />;
  }





  const fetchMeetings = async () => {
    const res = await fetch(`${API_BASE}/api/meetings`);
    const data = await res.json();
    setMeetings(data);
    setIsMeetingsModalOpen(true);
  };

  const handleMeetingStatus = async (meetingId: string, status: string) => {
    await fetch(`${API_BASE}/api/meetings/${meetingId}?status=${status}`, { method: 'PUT' });
    const res = await fetch(`${API_BASE}/api/meetings`);
    setMeetings(await res.json());
  };

  const openContentPanel = (courseId: string) => {
    setContentCourseId(courseId);
  };

  const closeContentPanel = () => {
    setContentCourseId(null);
  };

  const handleCreateChapter = async () => {
    if (!contentCourseId || !newChapterTitle.trim()) return;
    await createChapter(contentCourseId, newChapterTitle, '');
    setNewChapterTitle('');
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure? This will delete all topics in this chapter.')) return;
    await deleteChapter(chapterId);
  };

  const handleCreateTopic = async (chapterId: string) => {
    if (!newTopicTitle.trim()) return;
    await createTopic(chapterId, newTopicTitle, 'Newly created topic');
    setNewTopicTitle('');
    setEditingChapterId(null);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure?')) return;
    await deleteTopic(topicId);
  };



  const totalEnrolled = courses.reduce((acc, course) => {
    const enrollments = (course as any).enrollments as any[];
    return acc + (enrollments?.filter(e => e.status === 'approved').length || 0);
  }, 0);

  const activeCourse = courses.find(c => c.id === contentCourseId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Manage Courses</h1>
          <p className="text-gray-500 font-medium">Create, edit, and monitor your course content and student progress.</p>
        </div>
        <Link 
          to="/courses/create"
          className="hidden md:flex items-center justify-center bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:bg-blue-700 transition-colors hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" /> Create New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4">
             <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{courses.length}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Active Courses</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4">
             <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{totalEnrolled}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Enrolled Students</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mr-4">
             <Calendar className="w-7 h-7" />
          </div>
          <div>
            <button onClick={fetchMeetings} className="text-2xl font-black text-amber-600 hover:text-amber-700 transition-colors">Manage</button>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-0.5">Meeting Requests</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <h2 className="text-lg font-bold text-gray-900">Your Course Catalog</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {courses.map(course => (
            <div key={course.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex-1">
                 <div className="flex items-center mb-1">
                   <h3 className="text-lg font-bold text-gray-900 mr-3">{course.title}</h3>
                   <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-2 py-0.5 rounded-md">Published</span>
                 </div>
                 <p className="text-sm text-gray-500 line-clamp-1 mb-3">{course.description}</p>
                 <div className="flex items-center space-x-4 text-xs font-bold text-gray-500">
                   <span className="flex items-center"><BookOpen className="w-3.5 h-3.5 mr-1" /> {course.chapters.length} Chapters</span>
                 </div>
               </div>
               
               <div className="flex items-center space-x-2">
                 <button
                    onClick={() => openContentPanel(course.id)}
                    className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center"
                  >
                    Quick Add Chapter
                  </button>
                  <Link to={`/courses/${course.id}`} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center">
                    Manage Course <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
               </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="p-12 text-center text-gray-500 font-medium">No courses yet. Create your first course!</div>
          )}
        </div>
      </div>


      {/* Meeting Management Modal */}
      {isMeetingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-amber-500" /> Pending Meeting Requests
              </h2>
              <button onClick={() => setIsMeetingsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {meetings.filter(m => m.status === 'pending').map(m => (
                <div key={m.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="font-black text-gray-900">{m.user_name}</span>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${m.meeting_type === 'Zoom' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                         {m.meeting_type}
                       </span>
                    </div>
                    <div className="text-xs font-bold text-indigo-600 mb-2 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {m.slot}
                    </div>
                    <p className="text-sm text-gray-600 italic bg-white p-3 rounded-xl border border-gray-100">"{m.note}"</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleMeetingStatus(m.id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleMeetingStatus(m.id, 'rejected')}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {meetings.filter(m => m.status === 'pending').length === 0 && (
                <div className="py-12 text-center text-gray-400 font-bold italic">No pending requests workspace.</div>
              )}

              {/* Previously Handled */}
              {meetings.filter(m => m.status !== 'pending').length > 0 && (
                <div className="mt-8">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Past Decisions</h3>
                   <div className="space-y-2">
                     {meetings.filter(m => m.status !== 'pending').slice(0, 5).map(m => (
                       <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                         <div className="text-sm font-bold text-gray-700">{m.user_name} - <span className="text-xs text-gray-500 font-medium">{m.slot}</span></div>
                         <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                           {m.status}
                         </span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Course Content Management Modal */}
      {contentCourseId && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-3 text-indigo-500" /> Manage {activeCourse.title} Content
              </h2>
              <button onClick={closeContentPanel} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add Chapter */}
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="New Chapter Title..."
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={handleCreateChapter}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
                >
                  Add Chapter
                </button>
              </div>

              <div className="space-y-4">
                {activeCourse.chapters.map((chapter) => (
                  <div key={chapter.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">{chapter.title}</h3>
                      <button 
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      {chapter.topics.map((topic) => (
                        <div key={topic.id} className="flex items-center justify-between text-sm bg-white border border-gray-50 p-2 rounded-xl">
                          <span className="font-medium text-gray-700">{topic.title}</span>
                          <button 
                            onClick={() => handleDeleteTopic(topic.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <input 
                          type="text"
                          value={editingChapterId === chapter.id ? newTopicTitle : ''}
                          onChange={(e) => {
                            setEditingChapterId(chapter.id);
                            setNewTopicTitle(e.target.value);
                          }}
                          onFocus={() => setEditingChapterId(chapter.id)}
                          placeholder="New Topic..."
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                          onClick={() => handleCreateTopic(chapter.id)}
                          className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
