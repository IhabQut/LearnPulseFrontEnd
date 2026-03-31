import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Search, Plus, Filter, Clock, CheckCircle, ChevronRight, UserPlus, Sparkles, Beaker, Code, Briefcase, Globe, Cpu, Languages, FlaskConical, Users
} from 'lucide-react';
import { API_BASE } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';

const INDUSTRIES = [
  { id: 'all', label: 'All Industries', icon: Globe },
  { id: 'cs', label: 'Computer Science', icon: Code },
  { id: 'business', label: 'Business & Management', icon: Briefcase },
  { id: 'engineering', label: 'Engineering', icon: Cpu },
  { id: 'health', label: 'Health & Medicine', icon: CheckCircle },
  { id: 'science', label: 'Natural Sciences', icon: Beaker },
  { id: 'humanities', label: 'Humanities & Art', icon: Languages },
  { id: 'research', label: 'Advanced Research', icon: FlaskConical },
];

export default function Registrations() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/api/courses`),
        fetch(`${API_BASE}/api/enrollments/my-status?user_id=${user?.id}`)
      ]);
      const cData = await cRes.json();
      const eData = await eRes.json();
      setCourses(cData);
      setEnrollments(eData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRequestJoin = async (courseId: string) => {
    setRequesting(courseId);
    try {
      await fetch(`${API_BASE}/api/enrollments/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, course_id: courseId })
      });
      setEnrollments(prev => ({ ...prev, [courseId]: 'pending' }));
    } catch (err) {
      console.error(err);
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
      const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'open' && c.is_open) || (selectedStatus === 'closed' && !c.is_open);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [courses, debouncedSearch, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedStatus]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 font-black tracking-widest text-xs uppercase animate-pulse">Scanning Course Catalog...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      {/* Hero Header - Premium Glassmorphism */}
      <div className="relative overflow-hidden rounded-[48px] bg-gray-900 border border-white/5 p-16 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -m-20 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">New Semester Admissions Open</span>
          </div>
          <h1 className="text-6xl font-black tracking-tight mb-6 leading-[1.1]">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Competitive</span> Advantage
          </h1>
          <p className="text-gray-400 text-xl font-medium leading-relaxed">
            Browse our curated selection of industry-aligned courses. 
            Real-time collaboration, expert-led sessions, and AI-assisted learning paths.
          </p>
        </div>
      </div>

      {/* Control Bar - High Contrast */}
      <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between bg-white/70 backdrop-blur-xl p-6 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/20 sticky top-4 z-30 transition-all">
        
        <div className="flex items-center gap-4 w-full xl:w-auto">
          {/* Filter Popover */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-3 px-6 py-4 rounded-3xl text-sm font-black transition-all border shadow-sm active:scale-95 ${
                isFilterOpen || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
                  : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Course Filters
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute top-full left-0 mt-4 w-80 bg-white border border-gray-100 shadow-2xl rounded-[40px] p-8 z-50 animate-in zoom-in-95 duration-200 origin-top-left">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pl-1">Professional Industry</label>
                      <div className="grid grid-cols-1 gap-2">
                        {INDUSTRIES.map(ind => (
                          <button
                            key={ind.id}
                            onClick={() => setSelectedCategory(ind.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                              selectedCategory === ind.id 
                                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'
                            }`}
                          >
                            <ind.icon className="w-3.5 h-3.5" />
                            {ind.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pl-1">Admission Status</label>
                      <div className="flex flex-col gap-2">
                        {['all', 'open', 'closed'].map(st => (
                          <button
                            key={st}
                            onClick={() => setSelectedStatus(st)}
                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border text-left capitalize ${
                              selectedStatus === st
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'
                            }`}
                          >
                            {st === 'all' ? 'Every Course' : `${st} for Admission`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative flex-1 xl:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search title, industry or module..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-[24px] pl-14 pr-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder-gray-400"
            />
          </div>
        </div>
        
        {user?.role === 'professor' && (
          <Link 
            to="/courses/create" 
            className="bg-gray-900 text-white px-8 py-4 rounded-[24px] text-sm font-black shadow-2xl shadow-gray-200 hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Course</span>
          </Link>
        )}
      </div>

      {/* Course Rows - Table-like Layout */}
      <div className="space-y-6">
        <div className="hidden lg:grid grid-cols-12 px-10 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
          <div className="col-span-5">Course Detail</div>
          <div className="col-span-2 text-center text-blue-500">Industry</div>
          <div className="col-span-2 text-center">Engagement</div>
          <div className="col-span-3 text-right">Access Control</div>
        </div>

        {paginatedCourses.map(course => {
          const status = enrollments[course.id] || 'none';
          const isEnrolled = status === 'approved';
          const isPending = status === 'pending';
          const canAccess = isEnrolled || user?.role === 'professor';

          return (
            <div key={course.id} className="group relative">
              <div className="bg-white rounded-[40px] border border-gray-100 p-6 lg:p-4 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] hover:border-blue-100 transition-all duration-500 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-0">
                
                {/* Course Main Info */}
                <div className="lg:col-span-5 flex items-center gap-6">
                  <div className="w-24 h-24 lg:w-32 lg:h-24 rounded-3xl overflow-hidden bg-gray-100 shrink-0 shadow-inner">
                    {course.image ? (
                      <img src={course.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600" />
                    )}
                  </div>
                  <div className="min-w-0 pr-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">{course.instructorName}</div>
                    <h3 className="text-xl font-black text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-sm text-gray-500 font-medium line-clamp-1 lg:line-clamp-2 leading-relaxed">{course.description}</p>
                  </div>
                </div>

                {/* Industry */}
                <div className="lg:col-span-2 flex justify-center">
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                    {course.category || 'Core Science'}
                  </span>
                </div>

                {/* Engagement */}
                <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-center border-x border-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-black text-gray-900">{course.student_count || 0}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Enrolled Minds</span>
                </div>

                {/* Actions */}
                <div className="lg:col-span-3 flex items-center justify-end gap-3">
                  {!course.is_open && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl text-gray-400 mr-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase">Waitlist</span>
                    </div>
                  )}

                  {canAccess ? (
                    <Link 
                      to={`/courses/${course.id}`} 
                      className="bg-gray-900 text-white px-8 py-4 rounded-3xl text-sm font-black flex items-center gap-2 hover:bg-blue-600 shadow-xl shadow-gray-100 hover:shadow-blue-200 transition-all active:scale-95"
                    >
                      Enter Campus
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  ) : (
                    <button 
                      onClick={() => handleRequestJoin(course.id)}
                      disabled={requesting === course.id || !course.is_open}
                      className={`px-8 py-4 rounded-3xl text-sm font-black transition-all shadow-lg active:scale-95 ${
                        isPending 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : !course.is_open
                            ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                            : 'bg-white border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white group-hover:border-blue-600'
                      }`}
                    >
                      {requesting === course.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : isPending ? (
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Awaiting Sync</span>
                      ) : !course.is_open ? (
                        'Admissions Closed'
                      ) : (
                        <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Request Admission</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination - Premium Styled */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-10">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="w-14 h-14 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-all font-black text-lg"
          >
            ←
          </button>
          
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur px-3 py-2 rounded-[28px] border border-gray-100 shadow-inner">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-2xl text-xs font-black transition-all ${
                  currentPage === i + 1 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="w-14 h-14 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-all font-black text-lg"
          >
            →
          </button>
        </div>
      )}

      {filteredCourses.length === 0 && (
        <div className="text-center py-40 bg-white rounded-[60px] border border-gray-100 border-dashed animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-gray-200 shadow-inner">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Zero Matches Found</h3>
          <p className="text-gray-500 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            We couldn't find any courses matching your specific search criteria.
          </p>
          <button 
            onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedStatus('all'); }}
            className="bg-blue-600 text-white px-10 py-4 rounded-[24px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
