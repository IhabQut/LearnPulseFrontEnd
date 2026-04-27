import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDiscussionStore } from '../store/discussionStore';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { apiFetch } from '../lib/api';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Image as ImageIcon,
  Send,
  X,
  AtSign,
  Clock,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Award,
  Sparkles
} from 'lucide-react';

export default function DiscussionThread() {
  const { courseId, discussionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses } = useCourseStore();
  const {
    currentDiscussion,
    fetchDiscussion,
    addReply,
    setVote,
    setReplyVote,
    awardPoints,
  } = useDiscussionStore();

  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [pointsUserId, setPointsUserId] = useState<string | null>(null);
  const [pointsAmount, setPointsAmount] = useState(5);
  const [courseStudents, setCourseStudents] = useState<{id: string, name: string}[]>([]);
  const [mentionCoords, setMentionCoords] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const course = courses.find(c => c.id === courseId);

  useEffect(() => {
    if (discussionId) {
      fetchDiscussion(discussionId, user?.id);
    }
  }, [discussionId, fetchDiscussion, user?.id]);

  useEffect(() => {
    document.title = currentDiscussion
      ? `${currentDiscussion.title} | Discussion`
      : 'Discussion | LearnPulse';
  }, [currentDiscussion]);

  useEffect(() => {
    if (courseId) {
      apiFetch<any[]>(`/api/courses/${courseId}/students`)
        .then(data => {
          if (Array.isArray(data)) {
            setCourseStudents(data.map((s: any) => ({ id: s.id, name: s.name })));
          } else {
            setCourseStudents([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch course students:", err);
          setCourseStudents([]);
        });
    }
  }, [courseId]);

  // Helper to get caret coordinates (mirror div strategy)
  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);
    
    // Copy essential styles
    const properties = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent',
      'textDecoration', 'letterSpacing', 'wordSpacing'
    ];
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    
    properties.forEach(prop => {
      // @ts-ignore
      div.style[prop] = style[prop];
    });
    
    // For some reason, some properties are not copied correctly by style[prop]
    div.style.width = style.width;
    
    document.body.appendChild(div);
    
    // Split text at cursor
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    
    const coordinates = {
      x: span.offsetLeft + parseInt(style.borderLeftWidth),
      y: span.offsetTop + parseInt(style.borderTopWidth)
    };
    
    document.body.removeChild(div);
    return coordinates;
  };

  // Handle @mention detection in textarea (Enhanced to follow cursor)
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);
    
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    
    // Improved detection: find the last '@' that is either at the start or preceded by a space
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if it's a valid mention start (start of text or preceded by space)
      const prevChar = textBeforeCursor[lastAtIndex - 1];
      if (!prevChar || /\s/.test(prevChar)) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        // Only trigger if there are no spaces in the query part
        if (!/\s/.test(query)) {
          setShowMentions(true);
          setMentionQuery(query.toLowerCase());
          
          // Calculate coordinates for the menu
          const coords = getCaretCoordinates(e.target, lastAtIndex);
          setMentionCoords({
            x: coords.x,
            y: coords.y - e.target.scrollTop
          });
          return;
        }
      }
    }
    
    setShowMentions(false);
  }, []);

  const insertMention = (name: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBefore = replyText.slice(0, cursor);
    
    // Find where the current mention segment starts
    const lastAtIndex = textBefore.lastIndexOf('@');
    if (lastAtIndex === -1) return;

    const textAfter = replyText.slice(cursor);
    const replacedBefore = replyText.slice(0, lastAtIndex) + `@${name} `;
    
    setReplyText(replacedBefore + textAfter);
    setShowMentions(false);
    
    // Set cursor position after the inserted name
    setTimeout(() => {
        if (textareaRef.current) {
            const newPos = replacedBefore.length;
            textareaRef.current.setSelectionRange(newPos, newPos);
            textareaRef.current.focus();
        }
    }, 0);
  };

  // User list for mentions (Students in course + Everyone if professor)
  const allMentionableUsers = [
    ...(currentDiscussion ? [
        { id: currentDiscussion.authorId, name: currentDiscussion.author },
        ...currentDiscussion.replyList
          .filter((r, i, arr) => arr.findIndex(x => x.authorId === r.authorId) === i)
          .map(r => ({ id: r.authorId, name: r.author }))
      ] : []),
    ...courseStudents
  ].filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i);

  if (user?.role === 'professor') {
    allMentionableUsers.unshift({ id: 'everyone', name: 'everyone' });
  }

  const filteredMentions = allMentionableUsers.filter(u =>
    u.name.toLowerCase().includes(mentionQuery)
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReplyImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyText.trim() && !replyImage) || !user || !discussionId) return;

    setSubmitting(true);
    await addReply(discussionId, {
      author: user.name,
      authorId: user.id,
      text: replyText,
      image: replyImage,
      role: user.role as 'student' | 'professor',
    });
    setReplyText('');
    setReplyImage(null);
    setSubmitting(false);
    // Refresh the discussion to get canon data
    await fetchDiscussion(discussionId, user.id);
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVoteDiscussion = (type: number) => {
    if (!currentDiscussion || !user) return;
    const newVote = currentDiscussion.userVote === type ? 0 : type;
    setVote(user.id, currentDiscussion.id, newVote);
  };

  const handleVoteReply = (replyId: string, type: number) => {
    if (!currentDiscussion || !user) return;
    const reply = currentDiscussion.replyList.find(r => r.id === replyId);
    if (!reply) return;
    const newVote = reply.userVote === type ? 0 : type;
    setReplyVote(user.id, currentDiscussion.id, replyId, newVote);
  };

  const handleAwardPoints = async () => {
    if (!pointsUserId || !discussionId) return;
    await awardPoints(discussionId, pointsUserId, pointsAmount);
    setPointsUserId(null);
    setPointsAmount(5);
  };

  // Render @mentions with highlight styling
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const name = part.slice(1);
        if (name === 'everyone') {
          return (
            <span key={i} className="bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded border border-amber-200">
              {part}
            </span>
          );
        }
        const mentioned = allMentionableUsers.find(u => u.name === name);
        return (
          <Link
            key={i}
            to={mentioned ? `/profile/${mentioned.id}` : '#'}
            className="text-blue-600 font-bold hover:underline bg-blue-50 px-1 rounded"
          >
            {part}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!currentDiscussion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full" />
          <p className="text-gray-500 font-medium">Loading discussion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <div className="pt-6 pb-4 flex items-center gap-3 text-sm text-gray-500 font-medium">
        <button
          onClick={() => navigate(courseId ? `/courses/${courseId}` : '/')}
          className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-gray-300">/</span>
        {course && (
          <>
            <Link to={`/courses/${courseId}`} className="hover:text-blue-600 transition-colors">
              {course.title}
            </Link>
            <span className="text-gray-300">/</span>
          </>
        )}
        <span className="text-gray-900 font-bold truncate">Discussion</span>
      </div>

      {/* ─── Original Post (OP) ─── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex">
          {/* Upvote Sidebar */}
          <div className="flex flex-col items-center py-6 px-4 bg-gray-50/70 border-r border-gray-100 gap-1">
            <button
              onClick={() => handleVoteDiscussion(1)}
              className={`p-2 rounded-xl transition-all ${
                currentDiscussion.userVote === 1
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-200 text-gray-400'
              }`}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <span className={`text-sm font-black ${
              (currentDiscussion.upvotes || 0) > 0 ? 'text-blue-600' : (currentDiscussion.upvotes || 0) < 0 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {currentDiscussion.upvotes || 0}
            </span>
            <button
              onClick={() => handleVoteDiscussion(-1)}
              className={`p-2 rounded-xl transition-all ${
                currentDiscussion.userVote === -1
                  ? 'bg-red-100 text-red-500'
                  : 'hover:bg-gray-200 text-gray-400'
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Tag */}
            {course && (
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {course.title}
                </span>
              </div>
            )}

            <h1 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">
              {currentDiscussion.title}
            </h1>

            {/* Author Meta */}
            <div className="flex items-center gap-3 mb-5">
              <Link
                to={`/profile/${currentDiscussion.authorId}`}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm hover:shadow-md transition-shadow"
              >
                {currentDiscussion.author.charAt(0).toUpperCase()}
              </Link>
              <div>
                <Link
                  to={`/profile/${currentDiscussion.authorId}`}
                  className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                >
                  {currentDiscussion.author}
                </Link>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {currentDiscussion.date}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap mb-4">
              {renderTextWithMentions(currentDiscussion.content)}
            </div>

            {/* Attached Image */}
            {currentDiscussion.image && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img
                  src={currentDiscussion.image}
                  alt="Discussion attachment"
                  className="w-full max-h-[500px] object-contain bg-gray-50"
                />
              </div>
            )}

            {/* Footer stats */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500 font-bold">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {currentDiscussion.replies} {currentDiscussion.replies === 1 ? 'reply' : 'replies'}
              </span>
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                {currentDiscussion.upvotes || 0} upvotes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Replies Section ─── */}
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            {currentDiscussion.replies} {currentDiscussion.replies === 1 ? 'Reply' : 'Replies'}
          </h2>
        </div>

        {currentDiscussion.replyList.length === 0 && (
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">No replies yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to join this discussion!</p>
          </div>
        )}

        {currentDiscussion.replyList.map((reply, idx) => (
          <div
            key={reply.id}
            className={`bg-white border border-gray-100 rounded-2xl overflow-hidden mb-3 hover:shadow-sm transition-all ${
              idx === 0 ? '' : ''
            }`}
          >
            <div className="flex">
              {/* Reply Upvote Sidebar */}
              <div className="flex flex-col items-center py-4 px-3 bg-gray-50/50 border-r border-gray-50 gap-0.5">
                <button
                  onClick={() => handleVoteReply(reply.id, 1)}
                  className={`p-1.5 rounded-lg transition-all ${
                    reply.userVote === 1
                      ? 'bg-blue-100 text-blue-600'
                      : 'hover:bg-gray-200 text-gray-400'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className={`text-xs font-black ${
                  (reply.upvotes || 0) > 0 ? 'text-blue-600' : (reply.upvotes || 0) < 0 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {reply.upvotes || 0}
                </span>
                <button
                  onClick={() => handleVoteReply(reply.id, -1)}
                  className={`p-1.5 rounded-lg transition-all ${
                    reply.userVote === -1
                      ? 'bg-red-100 text-red-500'
                      : 'hover:bg-gray-200 text-gray-400'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Reply Content */}
              <div className="flex-1 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/profile/${reply.authorId}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm hover:shadow-md transition-shadow ${
                        reply.role === 'professor'
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                          : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
                      }`}
                    >
                      {reply.author.charAt(0).toUpperCase()}
                    </Link>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${reply.authorId}`}
                          className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                        >
                          {reply.author}
                        </Link>
                        {reply.role === 'professor' && (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200">
                            Professor
                          </span>
                        )}
                        {reply.authorId === currentDiscussion.authorId && (
                          <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-blue-100">
                            OP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />{reply.date}
                      </p>
                    </div>
                  </div>

                  {/* Award Points (Professor Only) */}
                  {user?.role === 'professor' && reply.role === 'student' && (
                    <button
                      onClick={() => setPointsUserId(pointsUserId === reply.authorId ? null : reply.authorId)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      title="Award points"
                    >
                      <Award className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Points Award Inline */}
                {pointsUserId === reply.authorId && (
                  <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(parseInt(e.target.value) || 1)}
                      className="w-16 bg-white border border-amber-200 rounded-lg px-2 py-1 text-sm font-bold text-amber-800 text-center"
                    />
                    <span className="text-xs text-amber-700 font-bold">pts</span>
                    <button
                      onClick={handleAwardPoints}
                      className="ml-auto bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Award
                    </button>
                    <button
                      onClick={() => setPointsUserId(null)}
                      className="text-amber-400 hover:text-amber-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {renderTextWithMentions(reply.text)}
                </div>

                {reply.image && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                    <img
                      src={reply.image}
                      alt="Reply attachment"
                      className="w-full max-h-[400px] object-contain bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={repliesEndRef} />
      </div>

      {/* ─── Reply Composer ─── */}
      {user && (
        <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Write a Reply
            </h3>
          </div>

          <form onSubmit={handleSubmitReply} className="p-5 space-y-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={handleTextChange}
                placeholder="Share your thoughts... Use @name to mention someone"
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              />

              {/* Mention Dropdown - Correctly Positioned at Caret */}
              {showMentions && filteredMentions.length > 0 && (
                <div 
                  className="absolute bg-white/80 backdrop-blur-xl border border-white/40 rounded-[28px] shadow-2xl shadow-blue-500/10 overflow-hidden z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-300"
                  style={{
                    left: `${mentionCoords.x}px`,
                    top: `${mentionCoords.y + 24}px`, // Offset by text height
                  }}
                >
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mention a User</p>
                    <AtSign className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {filteredMentions.map(u => {
                      const isEveryone = u.id === 'everyone';
                      const isProfessor = u.name.toLowerCase().includes('prof') || (u as any).role === 'professor'; // Heuristic if role not in u
                      
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => insertMention(u.name)}
                          className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-blue-50/50 transition-all text-left group"
                        >
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 ${
                            isEveryone 
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200' 
                              : isProfessor
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {isEveryone ? <Sparkles className="w-4 h-4" /> : u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                {u.name}
                              </span>
                              {isProfessor && (
                                <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Pro</span>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-gray-400 truncate">
                              {isEveryone ? 'Notify everyone in course' : 'Member'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Image Preview */}
            {replyImage && (
              <div className="relative inline-block rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img src={replyImage} alt="attachment preview" className="max-h-48 object-contain" />
                <button
                  type="button"
                  onClick={() => setReplyImage(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Attach Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyText(prev => prev + '@');
                    textareaRef.current?.focus();
                    setShowMentions(true);
                    setMentionQuery('');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all"
                >
                  <AtSign className="w-3.5 h-3.5" />
                  Mention
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || (!replyText.trim() && !replyImage)}
                className="flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
