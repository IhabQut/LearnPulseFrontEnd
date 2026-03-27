import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { BookOpen, Edit2, Trash2, Plus, Users, BarChart, ChevronRight, ChevronDown, ChevronUp, X, Image as ImageIcon, UserPlus, Search, Check, Clock, Calendar } from 'lucide-react';
import { API_BASE } from '../lib/api';

type EnrollmentRequest = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  date: string;
  user_name: string;
};

type SearchResult = {
  id: string;
  name: string;
  role: string;
};

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
    courses, createCourse, updateCourse, deleteCourse, fetchCourses,
    createChapter, deleteChapter, createTopic, deleteTopic
  } = useCourseStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  // Enrollment state
  const [enrollmentCourseId, setEnrollmentCourseId] = useState<string | null>(null);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Meeting management
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);

  // Course Content Management
  const [contentCourseId, setContentCourseId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  
  // Student Quiz Results
  const [viewingStudentResultsId, setViewingStudentResultsId] = useState<string | null>(null);
  const [studentQuizAttempts, setStudentQuizAttempts] = useState<any[]>([]);

  if (!user || user.role !== 'professor') {
    return <Navigate to="/" replace />;
  }

  const openCreateModal = () => {
    setEditingCourse(null);
    setCourseTitle('');
    setCourseDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseDesc(course.description);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;
    if (editingCourse) {
      await updateCourse(editingCourse.id, { title: courseTitle, description: courseDesc });
    } else {
      await createCourse(courseTitle, courseDesc, user.id);
    }
    closeModal();
  };

  const handleDelete = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      await deleteCourse(courseId);
    }
  };

  // Enrollment management
  const openEnrollmentPanel = async (courseId: string) => {
    setEnrollmentCourseId(courseId);
    const res = await fetch(`${API_BASE}/api/courses/${courseId}/enrollment-requests`);
    const data = await res.json();
    setEnrollmentRequests(data);
  };

  const closeEnrollmentPanel = () => {
    setEnrollmentCourseId(null);
    setEnrollmentRequests([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const approveEnrollment = async (enrollmentId: string) => {
    await fetch(`${API_BASE}/api/enrollments/${enrollmentId}/approve`, { method: 'POST' });
    if (enrollmentCourseId) openEnrollmentPanel(enrollmentCourseId);
  };

  const searchStudents = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(q)}`);
    setSearchResults(await res.json());
  };

  const enrollStudent = async (studentId: string) => {
    if (!enrollmentCourseId) return;
    await fetch(`${API_BASE}/api/courses/${enrollmentCourseId}/enroll-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: studentId })
    });
    openEnrollmentPanel(enrollmentCourseId);
    setSearchQuery('');
    setSearchResults([]);
  };

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

  const fetchStudentResults = async (studentId: string) => {
    const res = await fetch(`${API_BASE}/api/quizzes/student/${studentId}/attempts`);
    const data = await res.json();
    setStudentQuizAttempts(data);
    setViewingStudentResultsId(studentId);
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
        <button 
          onClick={openCreateModal}
          className="hidden md:flex items-center justify-center bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:bg-blue-700 transition-colors hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" /> Create New Course
        </button>
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
                   className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors flex items-center"
                 >
                   <Plus className="w-4 h-4 mr-1.5" /> Content
                 </button>
                 <button
                   onClick={() => openEnrollmentPanel(course.id)}
                   className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors flex items-center"
                 >
                   <UserPlus className="w-4 h-4 mr-1.5" /> Students
                 </button>
                 <Link to={`/courses/${course.id}`} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center">
                   Preview <ChevronRight className="w-4 h-4 ml-1" />
                 </Link>
                 <button 
                    onClick={() => openEditModal(course)}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                 >
                   <Edit2 className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => handleDelete(course.id)}
                   className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="p-12 text-center text-gray-500 font-medium">No courses yet. Create your first course!</div>
          )}
        </div>
      </div>

      {/* Course Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Course Title</label>
                   <input 
                     type="text" 
                     value={courseTitle}
                     onChange={(e) => setCourseTitle(e.target.value)}
                     required
                     placeholder="e.g. Advanced Operating Systems"
                     className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
                   <textarea 
                     value={courseDesc}
                     onChange={(e) => setCourseDesc(e.target.value)}
                     placeholder="Explain what students will learn..."
                     className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-28" 
                   />
                 </div>
              </div>
            
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrollment Management Modal */}
      {enrollmentCourseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Manage Students</h2>
              <button onClick={closeEnrollmentPanel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Search & Enroll */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Search & Enroll Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => searchStudents(e.target.value)}
                    placeholder="Search by student name or ID..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                    {searchResults.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-3">{s.name.charAt(0)}</div>
                          <div>
                            <div className="font-bold text-sm text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-500">ID: {s.id}</div>
                          </div>
                        </div>
                        <button onClick={() => enrollStudent(s.id)} className="text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                          Enroll
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Requests */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-amber-500" /> Pending Requests
                </h3>
                <div className="space-y-2">
                  {enrollmentRequests.filter(e => e.status === 'pending').map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold mr-3">{e.user_name.charAt(0)}</div>
                        <span className="font-bold text-sm text-gray-900">{e.user_name}</span>
                      </div>
                      <button onClick={() => approveEnrollment(e.id)} className="text-xs font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Approve
                      </button>
                    </div>
                  ))}
                  {enrollmentRequests.filter(e => e.status === 'pending').length === 0 && (
                    <p className="text-sm text-gray-500 font-medium italic">No pending requests.</p>
                  )}
                </div>
              </div>

              {/* Approved Students */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <Check className="w-4 h-4 mr-2 text-emerald-500" /> Enrolled Students
                </h3>
                <div className="space-y-2">
                  {enrollmentRequests.filter(e => e.status === 'approved').map(e => (
                      <div key={e.id} className="flex items-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold mr-3">{e.user_name.charAt(0)}</div>
                        <span className="font-bold text-sm text-gray-900">{e.user_name}</span>
                        <div className="ml-auto flex items-center space-x-2">
                          <button 
                            onClick={() => fetchStudentResults(e.user_id)}
                            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Quiz Results
                          </button>
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">Enrolled</span>
                        </div>
                      </div>
                  ))}
                  {enrollmentRequests.filter(e => e.status === 'approved').length === 0 && (
                    <p className="text-sm text-gray-500 font-medium italic">No students enrolled yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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

      {/* Student Quiz Results Modal */}
      {viewingStudentResultsId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <BarChart className="w-5 h-5 mr-3 text-blue-500" /> Student Quiz Performance
              </h2>
              <button onClick={() => setViewingStudentResultsId(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {studentQuizAttempts.length === 0 && (
                <div className="text-center py-12 text-gray-400 font-medium font-italic">No quiz attempts recorded yet.</div>
              )}
              {studentQuizAttempts.map((attempt) => (
                <div key={attempt.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{attempt.quiz_title}</h4>
                      <p className="text-xs text-gray-500">{attempt.date}</p>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-full border border-gray-100">
                      <span className={`font-black text-sm ${attempt.score / attempt.total >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {attempt.score} / {attempt.total}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${attempt.score / attempt.total >= 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${(attempt.score / attempt.total) * 100}%` }}
                    />
                  </div>
                  {attempt.points_awarded > 0 && (
                    <div className="mt-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">+ {attempt.points_awarded} Points Awarded</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
