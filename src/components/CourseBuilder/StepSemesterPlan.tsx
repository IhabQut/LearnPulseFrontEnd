import React from 'react';
import { Sparkles, Loader2, Edit3 } from 'lucide-react';
import { type DraftChapter, type SemesterWeekDraft } from '../../types';

interface Props {
  chapters: DraftChapter[];
  weeks: SemesterWeekDraft[];
  setWeeks: (w: SemesterWeekDraft[]) => void;
  totalWeeks: number;
  setTotalWeeks: (n: number) => void;
  generating: boolean;
  setGenerating: (v: boolean) => void;
}

function generateMockPlan(chapters: DraftChapter[], numWeeks: number): SemesterWeekDraft[] {
  const plan: SemesterWeekDraft[] = [];
  for (let w = 1; w <= numWeeks; w++) {
    const chIdx = Math.min(Math.floor(((w - 1) / numWeeks) * chapters.length), chapters.length - 1);
    const ch = chapters[chIdx];
    const topicNames = ch ? ch.topics.map(t => t.title) : [];
    let notes = '';
    if (w === 1) notes = 'Course introduction & syllabus review';
    else if (w === numWeeks) notes = 'Final review & exam preparation';
    else if (w === Math.floor(numWeeks / 2)) notes = 'Midterm assessment week';

    plan.push({
      week_num: w,
      chapter_title: ch ? ch.title : `Week ${w}`,
      topics_json: JSON.stringify(topicNames),
      notes,
    });
  }
  return plan;
}

export default function StepSemesterPlan({ chapters, weeks, setWeeks, totalWeeks, setTotalWeeks, generating, setGenerating }: Props) {
  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setWeeks(generateMockPlan(chapters, totalWeeks));
      setGenerating(false);
    }, 1800);
  };

  const updateWeek = (idx: number, field: keyof SemesterWeekDraft, val: string) => {
    const arr = [...weeks];
    arr[idx] = { ...arr[idx], [field]: val };
    setWeeks(arr);
  };

  return (
    <div className="space-y-6">
      {/* Weeks slider */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Semester Length</label>
          <span className="text-2xl font-black text-blue-600">{totalWeeks} weeks</span>
        </div>
        <input
          type="range" min={8} max={18} value={totalWeeks}
          onChange={e => setTotalWeeks(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 font-bold">
          <span>8 weeks</span><span>18 weeks</span>
        </div>
      </div>

      {weeks.length === 0 ? (
        <button
          onClick={generate}
          disabled={generating || chapters.length === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating plan…</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Semester Plan</>
          )}
        </button>
      ) : (
        <>
          <div className="grid gap-3">
            {weeks.map((w, idx) => {
              let topics: string[] = [];
              try { topics = JSON.parse(w.topics_json); } catch { topics = []; }
              return (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-blue-600">{w.week_num}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        value={w.chapter_title}
                        onChange={e => updateWeek(idx, 'chapter_title', e.target.value)}
                        className="w-full font-bold text-gray-900 bg-transparent outline-none focus:bg-gray-50 rounded-lg px-2 py-0.5 -ml-2"
                      />
                      {topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {topics.map((t, ti) => (
                            <span key={ti} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-medium">{t}</span>
                          ))}
                        </div>
                      )}
                      <input
                        value={w.notes}
                        onChange={e => updateWeek(idx, 'notes', e.target.value)}
                        placeholder="Add notes..."
                        className="w-full text-xs text-gray-400 bg-transparent outline-none focus:bg-gray-50 rounded-lg px-2 py-0.5 -ml-2"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={generate}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" /> Regenerate Plan
          </button>
        </>
      )}
    </div>
  );
}
