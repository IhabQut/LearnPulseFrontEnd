import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, PlayCircle, CheckCircle2, MessageSquare, Award, Lock, ClipboardList, Edit3, Save, Trash2, PlusCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDiscussionStore } from '../store/discussionStore';
import { useCourseStore } from '../store/courseStore';
import { API_BASE } from '../lib/api';

export default function ChapterView() {
  const { courseId, chapterId } = useParams();
  const { user } = useAuthStore();
  const { discussions, addDiscussion } = useDiscussionStore();
  const { courses, markTopicDone, updateChapter, updateTopic, createTopic, deleteTopic, generateChapterSummary } = useCourseStore();
  
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Editing states
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicDesc, setEditTopicDesc] = useState('');
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Quiz Management states
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_option: 0,
    explanation: ''
  });

  const course = courses.find(c => c.id === courseId) || courses[0];
  const chapter = course?.chapters.find(ch => ch.id === chapterId);
  
  useEffect(() => {
    if (chapter) {
      setEditSummaryText(chapter.summary);
      document.title = `${chapter.title} | AI Learning Hub`;
    }
  }, [chapter]);

  if (!course || !chapter) return <div className="text-center py-20 text-gray-500 font-medium">Loading chapter...</div>;

  const chapterDiscussions = discussions.filter(d => d.chapterId === chapter.id);

  const handleSaveSummary = async () => {
    await updateChapter(chapter.id, { summary: editSummaryText });
    setIsEditingSummary(false);
  };

  const handleGenerateAI = async () => {
    if (!chapter) return;
    setIsGeneratingAI(true);
    const summary = await generateChapterSummary(chapter.id);
    setEditSummaryText(summary);
    // Don't save automatically, let the professor review it first
    setIsEditingSummary(true);
    setIsGeneratingAI(false);
  };

  const startEditTopic = (topic: any) => {
    setEditingTopicId(topic.id);
    setEditTopicTitle(topic.title);
    setEditTopicDesc(topic.description);
  };

  const handleSaveTopic = async (topicId: string) => {
    await updateTopic(topicId, { title: editTopicTitle, description: editTopicDesc });
    setEditingTopicId(null);
  };

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;
    await createTopic(chapter.id, newTopicTitle, 'New Topic Description');
    setNewTopicTitle('');
    setShowAddTopic(false);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (confirm("Are you sure you want to delete this topic?")) {
      await deleteTopic(topicId);
    }
  };

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDiscTitle.trim() || !newDiscContent.trim()) return;

    addDiscussion({
      author: user.name,
      authorId: user.id || 'u999',
      title: newDiscTitle,
      content: newDiscContent,
      courseId: course.id,
      chapterId: chapter.id,
      topicId: selectedTopicId || undefined
    });

    setIsDiscussionModalOpen(false);
    setNewDiscTitle('');
    setNewDiscContent('');
    setSelectedTopicId(null);
  };



  const handleOpenQuizManager = async (type: 'topic' | 'chapter', id: string) => {
    let url = `${API_BASE}/api/quizzes/${type}/${id}`;
    const res = await fetch(url);
    let quizData = await res.json();

    if (!quizData) {
      // Create quiz if not exists
      const createRes = await fetch(`${API_BASE}/api/quizzes/${type}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: type === 'topic' ? `Quiz: ${chapter.topics.find(t => t.id === id)?.title}` : `Final Quiz: ${chapter.title}`,
          quiz_type: type,
          topic_id: type === 'topic' ? id : null,
          chapter_id: type === 'chapter' ? id : null
        })
      });
      quizData = await createRes.json();
    }
    setActiveQuiz(quizData);
    setIsQuizModalOpen(true);
  };

  const handleAddQuestion = async () => {
    if (!activeQuiz) return;
    const res = await fetch(`${API_BASE}/api/quizzes/${activeQuiz.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newQuestion,
        options: JSON.stringify(newQuestion.options)
      })
    });
    const question = await res.json();
    setActiveQuiz({ ...activeQuiz, questions: [...activeQuiz.questions, question] });
    setNewQuestion({
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_option: 0,
      explanation: ''
    });
  };

  const handleDeleteQuestion = async (qId: string) => {
    await fetch(`${API_BASE}/api/quizzes/questions/${qId}`, { method: 'DELETE' });
    setActiveQuiz({ ...activeQuiz, questions: activeQuiz.questions.filter((q: any) => q.id !== qId) });
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId);
  };



  const allTopicsCompleted = chapter.topics.every(t => t.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-blue-600 font-semibold mb-2">
        <Link to="/courses" className="hover:text-blue-800 transition-colors">Courses</Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <Link to={`/courses/${course.id}`} className="hover:text-blue-800 transition-colors truncate max-w-[200px]">{course.title}</Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-500 truncate">{chapter.title}</span>
      </div>

      {/* Chapter Summary Header */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -z-0 opacity-50"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1 pr-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">{chapter.title}</h1>
            
            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50 mb-2 relative group">
              <h3 className="text-sm uppercase tracking-wider font-bold text-blue-800 mb-2 flex items-center justify-between">
                <span className="flex items-center"><Sparkles className="w-4 h-4 mr-2 text-indigo-500 animate-pulse" /> AI Learning Summary</span>
                {user?.role === 'professor' && !isEditingSummary && (
                  <button onClick={() => setIsEditingSummary(true)} title="Edit Summary" className="p-1 hover:bg-white rounded transition-colors opacity-0 group-hover:opacity-100">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                )}
                  <button 
                    onClick={handleGenerateAI} 
                    disabled={isGeneratingAI}
                    className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all disabled:opacity-50 group/ai"
                  >
                    {isGeneratingAI ? (
                      <div className="animate-spin w-3 h-3 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full mr-1.5"></div>
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1.5 text-indigo-500 group-hover/ai:rotate-12 transition-transform" />
                    )}
                    Precision Summarize
                  </button>
              </h3>
              {isEditingSummary ? (
                <div className="space-y-3">
                   <textarea 
                     value={editSummaryText}
                     onChange={e => setEditSummaryText(e.target.value)}
                     className="w-full bg-white border border-blue-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                   />
                   <div className="flex justify-end gap-2">
                     <button onClick={() => setIsEditingSummary(false)} className="text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                     <button onClick={handleSaveSummary} className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center">
                       <Save className="w-3 h-3 mr-1" /> Save
                     </button>
                   </div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed font-medium">
                  {chapter.summary}
                </p>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-blue-900/10">
            <div className="text-4xl font-black mb-1">
              {Math.round((chapter.topics.filter(t => t.completed).length / chapter.topics.length) * 100)}%
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-100">Progress</div>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 pt-4">
          <h2 className="text-xl font-bold text-gray-900">Study Topics</h2>
          {user?.role === 'professor' && (
            <button onClick={() => setShowAddTopic(!showAddTopic)} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center">
              <PlusCircle className="w-4 h-4 mr-1" /> Add Topic
            </button>
          )}
        </div>
        
        {showAddTopic && (
          <div className="flex gap-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
            <input 
              type="text" 
              value={newTopicTitle}
              onChange={e => setNewTopicTitle(e.target.value)}
              placeholder="Topic Title..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <button onClick={handleAddTopic} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">Create</button>
          </div>
        )}
        
        {chapter.topics.map((topic, index) => {
          const isExpanded = expandedTopic === topic.id;
          const isLocked = index > 0 && !chapter.topics[index - 1].completed && user?.role === 'student';

          return (
            <div 
              key={topic.id} 
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded ? 'border-blue-200 shadow-md ring-1 ring-blue-50/50' : 'border-gray-100 shadow-sm hover:border-blue-100'
              } ${isLocked ? 'opacity-75 bg-gray-50' : ''}`}
            >
              {/* Topic Header */}
              <button 
                onClick={() => !isLocked && toggleTopic(topic.id)}
                className="w-full text-left px-6 py-5 flex items-center justify-between group focus:outline-none"
                disabled={isLocked}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    topic.completed 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : isLocked ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                  }`}>
                    {topic.completed ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : index + 1}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${isLocked ? 'text-gray-500' : 'text-gray-900 group-hover:text-blue-600 transition-colors'}`}>
                      {topic.title}
                    </h3>
                    <div className="flex items-center mt-1 space-x-2">
                       {topic.completed && <span className="text-xs font-bold text-emerald-600 tracking-wide uppercase">Completed</span>}
                       {isLocked && <span className="text-xs font-bold text-gray-500 tracking-wide uppercase flex items-center"><Lock className="w-3 h-3 mr-1" /> Locked</span>}
                       {!topic.completed && !isLocked && <span className="text-xs font-bold text-blue-600 tracking-wide uppercase">Up Next</span>}
                    </div>
                  </div>
                </div>
                {!isLocked && (
                  <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50'}`}>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </button>

              {/* Expandable Content */}
              <div 
                className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
              >
                <div className="p-6 pt-0 border-t border-gray-50 bg-gray-50/50">
                    {editingTopicId === topic.id ? (
                      <div className="space-y-4 mb-6 pt-2">
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Title</label>
                           <input type="text" value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                           <textarea value={editTopicDesc} onChange={e => setEditTopicDesc(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" />
                         </div>
                         <div className="flex justify-end gap-2">
                            <button onClick={async () => { await handleDeleteTopic(topic.id); setEditingTopicId(null); }} className="text-xs font-bold text-red-500 px-3 py-1 hover:bg-red-50 rounded flex items-center mr-auto">
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Topic
                            </button>
                            <button onClick={() => setEditingTopicId(null)} className="text-xs font-bold text-gray-500 px-3 py-1 hover:bg-gray-100 rounded">Cancel</button>
                            <button onClick={() => handleSaveTopic(topic.id)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center">
                              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                            </button>
                         </div>
                      </div>
                    ) : (
                      <div className="relative group/edit">
                        {user?.role === 'professor' && (
                          <button onClick={() => startEditTopic(topic)} className="absolute -top-1 right-0 p-1.5 bg-white border border-gray-100 rounded-lg shadow-sm text-gray-400 hover:text-blue-600 opacity-0 group-hover/edit:opacity-100 transition-all">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <p className="text-gray-700 leading-relaxed font-medium mb-6 pt-4">
                          {topic.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Video placeholder */}
                    <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden group/video shadow-sm cursor-pointer mb-6">
                       <PlayCircle className="w-16 h-16 text-white/80 group-hover/video:text-white group-hover/video:scale-110 transition-all duration-300" />
                       <div className="absolute bottom-4 left-4 text-sm font-bold opacity-80">Video Lesson: {topic.title}</div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6">
                      {/* Topic Quiz button */}
                      {topic.completed && (
                        <Link 
                          to={`/courses/${course.id}/chapters/${chapter.id}/topics/${topic.id}/quiz?from=${encodeURIComponent(window.location.pathname)}`}
                          className="flex items-center bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 shadow-sm transition-all hover:-translate-y-0.5"
                        >
                          <ClipboardList className="w-5 h-5 mr-2" />
                          Take Topic Quiz
                        </Link>
                      )}

                      {user?.role === 'professor' && (
                        <button 
                          onClick={() => handleOpenQuizManager('topic', topic.id)}
                          className="flex items-center bg-white border border-blue-200 text-blue-600 font-bold py-2.5 px-6 rounded-xl hover:bg-blue-50 shadow-sm transition-all"
                        >
                          <Edit3 className="w-5 h-5 mr-2" />
                          Manage Quiz
                        </button>
                      )}
                      
                      <Link 
                        to={`/courses/${course.id}?tab=discussions`}
                        className="flex items-center bg-gray-50 text-gray-700 border border-gray-200 font-bold py-2.5 px-6 rounded-xl hover:bg-gray-100 shadow-sm transition-all"
                      >
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                        Discuss Topic
                      </Link>
                      
                      {!topic.completed && (
                        <div className="flex-1"></div>
                      )}
                      
                      {!topic.completed && (
                        <div>
                          {user?.role === 'professor' ? (
                            <button 
                              onClick={() => markTopicDone(course.id, chapter.id, topic.id)}
                              className="flex items-center bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 shadow-sm transition-all hover:-translate-y-0.5"
                            >
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Mark Topic Done
                            </button>
                          ) : (
                            <p className="text-sm font-bold text-gray-400 italic">Waiting for professor to mark this topic as done.</p>
                          )}
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chapter Quiz Hero Box */}
      <div className={`mt-8 relative overflow-hidden rounded-2xl p-8 border ${allTopicsCompleted ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-500'} shadow-sm transition-all`}>
        {!allTopicsCompleted && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
             <Lock className="w-8 h-8 text-gray-400 mb-2" />
             <p className="font-bold text-gray-500 uppercase tracking-widest text-sm text-center">Complete all topics<br/>to unlock final quiz</p>
           </div>
        )}
        <div className="relative z-0 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-2 flex items-center">
              <Award className={`w-6 h-6 mr-3 ${allTopicsCompleted ? 'text-yellow-400' : 'text-gray-400'}`} />
              Final Chapter Quiz
            </h2>
            <p className={allTopicsCompleted ? 'text-indigo-100 font-medium' : 'text-gray-500 font-medium'}>
              Test your knowledge on everything covered in this chapter.
            </p>
          </div>
          <Link 
             to={allTopicsCompleted && course.user_role !== 'viewer' ? `/courses/${course.id}/chapters/${chapter.id}/quiz?from=${encodeURIComponent(window.location.pathname)}` : "#"}
             className={`px-8 py-3.5 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center ${
               allTopicsCompleted && course.user_role !== 'viewer'
                 ? 'bg-white text-indigo-700 hover:bg-indigo-50 hover:shadow-md hover:-translate-y-0.5' 
                 : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
             }`}
          >
            {course.user_role === 'viewer' ? 'View Only Mode' : 'Start Quiz'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
          {user?.role === 'professor' && (
            <button 
              onClick={() => handleOpenQuizManager('chapter', chapter.id)}
              className="ml-4 px-6 py-3.5 rounded-xl font-bold text-lg bg-indigo-500 text-white hover:bg-indigo-400 transition-all flex items-center border border-indigo-400"
            >
              <Edit3 className="w-5 h-5 mr-2" />
              Manage Final Quiz
            </button>
          )}
        </div>
      </div>

      {/* Chapter specific discussions */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-bold text-gray-900">Chapter Discussions</h2>
          <button 
            onClick={() => setIsDiscussionModalOpen(true)}
            className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            New Discussion
          </button>
        </div>
        <div className="space-y-3">
           {chapterDiscussions.length > 0 ? (
              chapterDiscussions.map(disc => (
                <Link
                  key={disc.id}
                  to={`/courses/${course.id}/discussions/${disc.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex">
                    <div className="flex flex-col items-center justify-center py-4 px-4 bg-gray-50/70 border-r border-gray-100 rounded-l-2xl gap-0.5 min-w-[52px]">
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 rotate-180" />
                      <span className={`text-sm font-black ${(disc.upvotes || 0) > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {disc.upvotes || 0}
                      </span>
                    </div>
                    <div className="flex-1 p-5 min-w-0">
                      {disc.topicId && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1 block">
                          {chapter.topics.find(t => t.id === disc.topicId)?.title || 'Topic'}
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
                  </div>
                </Link>
              ))
           ) : (
              <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-bold">No discussions yet</p>
                <p className="text-gray-400 text-sm mt-1">Start one to get the conversation going!</p>
              </div>
           )}
        </div>
      </div>

      {/* Create Discussion Modal */}
      {isDiscussionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Ask a Question</h2>
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Question Title</label>
                  <input 
                    type="text" 
                    value={newDiscTitle}
                    onChange={(e) => setNewDiscTitle(e.target.value)}
                    required
                    placeholder="e.g. Concept clarification..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Details</label>
                  <textarea 
                    value={newDiscContent}
                    onChange={(e) => setNewDiscContent(e.target.value)}
                    required
                    placeholder="Describe your question in detail..."
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
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Management Modal */}
      {isQuizModalOpen && activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{activeQuiz.title}</h2>
              <button onClick={() => setIsQuizModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
              {/* Question list */}
              <div className="flex-1 space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Questions ({activeQuiz.questions.length})</h3>
                {activeQuiz.questions.map((q: any, i: number) => (
                  <div key={q.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group relative">
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="font-bold text-sm text-gray-900 mb-2">{i+1}. {q.question}</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                       {JSON.parse(q.options).map((opt: string, idx: number) => (
                         <div key={idx} className={`${idx === q.correct_option ? 'text-emerald-600' : 'text-gray-500'}`}>
                           {String.fromCharCode(65+idx)}. {opt}
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
                {activeQuiz.questions.length === 0 && <div className="text-center py-10 text-gray-400 italic font-bold">No questions yet.</div>}
              </div>

              {/* Add/Edit form */}
              <div className="w-full md:w-80 bg-blue-50/30 p-6 rounded-3xl border border-blue-100 shrink-0">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Add New Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Question Text</label>
                    <textarea 
                      value={newQuestion.question} 
                      onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none h-20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Options</label>
                    {newQuestion.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input 
                          type="radio" 
                          name="correct" 
                          checked={newQuestion.correct_option === i}
                          onChange={() => setNewQuestion({...newQuestion, correct_option: i})}
                        />
                        <input 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...newQuestion.options];
                            newOpts[i] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOpts});
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Explanation</label>
                    <input 
                      value={newQuestion.explanation} 
                      onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddQuestion}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
