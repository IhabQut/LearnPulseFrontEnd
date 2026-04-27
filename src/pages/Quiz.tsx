import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, AlertCircle, ArrowLeft, Trophy, RotateCw } from 'lucide-react';
import { apiFetch } from '../lib/api';

type QuizQuestion = {
  id: string;
  question: string;
  options: string; // JSON string
  correct_option: number;
  explanation: string;
};

type QuizData = {
  id: string;
  title: string;
  quiz_type: string;
  questions: QuizQuestion[];
};

type QuizResult = {
  id: string;
  score: number;
  total: number;
  is_first_attempt: boolean;
  points_awarded: number;
};

export default function Quiz() {
  const { courseId, chapterId, topicId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();

  const quizId = searchParams.get("quizId");
  const courseName = searchParams.get("course") || "Course";
  const fromPath = searchParams.get("from") || `/courses/${courseId}`;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      let url = '';
      if (quizId) url = `/api/quizzes/${quizId}`;
      else if (topicId) url = `/api/quizzes/topic/${topicId}`;
      else if (chapterId) url = `/api/quizzes/chapter/${chapterId}`;
      else { setLoading(false); return; }

      try {
        const data = await apiFetch<QuizData>(url);
        if (data) {
          setQuiz(data);
          setAnswers(new Array(data.questions.length).fill(null));
        }
      } catch (err) {
        console.error("Failed to fetch quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [topicId, chapterId, quizId]);

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Loading quiz...</div>;
  if (!quiz || quiz.questions.length === 0) return (
    <div className="max-w-xl mx-auto text-center py-20">
      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 font-medium mb-4">No quiz found.</p>
      <button onClick={() => navigate(fromPath)} className="text-blue-600 font-bold hover:underline">Go back</button>
    </div>
  );

  const question = quiz.questions[currentQ];
  const options: string[] = JSON.parse(question.options);

  const selectAnswer = (optIndex: number) => {
    if (result) return; // quiz submitted, can't change
    const updated = [...answers];
    updated[currentQ] = optIndex;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    const finalAnswers = answers.map(a => a ?? -1);
    try {
      const data = await apiFetch<QuizResult>(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user?.id || "u1", answers: finalAnswers })
      });
      setResult(data);
      // Refresh user points
      if (data.points_awarded > 0) {
        refreshUser();
      }
    } catch (err) {
      console.error("Quiz submission failed:", err);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => navigate(fromPath)} className="text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{quiz.title}</h1>
          <p className="text-sm text-gray-500 font-medium">{courseName} • {quiz.questions.length} Questions</p>
        </div>
      </div>

      {/* Result View */}
      {result ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
           <div className={`p-8 text-center ${result.score >= result.total * 0.7 ? 'bg-gradient-to-br from-emerald-50 to-green-50' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
             <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 text-3xl font-black ${result.score >= result.total * 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
               {result.score}/{result.total}
             </div>
             <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
               {result.score >= result.total * 0.7 ? 'Great Job!' : 'Keep Practicing!'}
             </h2>
             <p className="text-gray-600 font-medium mb-4">
               You scored {result.score} out of {result.total} ({Math.round(result.score / result.total * 100)}%)
             </p>
             
             {result.is_first_attempt ? (
               <div className="inline-flex items-center bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm border border-emerald-200">
                 <Trophy className="w-4 h-4 mr-2" /> +{result.points_awarded} Points Earned!
               </div>
             ) : (
               <div className="inline-flex items-center bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm border border-gray-200">
                 Retry — No additional points awarded
               </div>
             )}
           </div>

           {/* Question Review */}
           <div className="p-6 space-y-4 border-t border-gray-100">
             <h3 className="font-bold text-gray-900 mb-2">Answer Review</h3>
             {quiz.questions.map((q, i) => {
               const qOptions: string[] = JSON.parse(q.options);
               const userAnswer = answers[i];
               const isCorrect = userAnswer === q.correct_option;
               return (
                 <div key={q.id} className={`p-4 rounded-2xl border ${isCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
                   <div className="flex items-start mb-2">
                     {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500 mr-2 mt-0.5 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 shrink-0" />}
                     <span className="font-bold text-gray-900">{q.question}</span>
                   </div>
                   <div className="ml-7 text-sm space-y-1">
                     {userAnswer !== null && userAnswer !== q.correct_option && (
                       <p className="text-red-600 font-medium">Your answer: {qOptions[userAnswer]}</p>
                     )}
                     <p className="text-emerald-600 font-medium">Correct: {qOptions[q.correct_option]}</p>
                     <p className="text-gray-500 italic">{q.explanation}</p>
                   </div>
                 </div>
               );
             })}
           </div>

           <div className="p-6 border-t border-gray-100 flex justify-between">
             <button onClick={() => navigate(fromPath)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
               ← Back to Course
             </button>
             <button onClick={handleRetry} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center">
               <RotateCw className="w-4 h-4 mr-2" /> Retry Quiz
             </button>
           </div>
        </div>
      ) : (
        /* Question View */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Progress */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">Question {currentQ + 1} of {quiz.questions.length}</span>
            <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h2>
            
            <div className="space-y-3">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                    answers[currentQ] === i 
                      ? 'border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-100 shadow-sm' 
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mr-3 ${
                    answers[currentQ] === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button 
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="flex items-center px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </button>
            
            {currentQ < quiz.questions.length - 1 ? (
              <button 
                onClick={() => setCurrentQ(currentQ + 1)}
                disabled={answers[currentQ] === null}
                className="flex items-center px-5 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answers.some(a => a === null)}
                className="flex items-center px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
