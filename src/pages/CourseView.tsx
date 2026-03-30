import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Trophy, ChevronRight, ChevronUp, Download, CheckCircle2, ClipboardList, Users, Search, UserMinus, Mail, Award, TrendingUp, X, Video, ExternalLink, Sparkles, Settings, Trash2, ToggleLeft, ToggleRight, Check, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDiscussionStore } from '../store/discussionStore';
import { useCourseStore } from '../store/courseStore';
import { API_BASE } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

type Tab = 'chapters' | 'materials' | 'discussions' | 'leaderboard' | 'quizzes' | 'students' | 'ai-insights';

type LeaderboardEntry = { rank: number; student: string; points: number; id: string; };
type QuizInfo = { id: string; title: string; quiz_type: string; topic_id?: string; chapter_id?: string; questions: any[]; };

type EnrolledStudent = {
  id: string;
  name: string;
  email: string;
  completedTopics: number;
  totalTopics: number;
  points: number;
  joinedAt: string;
};

export default function CourseView() {
  const { courseId } = useParams();
  const { user } = useAuthStore();
  const { discussions, addDiscussion } = useDiscussionStore();
  const { courses, createChapter } = useCourseStore();
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('PDF');

  const [activeTab, setActiveTab] = useState<Tab>('chapters');
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizzes, setQuizzes] = useState<QuizInfo[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Students tab state
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [unenrollConfirm, setUnenrollConfirm] = useState<string | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);



  // Pagination States
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [discussionsPage, setDiscussionsPage] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Edit course state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImage, setEditImage] = useState('');

  const course = courses.find(c => c.id === courseId) || courses[0];
  const courseDiscussions = discussions.filter(d => d.courseId === (course?.id));

  // Total topics count for the course
  const totalTopics = course?.chapters.reduce((sum, ch) => sum + ch.topics.length, 0) ?? 0;

  useEffect(() => {
    if (!course) return;
    fetch(`${API_BASE}/api/courses/${course.id}/leaderboard`)
      .then(r => r.json())
      .then(setLeaderboard)
      .catch(console.error);

    fetch(`${API_BASE}/api/quizzes/course/${course.id}`)
      .then(r => r.json())
      .then(setQuizzes)
      .catch(console.error);
  }, [course?.id]);

  // Fetch students and pending requests when Students tab is opened (professor only)
  useEffect(() => {
    if (activeTab !== 'students' || !course || user?.role !== 'professor') return;
    setStudentsLoading(true);
    setStudentsError(null);
    
    // Fetch Enrolled Students
    fetch(`${API_BASE}/api/courses/${course.id}/students`)
      .then(r => r.json())
      .then(setStudents)
      .catch(console.error);

    // Fetch Pending Requests
    fetch(`${API_BASE}/api/courses/${course.id}/enrollment-requests`)
      .then(r => r.json())
      .then(setPendingRequests)
      .finally(() => setStudentsLoading(false));
  }, [activeTab, course?.id, user?.role]);

  useEffect(() => {
    if (course) {
      setEditTitle(course.title);
      setEditDesc(course.description);
      setEditCategory(course.category || 'Computer Science');
      setEditImage(course.image || '');
    }
  }, [course]);

  const { fetchAIReport } = useCourseStore();

  // Fetch AI Report when tab is opened
  useEffect(() => {
    if (activeTab !== 'ai-insights' || !course || user?.role !== 'professor') return;
    setIsAiLoading(true);
    fetchAIReport(course.id).then(report => {
      setAiReport(report);
      setIsAiLoading(false);
    });
  }, [activeTab, course?.id, user?.role]);

  const handleUnenroll = async (studentId: string) => {
    if (!course) return;
    setUnenrolling(true);
    try {
      await fetch(`${API_BASE}/api/courses/${course.id}/students/${studentId}`, { method: 'DELETE' });
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      console.error('Failed to unenroll student:', err);
    } finally {
      setUnenrolling(false);
      setUnenrollConfirm(null);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !enrollStudentId.trim()) return;
    setEnrolling(true);
    try {
      const res = await fetch(`${API_BASE}/api/courses/${course.id}/enroll-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: enrollStudentId })
      });
      if (res.ok) {
        setEnrollStudentId('');
        const refreshed = await fetch(`${API_BASE}/api/courses/${course.id}/students`).then(r => r.json());
        setStudents(refreshed);
      } else {
        alert('Failed to enroll student. Please check the user ID.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    await fetch(`${API_BASE}/api/enrollments/${requestId}/approve`, { method: 'POST' });
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    const refreshed = await fetch(`${API_BASE}/api/courses/${course?.id}/students`).then(r => r.json());
    setStudents(refreshed);
  };

  const handleRejectRequest = async (requestId: string) => {
    await fetch(`${API_BASE}/api/enrollments/${requestId}`, { method: 'DELETE' });
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const { updateCourse, deleteCourse } = useCourseStore();
  const navigate = useNavigate();

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    await updateCourse(course.id, {
      title: editTitle,
      description: editDesc,
      category: editCategory,
      image: editImage || undefined
    });
    setIsSettingsOpen(false);
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    if (window.confirm('CRITICAL: Are you sure you want to delete this course? This will remove all materials, chapters, and student progress forever.')) {
      await deleteCourse(course.id);
      navigate('/courses');
    }
  };

  const toggleEnrollment = async () => {
    if (!course) return;
    await updateCourse(course.id, { is_open: !course.is_open });
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(debouncedStudentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(debouncedStudentSearch.toLowerCase())
  );

  const ITEMS_PER_PAGE = 10;
  const pagedLeaderboard = leaderboard.slice((leaderboardPage - 1) * ITEMS_PER_PAGE, leaderboardPage * ITEMS_PER_PAGE);
  const pagedStudents = filteredStudents.slice((studentsPage - 1) * ITEMS_PER_PAGE, studentsPage * ITEMS_PER_PAGE);
  const pagedDiscussions = courseDiscussions.slice(0, discussionsPage * ITEMS_PER_PAGE);

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim() || !course) return;
    await createChapter(course.id, newChapterTitle, '');
    setNewChapterTitle('');
    setShowAddChapter(false);
  };

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDiscTitle.trim() || !newDiscContent.trim()) return;

    addDiscussion({
      author: user.name,
      authorId: user.id || 'u999',
      title: newDiscTitle,
      content: newDiscContent,
      courseId: course.id
    });

    setIsDiscussionModalOpen(false);
    setNewDiscTitle('');
    setNewDiscContent('');
  };

  const { addMaterial, removeMaterial } = useCourseStore();

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !newMaterialName.trim() || !newMaterialUrl.trim()) return;
    await addMaterial(course.id, newMaterialName, newMaterialType, newMaterialUrl);
    setIsMaterialModalOpen(false);
    setNewMaterialName('');
    setNewMaterialUrl('');
  };

  const renderMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'link': return <ExternalLink className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return 'bg-red-50 text-red-600';
      case 'video': return 'bg-blue-50 text-blue-600';
      case 'link': return 'bg-amber-50 text-amber-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      await removeMaterial(course.id, materialId);
    }
  };

  if (!course) return <div className="text-center py-20 text-gray-500">Loading course...</div>;

  const tabs = [
    { id: 'chapters', label: 'Chapters', icon: BookOpen },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'quizzes', label: 'Quizzes', icon: ClipboardList },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'students', label: 'Students', icon: Users, professorOnly: true },
    { id: 'ai-insights', label: 'AI Insights', icon: TrendingUp, professorOnly: true },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Course Header */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-0 opacity-50 transform group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-blue-600 font-semibold">
              <Link to="/courses" className="hover:text-blue-800 transition-colors">Courses</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-500">{course.title}</span>
            </div>
            {user?.role === 'professor' && course.professor_id === user.id && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all border border-gray-200 flex items-center gap-2 font-bold text-sm"
              >
                <Settings className="w-4 h-4" />
                Edit Course
              </button>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {course.image && (
              <div className="w-full md:w-64 h-40 rounded-2xl overflow-hidden border border-gray-100 shadow-sm shrink-0">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  {course.category || 'Computer Science'}
                </span>
                {!course.is_open && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100">
                    Closed
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">{course.title}</h1>
              <p className="text-gray-600 max-w-2xl text-lg mb-4">{course.description}</p>
              <p className="text-sm text-gray-500 font-medium">
                Instructor: <Link to={`/profile/${course.professor_id}`} className="text-blue-600 hover:text-blue-800 hover:underline font-bold">{course.instructorName}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 p-1.5 flex shadow-sm overflow-x-auto scrollbar-hide">
        {tabs
          .filter(tab => !tab.professorOnly || user?.role === 'professor')
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
            >
              <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
      </div>

      {/* Tab Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 min-h-[400px] shadow-sm p-6 lg:p-8">

        {/* Chapters Tab */}
        {activeTab === 'chapters' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Course Journey</h2>
              {user?.role === 'professor' && (
                <button onClick={() => setShowAddChapter(!showAddChapter)} className="text-sm text-blue-600 font-bold hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                  + Add Chapter
                </button>
              )}
            </div>

            {showAddChapter && (
              <div className="flex gap-2 mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <input type="text" value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} placeholder="Chapter title..." className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleAddChapter} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Add</button>
              </div>
            )}
            <div className="space-y-4 relative">
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-100 z-0"></div>
              {course.chapters.map((chapter, index) => {
                const chapterCompleted = chapter.topics.every(t => t.completed);
                const hasProgress = chapter.topics.some(t => t.completed);
                return (
                  <div key={chapter.id} className="relative z-10 flex group">
                    <div className="flex-shrink-0 mr-6 mt-1.5 flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-4 border-white ${chapterCompleted ? 'bg-emerald-500 text-white' : hasProgress ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors'
                        }`}>
                        {chapterCompleted ? <CheckCircle2 className="w-6 h-6" /> : index + 1}
                      </div>
                    </div>
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group-hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{chapter.title}</h3>
                        {chapterCompleted && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-md font-bold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Complete
                          </span>
                        )}
                        {hasProgress && !chapterCompleted && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-md font-bold flex items-center">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-5">{chapter.summary}</p>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-bold">
                          {chapter.topics.filter(t => t.completed).length}/{chapter.topics.length} topics completed
                        </div>
                        <Link
                          to={`/courses/${course.id}/chapters/${chapter.id}`}
                          className="flex items-center text-sm font-bold text-white bg-gray-900 hover:bg-blue-600 px-5 py-2.5 rounded-lg transition-all"
                        >
                          Enter Chapter <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">Course Materials</h2>
              {user?.role === 'professor' && (
                <button
                  onClick={() => setIsMaterialModalOpen(true)}
                  className="text-sm text-white font-bold bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  + Add Material
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              {course.materials.map(mat => (
                <div key={mat.id} className="border border-gray-100 bg-white rounded-2xl p-5 flex flex-col hover:border-blue-200 hover:shadow-lg transition-all group relative">
                  <div className="flex items-start mb-4">
                    <div className={`p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform ${getMaterialColor(mat.type)}`}>
                      {renderMaterialIcon(mat.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{mat.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">{mat.type}</p>
                    </div>
                    {user?.role === 'professor' && (
                      <button
                        onClick={() => handleDeleteMaterial(mat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                        title="Delete Material"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 flex items-center hover:text-blue-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> View/Download
                    </a>
                  </div>
                </div>
              ))}
              {course.materials.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">No materials available yet.</p>
                </div>
              )}
            </div>
            {user?.role === 'professor' && course.materials.length > 0 && (
              <p className="text-xs text-center text-gray-400 font-medium">
                Professors can manage all materials for this course.
              </p>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Quizzes</h2>
            {quizzes.length > 0 ? (
              <div className="space-y-3">
                {quizzes.map(quiz => {
                  const isTopicQuiz = quiz.quiz_type === 'topic';
                  let chapterInfo = '';
                  let topicInfo = '';
                  for (const ch of course.chapters) {
                    if (quiz.chapter_id === ch.id) chapterInfo = ch.title;
                    for (const t of ch.topics) {
                      if (quiz.topic_id === t.id) {
                        topicInfo = t.title;
                        chapterInfo = ch.title;
                      }
                    }
                  }

                  let quizLink = '#';
                  if (isTopicQuiz && quiz.topic_id) {
                    const ch = course.chapters.find(ch => ch.topics.some(t => t.id === quiz.topic_id));
                    if (ch) quizLink = `/courses/${course.id}/chapters/${ch.id}/topics/${quiz.topic_id}/quiz`;
                  } else if (quiz.chapter_id) {
                    quizLink = `/courses/${course.id}/chapters/${quiz.chapter_id}/quiz`;
                  }

                  return (
                    <div key={quiz.id} className="border border-gray-100 rounded-xl p-5 flex items-center justify-between hover:border-blue-200 transition-all shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isTopicQuiz ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{quiz.title}</h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {chapterInfo}{topicInfo ? ` • ${topicInfo}` : ''} • {quiz.questions.length} questions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${isTopicQuiz ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                          {isTopicQuiz ? 'Topic Quiz' : 'Chapter Quiz'}
                        </span>
                        <Link to={quizLink} className="text-sm font-bold text-white bg-gray-900 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all">
                          Take Quiz
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 font-medium">No quizzes available for this course yet.</div>
            )}
          </div>
        )}

        {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Course Settings</h2>
                <p className="text-sm text-gray-500 font-medium">Update course metadata or remove the course.</p>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-3 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-2xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings}>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Course Title</label>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Description</label>
                  <textarea 
                    rows={4}
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Industry</label>
                    <select 
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Business">Business</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Science">Science</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest pl-1">Image URL</label>
                    <input 
                      type="text" 
                      value={editImage} 
                      onChange={e => setEditImage(e.target.value)} 
                      placeholder="https://..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between p-6 bg-red-50 rounded-3xl border border-red-100">
                    <div>
                      <h4 className="text-sm font-black text-red-900 uppercase tracking-widest">Delete Course</h4>
                      <p className="text-[11px] text-red-700 font-medium mt-1">This action is permanent and cannot be undone.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={handleDeleteCourse}
                      className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2 inline" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="px-6 py-3 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">Course Discussions</h2>
              <button
                onClick={() => setIsDiscussionModalOpen(true)}
                className="text-sm text-white font-bold bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                New Discussion
              </button>
            </div>

            <div className="space-y-3">
              {pagedDiscussions.map(disc => (
                <Link
                  key={disc.id}
                  to={`/courses/${course.id}/discussions/${disc.id}`}
                  className="block bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex">
                    {/* Upvote sidebar */}
                    <div className="flex flex-col items-center justify-center py-4 px-4 bg-gray-50/70 border-r border-gray-100 rounded-l-2xl gap-0.5 min-w-[56px]">
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm font-black ${(disc.upvotes || 0) > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {disc.upvotes || 0}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 min-w-0">
                      {disc.chapterId && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">
                          {course.chapters.find(ch => ch.id === disc.chapterId)?.title || 'Chapter'}
                          {disc.topicId && (
                            <span className="text-gray-400"> • {course.chapters.find(ch => ch.id === disc.chapterId)?.topics.find(t => t.id === disc.topicId)?.title || 'Topic'}</span>
                          )}
                        </span>
                      )}
                      <h4 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors truncate">{disc.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 mb-2 line-clamp-2">{disc.content}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                            {disc.author.charAt(0)}
                          </div>
                          {disc.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {disc.replies}
                        </span>
                        <span>{disc.date}</span>
                      </div>
                    </div>

                    {/* Thumbnail */}
                    {disc.image && (
                      <div className="w-24 h-24 m-4 rounded-xl overflow-hidden border border-gray-100 shrink-0 hidden sm:block">
                        <img src={disc.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {courseDiscussions.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">No discussions yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start a conversation to get things going!</p>
                </div>
              )}
              
              {/* Discussions Pagination (Load More) */}
              {courseDiscussions.length > pagedDiscussions.length && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={(e) => { e.preventDefault(); setDiscussionsPage(p => p + 1); }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl transition-colors text-sm"
                  >
                    Load More Discussions
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-yellow-50 to-white p-6 rounded-2xl border border-yellow-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center">
                  <Trophy className="w-7 h-7 text-yellow-500 mr-3" />
                  Course Leaderboard
                </h2>
                <p className="text-sm text-gray-600 mt-2 font-medium">Ranking based on topic completions and quiz scores in this course.</p>
              </div>
              {user?.role === 'student' && leaderboard.length > 0 && (
                <div className="text-center px-6 border-l border-yellow-200">
                  <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Your Rank</div>
                  <div className="text-3xl font-black text-yellow-600 mt-1">
                    #{leaderboard.find(e => e.id === user.id)?.rank || '-'}
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-hidden border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs font-black tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-center w-24">Rank</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedLeaderboard.map((student, idx) => (
                    <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${user?.id === student.id ? 'bg-blue-50/50 hover:bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        {idx < 3 && leaderboardPage === 1 ? (
                          <div className={`inline-flex w-8 h-8 rounded-full items-center justify-center font-bold text-white shadow-sm
                            ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500' :
                              idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                'bg-gradient-to-br from-amber-500 to-amber-700'}`}>
                            {student.rank}
                          </div>
                        ) : (
                          <span className="font-bold text-gray-400">{student.rank}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs mr-3">
                            {student.student.charAt(0)}
                          </div>
                          <Link to={`/profile/${student.id}`} className={`font-bold hover:underline ${user?.id === student.id ? 'text-blue-700' : 'text-gray-900'}`}>
                            {student.student} {user?.id === student.id && '(You)'}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                          {student.points} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-12 text-gray-500 font-medium">No leaderboard data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Leaderboard Pagination */}
            {leaderboard.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center mt-4 px-2 text-sm text-gray-600 font-medium">
                <div>Page {leaderboardPage} of {Math.ceil(leaderboard.length / ITEMS_PER_PAGE)}</div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))} 
                    disabled={leaderboardPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >Prev</button>
                  <button 
                    onClick={() => setLeaderboardPage(p => Math.min(Math.ceil(leaderboard.length / ITEMS_PER_PAGE), p + 1))} 
                    disabled={leaderboardPage === Math.ceil(leaderboard.length / ITEMS_PER_PAGE)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enrollment Management Dialog (Professor Only) */}
        {activeTab === 'students' && user?.role === 'professor' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
            {/* Enrollment Controls */}
            <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-colors ${course.is_open ? 'bg-emerald-500 shadow-emerald-200' : 'bg-gray-400 shadow-gray-200'}`}>
                  {course.is_open ? <ToggleRight className="w-8 h-8 text-white" /> : <ToggleLeft className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Enrollment Status</h3>
                  <p className="text-sm font-medium text-gray-500">
                    {course.is_open ? 'Course is currently accepting new student join requests.' : 'Course is closed. Students cannot request to join.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleEnrollment}
                className={`px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg ${
                  course.is_open 
                  ? 'bg-white text-gray-900 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-gray-100' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {course.is_open ? 'Close Enrollment' : 'Open Enrollment'}
              </button>
            </div>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending Requests
                  <span className="ml-2 px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    {pendingRequests.length}
                  </span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white border border-amber-100 rounded-[24px] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 font-bold text-sm">
                          {req.user_name?.charAt(0) || req.user_id.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{req.user_name || req.user_id}</p>
                          <p className="text-xs text-gray-400 font-medium">{req.user_email || 'Student'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleApproveRequest(req.id)}
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(req.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Enrolled Students</h2>
                {!studentsLoading && !studentsError && (
                  <p className="text-sm text-gray-500 font-medium mt-0.5">
                    {students.length} student{students.length !== 1 ? 's' : ''} enrolled in this course
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Enroll Form */}
                <form onSubmit={handleEnrollStudent} className="flex gap-2">
                  <input
                    type="text"
                    value={enrollStudentId}
                    onChange={e => setEnrollStudentId(e.target.value)}
                    placeholder="Enter User ID (e.g. u1)"
                    className="w-full sm:w-48 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={enrolling || !enrollStudentId.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {enrolling ? '...' : '+ Add Student'}
                  </button>
                </form>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Summary stat cards */}
            {!studentsLoading && !studentsError && students.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Total enrolled */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-blue-700">{students.length}</p>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">Enrolled</p>
                  </div>
                </div>

                {/* Avg progress */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-700">
                      {totalTopics > 0
                        ? Math.round(
                          students.reduce((sum, s) => sum + (s.completedTopics / (totalTopics || 1)) * 100, 0) / students.length
                        )
                        : 0}%
                    </p>
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Avg Progress</p>
                  </div>
                </div>

                {/* Top scorer */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-black text-amber-700 truncate">
                      {[...students].sort((a, b) => b.points - a.points)[0]?.name.split(' ')[0] ?? '—'}
                    </p>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Top Scorer</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {studentsLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm font-medium">Loading students...</p>
              </div>
            )}

            {/* Error state */}
            {studentsError && !studentsLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="p-4 bg-red-50 rounded-full">
                  <Users className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-sm font-bold text-red-600">{studentsError}</p>
                <button
                  onClick={() => setActiveTab('chapters')}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Go back
                </button>
              </div>
            )}

            {/* Empty state (after load, no students) */}
            {!studentsLoading && !studentsError && students.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base font-bold text-gray-700">No students enrolled yet</p>
                <p className="text-sm text-gray-500">Students will appear here once they join this course.</p>
              </div>
            )}

            {/* No search results */}
            {!studentsLoading && !studentsError && students.length > 0 && filteredStudents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <Search className="w-8 h-8 text-gray-300" />
                <p className="text-sm font-bold text-gray-500">No students match "{studentSearch}"</p>
                <button
                  onClick={() => setStudentSearch('')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Student table */}
            {!studentsLoading && !studentsError && filteredStudents.length > 0 && (
              <div className="overflow-hidden border border-gray-200 rounded-2xl">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs font-black tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Progress</th>
                      <th className="px-6 py-4 text-right hidden md:table-cell">Points</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedStudents.map(student => {
                      const progressPct = totalTopics > 0
                        ? Math.round((student.completedTopics / totalTopics) * 100)
                        : 0;
                      const progressColor =
                        progressPct === 100 ? 'bg-emerald-500' :
                          progressPct >= 50 ? 'bg-blue-500' :
                            progressPct > 0 ? 'bg-amber-400' :
                              'bg-gray-200';

                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          {/* Student info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <Link to={`/profile/${student.id}`} className="block font-bold text-gray-900 hover:text-blue-600 hover:underline truncate">{student.name}</Link>
                                <p className="text-xs text-gray-400 font-medium flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Progress bar */}
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-500 w-9 text-right shrink-0">
                                {progressPct}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mt-1">
                              {student.completedTopics}/{totalTopics} topics
                            </p>
                          </td>

                          {/* Points */}
                          <td className="px-6 py-4 text-right hidden md:table-cell">
                            <span className="font-black text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
                              {student.points} pts
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            {unenrollConfirm === student.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs font-bold text-gray-600 hidden sm:inline">Remove?</span>
                                <button
                                  onClick={() => handleUnenroll(student.id)}
                                  disabled={unenrolling}
                                  className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                                >
                                  {unenrolling ? '...' : 'Yes'}
                                </button>
                                <button
                                  onClick={() => setUnenrollConfirm(null)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setUnenrollConfirm(student.id)}
                                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto border border-transparent hover:border-red-100"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Unenroll</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Students Pagination */}
            {!studentsLoading && !studentsError && filteredStudents.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center mt-4 px-2 text-sm text-gray-600 font-medium">
                <div>Page {studentsPage} of {Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)}</div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setStudentsPage(p => Math.max(1, p - 1))} 
                    disabled={studentsPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >Prev</button>
                  <button 
                    onClick={() => setStudentsPage(p => Math.min(Math.ceil(filteredStudents.length / ITEMS_PER_PAGE), p + 1))} 
                    disabled={studentsPage === Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI Insights Tab (Professor Only) ── */}
        {activeTab === 'ai-insights' && user?.role === 'professor' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
            {/* AI Insights content */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-black mb-2 flex items-center">
                    <Sparkles className="w-8 h-8 mr-3 text-blue-200 animate-pulse" />
                    Course Analytics & AI Insights
                  </h2>
                  <p className="text-blue-100 font-medium text-lg max-w-2xl">
                    AI-driven analysis of quiz performance, participation, and learning gaps across the entire course.
                  </p>
                </div>
                {isAiLoading && <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full"></div>}
              </div>
            </div>

            {aiReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Insights & Struggling Topics */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Learning Gaps Card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 flex items-center italic">
                        <Sparkles className="w-5 h-5 mr-2 text-indigo-500" /> Top Learning Gaps (AI Analysis)
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {aiReport.struggling_topics.map((topic: any, idx: number) => (
                        <div key={idx} className="p-6 hover:bg-red-50/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900">{topic.topic_title}</h4>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{topic.chapter_title}</p>
                            </div>
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black border border-red-100 italic">
                              {topic.fail_rate}% Struggle Rate
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${topic.fail_rate}%` }}></div>
                          </div>
                          <p className="text-sm text-gray-600 bg-white p-3 rounded-xl border border-red-100 shadow-sm leading-relaxed">
                            <span className="flex items-center font-bold text-red-700 mb-1">
                              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI Observation
                            </span>
                            {topic.common_mistake}
                          </p>
                        </div>
                      ))}
                      {aiReport.struggling_topics.length === 0 && (
                        <div className="p-12 text-center text-gray-400 font-bold italic">No major learning gaps identified yet. Great work!</div>
                      )}
                    </div>
                  </div>

                  {/* Insight Box */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                    <h4 className="text-indigo-800 font-black text-sm uppercase tracking-widest mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" /> Pedagogical Recommendations
                    </h4>
                    <p className="text-indigo-900 font-medium text-lg leading-relaxed italic">
                      "{aiReport.insight}"
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Generate Action Plan →</button>
                    </div>
                  </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                  {/* Participation Summary */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h4 className="font-bold text-gray-900 mb-6 pb-2 border-b border-gray-50">Participation Analysis</h4>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">High Performers</span>
                          <span className="font-bold text-gray-900">{aiReport.high_performers.length}</span>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden mb-1">
                          {aiReport.high_performers.slice(0, 5).map((s: any) => (
                            <div key={s.student_id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black" title={s.student_name}>
                              {s.student_name[0]}
                            </div>
                          ))}
                          {aiReport.high_performers.length > 5 && (
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black">
                              +{aiReport.high_performers.length - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Low Participation</span>
                          <span className="font-bold text-gray-900">{aiReport.low_participation.length}</span>
                        </div>
                        <div className="flex -space-x-2 overflow-hidden mb-1">
                          {aiReport.low_participation.slice(0, 5).map((s: any) => (
                            <div key={s.student_id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black" title={s.student_name}>
                              {s.student_name[0]}
                            </div>
                          ))}
                          {aiReport.low_participation.length > 5 && (
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black">
                              +{aiReport.low_participation.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg">
                    <h4 className="font-bold mb-3 flex items-center"><Award className="w-5 h-5 mr-2 text-yellow-400" /> Improvement Target</h4>
                    <p className="text-sm text-gray-400 mb-4 line-relaxed">
                      AI suggests focusing on <span className="text-white font-bold">{aiReport.struggling_topics[0]?.topic_title || 'overall participation'}</span> this week to improve course retention.
                    </p>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm">
                      Schedule Review Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              !isAiLoading && (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Not Enough Data for AI Analysis</h3>
                  <p className="text-gray-500 max-w-sm mx-auto font-medium">
                    Students need to complete more quizzes and participate in discussions before the AI can generate meaningful insights.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Create Material Modal */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Add Course Material</h2>
              <button
                onClick={() => setIsMaterialModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Material Name</label>
                  <input
                    type="text"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                    required
                    placeholder="e.g. Week 1 Lecture Slides"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Material Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PDF', 'Video', 'Link'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewMaterialType(t)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${newMaterialType === t
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Source URL (PDF/Video/Link)</label>
                  <input
                    type="url"
                    value={newMaterialUrl}
                    onChange={(e) => setNewMaterialUrl(e.target.value)}
                    required
                    placeholder="https://..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Discussion Modal */}
      {isDiscussionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Start Course Discussion</h2>
              <button
                onClick={() => setIsDiscussionModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center text-lg leading-none">&times;</div>
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Discussion Title</label>
                  <input
                    type="text"
                    value={newDiscTitle}
                    onChange={(e) => setNewDiscTitle(e.target.value)}
                    required
                    placeholder="e.g. Question about the Syllabus"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Details</label>
                  <textarea
                    value={newDiscContent}
                    onChange={(e) => setNewDiscContent(e.target.value)}
                    required
                    placeholder="Describe your question or discussion point in detail..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32 transition-shadow"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDiscussionModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDiscTitle.trim() || !newDiscContent.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  Post Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}