import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  Plus, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  Laptop,
  Briefcase,
  Palette,
  Globe,
  Beaker,
  Filter
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../lib/api';

type EnrollmentStatus = 'none' | 'pending' | 'approved';

const INDUSTRIES = [
  { id: 'all', label: 'All Industries', icon: Filter },
  { id: 'Computer Science', label: 'Tech & CS', icon: Laptop },
  { id: 'Business', label: 'Business', icon: Briefcase },
  { id: 'Design', label: 'Design', icon: Palette },
  { id: 'Marketing', label: 'Marketing', icon: Globe },
  { id: 'Science', label: 'Science', icon: Beaker },
];

export default function Courses() {
  const { courses, fetchCourses } = useCourseStore();
  const { user } = useAuthStore();
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [enrollments, setEnrollments] = useState<Record<string, EnrollmentStatus>>({});
  const [requesting, setRequesting] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    document.title = 'Explore Courses | LearnPulse';
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

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = 
        c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        c.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [courses, debouncedSearch, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[40px] bg-gray-900 border border-white/5 p-12 text-white">
        <div className="absolute top-0 right-0 -m-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl font-black tracking-tight mb-4 leading-tight">
            Elevate Your <span className="text-blue-500">Skills</span> With AI-Powered Learning
          </h1>
          <p className="text-gray-400 text-lg font-medium">
            Discover precision-engineered courses tailored for the modern industry. 
            Real-time feedback, shared discussions, and expert mentorship.
          </p>
        </div>

        {/* Global Stats or Search integration could go here */}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm sticky top-4 z-30">
        {/* Industry Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar w-full xl:w-auto">
          {INDUSTRIES.map((industry) => {
            const Icon = industry.icon;
            return (
              <button
                key={industry.id}
                onClick={() => setSelectedCategory(industry.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === industry.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {industry.label}
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by title or topic..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          {user?.role === 'professor' && (
            <Link 
              to="/courses/create" 
              className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Start New Course</span>
            </Link>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredCourses.map(course => {
          const totalTopics = course.chapters.reduce((acc, ch: any) => acc + (ch.topics?.length || 0), 0);
          const completedTopics = course.chapters.reduce((acc, ch: any) => acc + (ch.topics?.filter((t: any) => t.completed).length || 0), 0);
          const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
          
          const status = enrollments[course.id] || 'none';
          const isEnrolled = status === 'approved';
          const isPending = status === 'pending';
          const canAccess = isEnrolled || user?.role === 'professor';

          return (
            <div key={course.id} className="group">
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500 flex flex-col h-full overflow-hidden">
                {/* Visual Header */}
                <div className="h-48 relative overflow-hidden bg-gray-100">
                  {course.image ? (
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700" />
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                      {course.category || 'Professional'}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    {isEnrolled && (
                      <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border border-white/20 animate-in zoom-in duration-300">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                    {!course.is_open && (
                      <div className="bg-gray-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[9px] font-black uppercase">Admission Closed</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-5 flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                        {course.chapters.length}
                      </div>
                    </div>
                    <span className="text-white text-[10px] font-black uppercase tracking-[0.1em] drop-shadow-md">
                      Modules Available
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-6 flex-1">{course.description}</p>

                  <div className="space-y-6">
                    {/* Student Stats Integration */}
                    {user?.role === 'student' && isEnrolled && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-black">
                          <span className="text-gray-400 uppercase tracking-widest">Mastery</span>
                          <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/50">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {canAccess ? (
                        <Link 
                          to={`/courses/${course.id}`} 
                          className="flex-1 bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-gray-100 hover:shadow-blue-100"
                        >
                          Launch Course
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button 
                          onClick={() => handleRequestJoin(course.id)}
                          disabled={requesting === course.id || !course.is_open}
                          className={`flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                            isPending 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100 cursor-default' 
                              : !course.is_open
                                ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                          }`}
                        >
                          {requesting === course.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : isPending ? (
                            <>
                              <Clock className="w-4 h-4" />
                              Pending Approval
                            </>
                          ) : !course.is_open ? (
                            'Join Request Disabled'
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Apply to Join
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-32 bg-white rounded-[40px] border border-gray-100 border-dashed">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No results for "{debouncedSearch}"</h3>
          <p className="text-gray-500 font-medium">Try broadening your industry filter or using different keywords.</p>
          <button 
            onClick={() => { setSearch(''); setSelectedCategory('all'); }}
            className="mt-8 text-blue-600 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
