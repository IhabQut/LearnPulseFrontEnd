import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { useDiscussionStore } from '../store/discussionStore';
import { 
  BookOpen, 
  MessageSquare, 
  ChevronRight, 
  BarChart, 
  Trophy, 
  Target, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { API_BASE } from '../lib/api';
import { StatCard } from '../components/Dashboard/StatCard';
import { motion } from 'framer-motion';

type LeaderboardEntry = {
  id: string;
  student: string;
  points: number;
  rank: number;
};

type AnalyticsData = {
  quiz_attempts: any[];
  recommended_topics: any[];
  overall_progress: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses } = useCourseStore();
  const { discussions } = useDiscussionStore();
  const [coursePoints, setCoursePoints] = useState<Record<string, { rank: number; points: number; total: number }>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    document.title = 'Dashboard | AI Learning Hub';
    
    if (user && user.role === 'student') {
      // Fetch Course Leaderboards
      if (courses.length > 0) {
        courses.forEach(async (course) => {
          try {
            const res = await fetch(`${API_BASE}/api/courses/${course.id}/leaderboard`);
            const data: LeaderboardEntry[] = await res.json();
            const me = data.find(e => e.id === user.id);
            setCoursePoints(prev => ({
              ...prev,
              [course.id]: {
                rank: me?.rank || data.length + 1,
                points: me?.points || 0,
                total: data.length
              }
            }));
          } catch {}
        });
      }

      // Fetch Student Analytics
      fetch(`${API_BASE}/api/analytics/student/${user.id}`)
        .then(res => res.json())
        .then(data => setAnalytics(data))
        .catch(err => console.error("Failed to fetch analytics", err));
    }
  }, [user, courses]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Welcome to AI Learning Hub</h1>
        <p className="text-gray-500 font-medium max-w-md mx-auto">Log in as a student or professor to get started.</p>
      </div>
    );
  }

  const totalTopics = courses.reduce((a, c) => a + c.chapters.reduce((b: number, ch: any) => b + (ch.topics?.length || 0), 0), 0);
  const completedTopics = courses.reduce((a, c) => a + c.chapters.reduce((b: number, ch: any) => b + (ch.topics?.filter((t: any) => t.completed)?.length || 0), 0), 0);
  const recentDiscussions = discussions.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 px-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg shadow-indigo-900/10 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Welcome back, {user.name}! 👋</h1>
          <p className="text-blue-100 font-medium">
            {user.role === 'student'
              ? `You've completed ${completedTopics} of ${totalTopics} topics. You're in the top ${Math.min(100, Math.round((1 - (analytics?.overall_progress || 0)/100) * 100))}% of students!`
              : `You have ${courses.length} active courses.`
            }
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Courses" value={courses.length} color="blue" 
        onClick={() => navigate('/courses')}/>
        {user.role === 'student' && (
          <>
            <StatCard icon={<Trophy className="w-5 h-5" />} label="Points" value={Object.values(coursePoints).reduce((a, b) => a + b.points, 0)} color="amber" 
            onClick={() => navigate('/profile')}/>
            <StatCard icon={<Target className="w-5 h-5" />} label="Progress" value={`${analytics?.overall_progress || 0}%`} color="emerald" 
            onClick={() => navigate('/courses')}/>
            <StatCard icon={<Zap className="w-5 h-5" />} label="Notifications" value={0} color="indigo" 
            onClick={() => navigate('/notifications')}/>
          </>
        )}
        {user.role === 'professor' && (
          <>
            <Link to="/admin" className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform"><BarChart className="w-5 h-5" /></div>
              <span className="text-sm font-extrabold text-gray-900">Admin Panel</span>
            </Link>
            <Link to="/admin/analytics" className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform"><BarChart className="w-5 h-5" /></div>
              <span className="text-sm font-extrabold text-gray-900">AI Analytics</span>
            </Link>
          </>
        )}
      </div>

      {user.role === 'student' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Analytics Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <BarChart className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-gray-900">Quiz Performance</h2>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last {analytics.quiz_attempts.length} attempts</span>
            </div>

            <div className="h-48 flex items-end gap-3 px-2">
              {analytics.quiz_attempts.length === 0 ? (
                <div className="w-full flex items-center justify-center text-gray-400 text-sm italic">
                  Complete your first quiz to see analytics!
                </div>
              ) : (
                analytics.quiz_attempts.slice(-8).map((attempt, i) => {
                  const pct = (attempt.score / attempt.total) * 100;
                  return (
                    <div key={attempt.id} className="flex-1 flex flex-col items-center gap-2 group transition-all">
                      <div className="relative w-full flex flex-col items-center">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          className={`w-full max-w-[24px] rounded-t-lg shadow-sm transition-colors ${
                            pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                          } group-hover:brightness-110`}
                        />
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                          {attempt.score}/{attempt.total} ({Math.round(pct)}%)
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 truncate w-full text-center">
                        {attempt.quiz_title.split(' ').slice(0, 1)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recommended Next Topics */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-16 h-16 text-blue-600" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-gray-900">Recommended Next</h2>
            </div>

            <div className="space-y-4">
              {analytics.recommended_topics.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl">
                  <p className="text-sm text-gray-600 font-medium">You're all caught up! Meta-learner status achieved. 🚀</p>
                </div>
              ) : (
                analytics.recommended_topics.slice(0, 3).map((rec, i) => (
                  <Link 
                    key={rec.topic_id} 
                    to={`/courses/${rec.course_id}/chapters/${rec.chapter_id}`}
                    className="flex items-center p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 group-hover:text-blue-700">
                        {rec.course_title}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 truncate">{rec.topic_title}</h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))
              )}
            </div>
            
            {analytics.recommended_topics.length > 0 && (
              <button className="w-full mt-6 py-3 px-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                Continue Learning
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Course Progress / Points */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">
              {user.role === 'student' ? 'Your Progress' : 'Your Courses'}
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {courses.slice(0, 4).map(course => {
              const topics = course.chapters.flatMap((ch: any) => ch.topics || []);
              const done = topics.filter((t: any) => t.completed).length;
              const pct = topics.length > 0 ? Math.round(done / topics.length * 100) : 0;
              const cp = coursePoints[course.id];

              return (
                <Link key={course.id} to={`/courses/${course.id}`} className="p-6 flex items-center hover:bg-gray-50/50 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-xs text-gray-500">{course.chapters.length} chapters</p>
                    {user.role === 'student' && (
                      <div className="flex items-center mt-3 gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="h-full bg-blue-600 rounded-full"
                          ></motion.div>
                        </div>
                        <span className="text-xs font-bold text-gray-900 shrink-0">{pct}%</span>
                      </div>
                    )}
                  </div>
                  {user.role === 'student' && cp && (
                    <div className="ml-4 text-right shrink-0">
                      <div className="text-sm font-extrabold text-amber-600">{cp.points} pts</div>
                      <div className="text-xs text-gray-500">Rank #{cp.rank}</div>
                    </div>
                  )}
                </Link>
              );
            })}
            {courses.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-400 font-medium">No courses yet. Explore our catalog!</p>
                <Link to="/courses" className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold inline-block hover:bg-blue-100 transition-all">Explore</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Discussions */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-[#SAME%]">
          <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Discussions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentDiscussions.map((disc: any) => (
              <div key={disc.id} className="p-6 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{disc.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-1 mb-3">{disc.content}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[8px]">{disc.author[0]}</div>
                    <span>{disc.author}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {disc.replies}</span>
                    <span>{disc.date}</span>
                  </div>
                </div>
              </div>
            ))}
            {recentDiscussions.length === 0 && (
              <div className="p-12 text-center text-gray-400 font-medium whitespace-nowrap">No discussions yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
