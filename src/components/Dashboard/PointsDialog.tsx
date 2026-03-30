import { Trophy, X, BookOpen, Star, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PointsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courses: any[];
  coursePoints: Record<string, { rank: number; points: number; total: number }>;
}

export default function PointsDialog({ isOpen, onClose, courses, coursePoints }: PointsDialogProps) {
  const totalPoints = Object.values(coursePoints).reduce((a, b) => a + b.points, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Trophy className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Points Breakdown</h3>
                  <p className="text-amber-100 font-bold opacity-90">Total Earned: {totalPoints} pts</p>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No enrolled courses found.
                  </div>
                ) : (
                  courses.map((course) => {
                    const stats = coursePoints[course.id] || { points: 0, rank: '-', total: 0 };
                    const progress = course.chapters.reduce((a: number, c: any) => a + (c.topics?.filter((t: any) => t.completed)?.length || 0), 0);
                    const totalTopics = course.chapters.reduce((a: number, c: any) => a + (c.topics?.length || 0), 0);
                    const percent = totalTopics > 0 ? Math.round((progress / totalTopics) * 100) : 0;

                    return (
                      <div key={course.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-amber-200 transition-all hover:bg-white hover:shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-gray-900 truncate">{course.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Target className="w-3 h-3" />
                                {percent}% Done
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                <Trophy className="w-3 h-3" />
                                Rank: #{stats.rank}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-black text-amber-600">+{stats.points}</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase">Points</div>
                          </div>
                        </div>

                        {/* Progress line */}
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            className="h-full bg-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Star className="w-4 h-4 text-amber-400" />
                Keep Learning!
              </div>
              <button
                onClick={onClose}
                className="bg-gray-900 text-white font-bold py-2 px-6 rounded-xl hover:bg-gray-800 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
