import { Link } from 'react-router-dom';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function CourseCard({ course, action }: { course: any, action?: React.ReactNode }) {
  const { user } = useAuthStore();
  const totalTopics = course.chapters?.reduce((acc: number, ch: any) => acc + (ch.topics?.length || 0), 0) || 0;
  const completedTopics = course.chapters?.reduce((acc: number, ch: any) => acc + (ch.topics?.filter((t: any) => t.completed).length || 0), 0) || 0;
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="group h-full">
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full overflow-hidden">
        <div className="h-40 relative overflow-hidden bg-gray-100">
          {course.image ? (
            <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600" />
          )}
          <div className="absolute top-3 left-3 flex gap-2">
             {course.category && (
               <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-white/20">
                 <span className="text-[9px] font-black uppercase tracking-widest text-blue-700">{course.category}</span>
               </div>
             )}
             {course.user_role && (
               <div className="bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-white/10">
                 <span className="text-[9px] font-black uppercase tracking-widest text-white">{course.user_role}</span>
               </div>
             )}
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {course.user_role || course.professor_id === user?.id ? (
            <Link to={`/courses/${course.id}`}>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                {course.title}
              </h3>
            </Link>
          ) : (
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 uppercase tracking-tight">
              {course.title}
            </h3>
          )}
          
          {user?.role === 'student' && course.user_role && (
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

          {(course.user_role === 'owner' || course.professor_id === user?.id) && (
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

          {action && (
            <div className="mt-auto pt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
