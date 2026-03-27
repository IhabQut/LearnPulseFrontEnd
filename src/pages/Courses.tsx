import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search, Plus, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../lib/api';

type EnrollmentStatus = 'none' | 'pending' | 'approved';

export default function Courses() {
  const { courses, fetchCourses } = useCourseStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [enrollments, setEnrollments] = useState<Record<string, EnrollmentStatus>>({});
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Courses | AI Learning Hub';
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetch(`${API_BASE}/api/users/${user.id}/enrollments`)
        .then(r => r.json())
        .then((data: { course_id: string; status: string }[]) => {
          const mapping: Record<string, EnrollmentStatus> = {};
          data.forEach(req => {
            mapping[req.course_id] = req.status as EnrollmentStatus;
          });
          setEnrollments(mapping);
        })
        .catch(console.error);
    }
  }, [user]);

  const handleRequestJoin = async (courseId: string) => {
    if (!user) return;
    setRequesting(courseId);
    try {
      const res = await fetch(`${API_BASE}/api/courses/${courseId}/request-join?user_id=${encodeURIComponent(user.id)}`, {
        method: 'POST'
      });
      if (res.ok) {
        setEnrollments(prev => ({ ...prev, [courseId]: 'pending' }));
      }
    } catch (err) {
      console.error("Failed to request join:", err);
    } finally {
      setRequesting(null);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Explore Courses</h1>
          <p className="text-gray-500 font-medium mt-1">Browse our ecosystem of AI-enhanced learning.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
            />
          </div>
          {user?.role === 'professor' && (
            <Link to="/admin" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Create Course
            </Link>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const totalTopics = course.chapters.reduce((acc, ch: any) => acc + (ch.topics?.length || 0), 0);
          const completedTopics = course.chapters.reduce((acc, ch: any) => acc + (ch.topics?.filter((t: any) => t.completed).length || 0), 0);
          const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
          
          const status = enrollments[course.id] || 'none';
          const isEnrolled = status === 'approved';
          const isPending = status === 'pending';
          const canAccess = isEnrolled || user?.role === 'professor';

          return (
            <div key={course.id} className="block group">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden h-full flex flex-col">
                {/* Card Header Gradient */}
                <div className="h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTEwIDBMMjAgMTBMMTAgMjBMMCAxMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-40"></div>
                  <div className="absolute bottom-4 left-5 flex items-center space-x-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white/80 text-xs font-bold uppercase tracking-wider">
                      {course.chapters.length} Chapters • {totalTopics} Topics
                    </span>
                  </div>
                  {isEnrolled && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{course.description}</p>

                  {/* Progress / Status */}
                  {user?.role === 'student' && (
                    <div className="mt-auto space-y-4">
                      {isEnrolled ? (
                        <div>
                          <div className="flex justify-between items-center text-xs mb-2 font-bold text-gray-700">
                            <span className="uppercase tracking-wider text-gray-500">Progress</span>
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200/50">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : isPending ? (
                        <div className="bg-amber-50 rounded-xl p-3 flex items-center border border-amber-100">
                           <Clock className="w-4 h-4 text-amber-500 mr-2" />
                           <span className="text-xs font-bold text-amber-700">Request Pending Approval</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleRequestJoin(course.id)}
                          disabled={requesting === course.id}
                          className="w-full bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                          {requesting === course.id ? (
                            <Clock className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                          )}
                          Request to Join
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-50">
                    {canAccess ? (
                      <Link to={`/courses/${course.id}`} className="text-sm font-bold text-blue-600 flex items-center group-hover:translate-x-1 transition-transform">
                        Enter Course <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    ) : (
                      <span className="text-sm font-bold text-gray-300 flex items-center">
                        Locked <AlertCircle className="w-4 h-4 ml-1" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Courses Found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or browse available categories.</p>
        </div>
      )}
    </div>
  );
}
