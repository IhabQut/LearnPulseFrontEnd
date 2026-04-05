import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  BookOpen,
  LayoutDashboard
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../lib/api';

export default function MyCourses() {
  const { courses, fetchCourses } = useCourseStore();
  const { user } = useAuthStore();
  
  const [search, setSearch] = useState('');
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Courses | LearnPulse';
    fetchCourses().then(() => setLoading(false));
  }, [fetchCourses]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetch(`${API_BASE}/api/users/${user.id}/enrollments`)
        .then(r => r.json())
        .then((data: { course_id: string; status: string }[]) => {
          // Only approved enrollments
          setEnrollments(data.filter(e => e.status === 'approved').map(e => e.course_id));
        })
        .catch(console.error);
    }
  }, [user]);

  const myCourses = useMemo(() => {
    if (!user) return [];
    
    return courses.filter(c => {
      // If user_role is present (from backend), use it. 
      // Otherwise fallback to global role if they are the owner.
      const hasCourseRole = !!c.user_role;
      const isOwner = user.role === 'professor' && c.professor_id === user.id;
      const isEnrolled = enrollments.includes(c.id);
      
      const isMine = hasCourseRole || isOwner || isEnrolled;
        
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                           c.description.toLowerCase().includes(search.toLowerCase());
                           
      return isMine && matchesSearch;
    });
  }, [courses, user, enrollments, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">My Learning Journey</h1>
          <p className="text-gray-500 font-medium">
            {user?.role === 'professor' 
              ? 'Manage the courses you have created and track student progress.'
              : 'Continue where you left off in your enrolled courses.'}
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search my courses..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Course Grid */}
      {myCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myCourses.map(course => {
             const totalTopics = course.chapters.reduce((acc, ch: any) => acc + (ch.topics?.length || 0), 0);
             const completedTopics = course.chapters.reduce((acc, ch: any) => acc + (ch.topics?.filter((t: any) => t.completed).length || 0), 0);
             const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            return (
              <div key={course.id} className="group">
                <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full overflow-hidden">
                  <div className="h-40 relative overflow-hidden bg-gray-100">
                    {course.image ? (
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                       <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-white/20">
                         <span className="text-[9px] font-black uppercase tracking-widest text-blue-700">{course.category}</span>
                       </div>
                       {course.user_role && (
                         <div className="bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-white/10">
                           <span className="text-[9px] font-black uppercase tracking-widest text-white">{course.user_role}</span>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{course.title}</h3>
                    
                    {user?.role === 'student' && (
                      <div className="mt-auto space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-blue-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-50 rounded-full h-1 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <Link 
                          to={`/courses/${course.id}`}
                          className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-sm"
                        >
                          Continue Learning
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {user?.role === 'professor' && (
                      <div className="mt-auto pt-4">
                        <Link 
                          to={`/courses/${course.id}`}
                          className="w-full bg-blue-50 text-blue-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                        >
                          Manage Course
                          <LayoutDashboard className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[40px] border border-gray-100 border-dashed">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500 font-medium">
            {search ? 'No courses match your search criteria.' : (user?.role === 'professor' ? 'You haven\'t created any courses yet.' : 'You haven\'t enrolled in any courses yet.')}
          </p>
          {!search && (
            <Link 
              to="/registrations"
              className="mt-8 inline-block bg-blue-600 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              Explore Registrations
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
