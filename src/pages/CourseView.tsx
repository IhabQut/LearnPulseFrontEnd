import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Trophy, ChevronRight, Download, CheckCircle2, ClipboardList, Star, Users, Search, UserMinus, Mail, Award, TrendingUp, X, Video, ExternalLink, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDiscussionStore } from '../store/discussionStore';
import { useCourseStore } from '../store/courseStore';
import { API_BASE } from '../lib/api';

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
  const { discussions, addDiscussion, awardPoints } = useDiscussionStore();
  const { courses, createChapter } = useCourseStore();
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [awardingDiscId, setAwardingDiscId] = useState<string | null>(null);
  const [awardUserId, setAwardUserId] = useState('');
  const [awardPts, setAwardPts] = useState(5);
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
  const [unenrollConfirm, setUnenrollConfirm] = useState<string | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);

  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

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

  // Fetch students when Students tab is opened (professor only)
  useEffect(() => {
    if (activeTab !== 'students' || !course || user?.role !== 'professor') return;
    setStudentsLoading(true);
    setStudentsError(null);
    fetch(`${API_BASE}/api/courses/${course.id}/students`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch students');
        return r.json();
      })
      .then((data: EnrolledStudent[]) => {
        setStudents(data);
        setStudentsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setStudentsError('Could not load students. Please try again.');
        setStudentsLoading(false);
      });
  }, [activeTab, course?.id, user?.role]);

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

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim() || !course) return;
    await createChapter(course.id, newChapterTitle, '');
    setNewChapterTitle('');
    setShowAddChapter(false);
  };

  const handleAwardPoints = async (discId: string) => {
    if (!awardUserId) return;
    await awardPoints(discId, awardUserId, awardPts);
    setAwardingDiscId(null);
    setAwardUserId('');
    setAwardPts(5);
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

  const { addReply } = useDiscussionStore();

  const toggleDiscussion = (id: string) => {
    setExpandedDiscussionId(expandedDiscussionId === id ? null : id);
  };

  const handleCreateReply = (e: React.FormEvent, discussionId: string) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;
    addReply(discussionId, {
      author: user.name,
      authorId: user.id || 'u999',
      text: replyContent,
      role: user.role,
    });
    setReplyContent('');
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
          <div className="flex items-center space-x-2 text-sm text-blue-600 font-semibold mb-3">
            <Link to="/courses" className="hover:text-blue-800 transition-colors">Courses</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-500">{course.title}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">{course.title}</h1>
          <p className="text-gray-600 max-w-3xl text-lg mb-6">{course.description}</p>
          <p className="text-sm text-gray-500 font-medium">Instructor: {course.instructorName}</p>

          {user?.role === 'professor' && (
            <div className="flex space-x-3 mt-4">
              <button className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">Edit Course</button>
              <button className="bg-white text-gray-700 border border-gray-200 px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">Manage Students</button>
            </div>
          )}
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
              className={`flex items-center justify-center px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
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
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-4 border-white ${
                        chapterCompleted ? 'bg-emerald-500 text-white' : hasProgress ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors'
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

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">Overall Course Discussion</h2>
              <button
                onClick={() => setIsDiscussionModalOpen(true)}
                className="text-sm text-white font-bold bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                New Discussion
              </button>
            </div>

            <div className="space-y-4">
              {courseDiscussions.map(disc => (
                <div key={disc.id} className="border border-gray-100 rounded-xl p-5 hover:border-blue-200 transition-all shadow-sm">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-700 mr-4 shrink-0">
                      {disc.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col">
                          {disc.chapterId && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                              From: {course.chapters.find(ch => ch.id === disc.chapterId)?.title || 'Chapter'}
                              {disc.topicId && (
                                <span className="text-gray-400"> • {course.chapters.find(ch => ch.id === disc.chapterId)?.topics.find(t => t.id === disc.topicId)?.title || 'Topic'}</span>
                              )}
                            </span>
                          )}
                          <h4 className="font-bold text-gray-900 text-base">{disc.title}</h4>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 block">Started by <span className="font-semibold text-gray-700">{disc.author}</span> • {disc.date}</p>
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{disc.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          {disc.replies} replies
                        </div>
                        <div className="flex items-center gap-2">
                          {user?.role === 'professor' && (
                            awardingDiscId === disc.id ? (
                              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                <input type="text" value={awardUserId} onChange={e => setAwardUserId(e.target.value)} placeholder="User ID" className="w-16 text-xs border border-gray-200 rounded px-1 py-0.5" />
                                <input type="number" value={awardPts} onChange={e => setAwardPts(Number(e.target.value))} className="w-12 text-xs border border-gray-200 rounded px-1 py-0.5" />
                                <button onClick={() => handleAwardPoints(disc.id)} className="text-xs font-bold text-amber-700 hover:text-amber-900">Give</button>
                                <button onClick={() => setAwardingDiscId(null)} className="text-xs text-gray-400">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => setAwardingDiscId(disc.id)} className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors">
                                <Star className="w-3 h-3 mr-1" /> Award Points
                              </button>
                            )
                          )}
                          <button 
                            onClick={() => toggleDiscussion(disc.id)}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800"
                          >
                            {expandedDiscussionId === disc.id ? 'Close Thread' : 'Join Thread →'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inline replies in CourseView */}
                  {expandedDiscussionId === disc.id && (
                    <div className="border-t border-gray-100 bg-gray-50/30 -mx-5 -mb-5 mt-5">
                      <div className="p-5 space-y-4">
                        <div className="space-y-3 ml-10 border-l-2 border-gray-100 pl-5 py-2">
                          {disc.replyList && disc.replyList.length > 0 ? (
                            disc.replyList.map(reply => (
                              <div key={reply.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm relative">
                                <div className="absolute -left-[26px] top-4 w-3 h-3 rounded-full bg-gray-200 border-2 border-gray-50"></div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      reply.role === 'professor' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {reply.role === 'professor' ? <BookOpen className="w-3 h-3" /> : reply.author.charAt(0)}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{reply.author}</span>
                                    {reply.role === 'professor' && (
                                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-100">Professor</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400 font-medium">{reply.date}</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed ml-8">{reply.text}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 font-medium italic">No replies yet. Be the first!</div>
                          )}
                        </div>

                        {/* Reply form */}
                        <form onSubmit={(e) => handleCreateReply(e, disc.id)} className="ml-10 relative">
                          <textarea 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none h-16"
                          ></textarea>
                          <button 
                            type="submit"
                            disabled={!replyContent.trim()}
                            className="absolute right-2 bottom-2 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {courseDiscussions.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-medium">No discussions yet. Start one!</div>
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
                  {leaderboard.map((student, idx) => (
                    <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${user?.id === student.id ? 'bg-blue-50/50 hover:bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        {idx < 3 ? (
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
                          <span className={`font-bold ${user?.id === student.id ? 'text-blue-700' : 'text-gray-900'}`}>
                            {student.student} {user?.id === student.id && '(You)'}
                          </span>
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
          </div>
        )}

        {/* ── Students Tab (Professor Only) ── */}
        {activeTab === 'students' && user?.role === 'professor' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">

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
                    {filteredStudents.map(student => {
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
                                <p className="font-bold text-gray-900 truncate">{student.name}</p>
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
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          newMaterialType === t 
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