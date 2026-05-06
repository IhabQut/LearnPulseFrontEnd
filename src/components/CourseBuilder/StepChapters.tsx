import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Pencil, Check, X } from 'lucide-react';
import { type DraftChapter, type DraftTopic } from '../../types';

interface Props {
  chapters: DraftChapter[];
  setChapters: (c: DraftChapter[]) => void;
}

export default function StepChapters({ chapters, setChapters }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const removeChapter = (idx: number) => setChapters(chapters.filter((_, i) => i !== idx));

  const moveChapter = (idx: number, dir: -1 | 1) => {
    const arr = [...chapters];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setChapters(arr);
    setExpanded(target);
  };

  const addChapter = () => {
    setChapters([...chapters, { title: `Chapter ${chapters.length + 1}`, summary: '', topics: [] }]);
    setExpanded(chapters.length);
  };

  const startEdit = (idx: number) => { setEditIdx(idx); setEditTitle(chapters[idx].title); };
  const saveEdit = () => {
    if (editIdx === null) return;
    const arr = [...chapters];
    arr[editIdx] = { ...arr[editIdx], title: editTitle };
    setChapters(arr);
    setEditIdx(null);
  };

  const updateSummary = (idx: number, summary: string) => {
    const arr = [...chapters];
    arr[idx] = { ...arr[idx], summary };
    setChapters(arr);
  };

  const addTopic = (chIdx: number) => {
    const arr = [...chapters];
    arr[chIdx] = { ...arr[chIdx], topics: [...arr[chIdx].topics, { title: 'New Topic', description: '' }] };
    setChapters(arr);
  };

  const removeTopic = (chIdx: number, tIdx: number) => {
    const arr = [...chapters];
    arr[chIdx] = { ...arr[chIdx], topics: arr[chIdx].topics.filter((_, i) => i !== tIdx) };
    setChapters(arr);
  };

  const updateTopic = (chIdx: number, tIdx: number, field: keyof DraftTopic, value: string) => {
    const arr = [...chapters];
    const topics = [...arr[chIdx].topics];
    topics[tIdx] = { ...topics[tIdx], [field]: value };
    arr[chIdx] = { ...arr[chIdx], topics };
    setChapters(arr);
  };

  return (
    <div className="space-y-3">
      {chapters.map((ch, idx) => (
        <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 p-4">
            <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="text-xs font-black text-gray-400 w-6">{idx + 1}</span>
            {editIdx === idx ? (
              <div className="flex items-center gap-2 flex-1">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="flex-1 bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-sm font-bold outline-none" autoFocus />
                <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditIdx(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <span className="font-bold text-gray-900 flex-1 cursor-pointer" onClick={() => setExpanded(expanded === idx ? null : idx)}>{ch.title}</span>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(idx)} className="p-1.5 hover:bg-white rounded-lg transition-all"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
              <button onClick={() => moveChapter(idx, -1)} disabled={idx === 0} className="p-1.5 hover:bg-white rounded-lg transition-all disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-gray-400" /></button>
              <button onClick={() => moveChapter(idx, 1)} disabled={idx === chapters.length - 1} className="p-1.5 hover:bg-white rounded-lg transition-all disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-gray-400" /></button>
              <button onClick={() => removeChapter(idx)} className="p-1.5 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              <button onClick={() => setExpanded(expanded === idx ? null : idx)} className="p-1.5 hover:bg-white rounded-lg">
                {expanded === idx ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {expanded === idx && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <input
                value={ch.summary}
                onChange={e => updateSummary(idx, e.target.value)}
                placeholder="Chapter summary..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              {ch.topics.map((t, tIdx) => (
                <div key={tIdx} className="flex items-start gap-2 pl-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-3 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <input value={t.title} onChange={e => updateTopic(idx, tIdx, 'title', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-300" />
                    <input value={t.description} onChange={e => updateTopic(idx, tIdx, 'description', e.target.value)} placeholder="Description..." className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1 text-xs text-gray-500 outline-none focus:ring-1 focus:ring-blue-200" />
                  </div>
                  <button onClick={() => removeTopic(idx, tIdx)} className="p-1 mt-1 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-300" /></button>
                </div>
              ))}
              <button onClick={() => addTopic(idx)} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pl-4">
                <Plus className="w-3.5 h-3.5" /> Add Topic
              </button>
            </div>
          )}
        </div>
      ))}

      <button onClick={addChapter} className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" /> Add Chapter
      </button>
    </div>
  );
}
