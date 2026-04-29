import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Search, Plus, Clock, CheckCircle, UserPlus, Beaker, Code, Briefcase, Globe, Cpu, Languages, FlaskConical,
  ChevronDown, Filter, X, Zap, Circle
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useDebounce } from '../hooks/useDebounce';
import { CourseCard } from '../components/CourseCard';
import { motion, AnimatePresence } from 'framer-motion';

const INDUSTRIES = [
  { id: 'all', label: 'All Fields', icon: Globe },
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

  // Filters State
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState('all'); // all, registered, available
  const [statusFilter, setStatusFilter] = useState('all'); // all, open, closed
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cData, eData] = await Promise.all([
        apiFetch<any[]>(`/api/courses?user_id=${user?.id || 'u1'}`),
        apiFetch<Record<string, string>>(`/api/enrollments/my-status?user_id=${user?.id}`)
      ]);
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
      await apiFetch(`/api/enrollments/request`, {
        method: 'POST',
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
        c.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.professor_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.category.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      
      const isRegistered = enrollments[c.id] === 'approved' || user?.id === c.professor_id;
      const matchesEnrollment = 
        enrollmentFilter === 'all' || 
        (enrollmentFilter === 'registered' && isRegistered) || 
        (enrollmentFilter === 'available' && !isRegistered);
        
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'open' && c.is_open) || 
        (statusFilter === 'closed' && !c.is_open);
      
      return matchesSearch && matchesCategory && matchesEnrollment && matchesStatus;
    });
  }, [courses, debouncedSearch, selectedCategory, enrollmentFilter, statusFilter, enrollments, user?.id]);

  // Split logic for sections
  const enrolledCoursesList = filteredCourses.filter(c => enrollments[c.id] === 'approved' || user?.id === c.professor_id);
  const catalogCoursesList = filteredCourses.filter(c => enrollments[c.id] !== 'approved' && user?.id !== c.professor_id);

  const totalPages = Math.ceil(catalogCoursesList.length / itemsPerPage);
  const paginatedCatalog = catalogCoursesList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, enrollmentFilter, statusFilter]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 font-black tracking-widest text-xs uppercase animate-pulse">Scanning Course Catalog...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24 px-4 sm:px-6">
      
      {/* Search & Filter Section - Premium Redesign */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-16 pr-12 py-5 bg-white border border-gray-100 rounded-[32px] text-base font-bold text-gray-900 shadow-xl shadow-gray-100/50 placeholder:text-gray-400 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 transition-all outline-none"
              placeholder="Search by course, instructor, or field of study..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-50 rounded-full transition-all"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center gap-3 px-8 py-5 rounded-[32px] font-black text-sm transition-all shadow-xl ${
              isFilterExpanded || selectedCategory !== 'all' || enrollmentFilter !== 'all' || statusFilter !== 'all'
                ? 'bg-blue-600 text-white shadow-blue-100'
                : 'bg-white text-gray-900 border border-gray-100 shadow-gray-100/50 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Refine Search</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFilterExpanded ? 'rotate-180' : ''}`} />
          </button>

          {user?.role === 'professor' && (
            <Link 
              to="/courses/create" 
              className="bg-gray-900 text-white px-8 py-5 rounded-[32px] text-sm font-black shadow-2xl shadow-gray-900/10 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Course</span>
            </Link>
          )}
        </div>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white border border-gray-100 rounded-[32px] shadow-2xl shadow-gray-200/40"
            >
              <div className="p-8 space-y-8">
                {/* Field of Study */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Field of Study</h3>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind.id}
                        onClick={() => setSelectedCategory(ind.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                          selectedCategory === ind.id 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-gray-50/50 border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <ind.icon className="w-3.5 h-3.5" />
                        {ind.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Registration Status */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Your Relationship</h3>
                    <div className="flex gap-2">
                      {[
                        { id: 'all', label: 'Everything', icon: Globe },
                        { id: 'registered', label: 'My Courses', icon: CheckCircle },
                        { id: 'available', label: 'Not Joined', icon: Circle }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setEnrollmentFilter(opt.id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                            enrollmentFilter === opt.id 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : 'bg-gray-50/50 border-gray-100 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admission Status */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Admission Status</h3>
                    <div className="flex gap-2">
                      {[
                        { id: 'all', label: 'All Status', icon: Zap },
                        { id: 'open', label: 'Currently Open', icon: CheckCircle },
                        { id: 'closed', label: 'Closed/Full', icon: X }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setStatusFilter(opt.id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                            statusFilter === opt.id 
                              ? 'bg-amber-50 border-amber-200 text-amber-700' 
                              : 'bg-gray-50/50 border-gray-100 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <button 
                    onClick={() => { setSelectedCategory('all'); setEnrollmentFilter('all'); setStatusFilter('all'); setSearch(''); }}
                    className="text-xs font-bold text-red-500 hover:text-red-600 px-4 py-2"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enrolled Section */}
      {enrolledCoursesList.length > 0 && enrollmentFilter !== 'available' && (
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                 <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Registrations</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Courses you are currently participating in</p>
              </div>
            </div>
            <span className="bg-gray-50 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full">{enrolledCoursesList.length} COURSES</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {enrolledCoursesList.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Catalog Section */}
      {enrollmentFilter !== 'registered' && (
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                 <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Discovery Catalog</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Explore and apply for new learning opportunities</p>
              </div>
            </div>
            <span className="bg-gray-50 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full">{catalogCoursesList.length} AVAILABLE</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedCatalog.map(course => {
              const status = enrollments[course.id] || 'none';
              const isPending = status === 'pending';

              const action = (
                <button 
                  onClick={() => handleRequestJoin(course.id)}
                  disabled={requesting === course.id || !course.is_open}
                  className={`w-full py-3 rounded-2xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-2 ${
                    isPending 
                      ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                      : !course.is_open
                        ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200'
                  }`}
                >
                  {requesting === course.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isPending ? (
                    <><Clock className="w-3.5 h-3.5" /> Pending Approval</>
                  ) : !course.is_open ? (
                    'Closed'
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5" /> Request to Join</>
                  )}
                </button>
              );

              return (
                <CourseCard key={course.id} course={course} action={action} />
              );
            })}
          </div>

          {/* Pagination - Premium Styled */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-12">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-14 h-14 rounded-[20px] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all font-black"
              >
                ←
              </button>
              
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xl px-4 py-2 rounded-[24px] border border-gray-100 shadow-xl shadow-gray-100/30">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
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
                className="w-14 h-14 rounded-[20px] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all font-black"
              >
                →
              </button>
            </div>
          )}
        </section>
      )}

      {catalogCoursesList.length === 0 && enrolledCoursesList.length === 0 && (
        <div className="text-center py-40 bg-white rounded-[60px] border border-gray-100 border-dashed animate-in fade-in zoom-in duration-500 shadow-2xl shadow-gray-100/20">
          <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 text-gray-200 shadow-inner">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Zero Results Found</h3>
          <p className="text-gray-500 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            Adjust your search or clear filters to discover more courses.
          </p>
          <button 
            onClick={() => { setSearch(''); setSelectedCategory('all'); setEnrollmentFilter('all'); setStatusFilter('all'); }}
            className="bg-blue-600 text-white px-12 py-5 rounded-[24px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-200 uppercase tracking-widest"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
