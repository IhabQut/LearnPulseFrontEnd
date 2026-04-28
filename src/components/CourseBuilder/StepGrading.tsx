import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type GradingComponent } from '../../types';

interface Props {
  components: GradingComponent[];
  setComponents: (c: GradingComponent[]) => void;
}

export default function StepGrading({ components, setComponents }: Props) {
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);

  const add = () => setComponents([...components, { name: '', weight: 0, component_type: 'assessment' }]);
  const remove = (i: number) => setComponents(components.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof GradingComponent, val: string | number) => {
    const arr = [...components];
    arr[i] = { ...arr[i], [field]: val };
    setComponents(arr);
  };

  const types = ['assessment', 'exam', 'project', 'participation', 'homework', 'other'];

  return (
    <div className="space-y-6">
      {/* Weight progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-bold text-gray-600">Total Weight</span>
          <span className={`font-black ${totalWeight === 100 ? 'text-green-600' : totalWeight > 100 ? 'text-red-600' : 'text-amber-600'}`}>
            {totalWeight}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalWeight === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
              totalWeight > 100 ? 'bg-gradient-to-r from-red-400 to-red-500' :
              'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          />
        </div>
        {totalWeight !== 100 && (
          <p className="text-xs text-amber-600 font-medium">
            {totalWeight < 100 ? `${100 - totalWeight}% remaining` : `${totalWeight - 100}% over — remove some weight`}
          </p>
        )}
      </div>

      {/* Component rows */}
      <div className="space-y-3">
        {components.map((comp, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex-1">
              <input
                value={comp.name}
                onChange={e => update(i, 'name', e.target.value)}
                placeholder="e.g. Midterm Exam"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <select
              value={comp.component_type}
              onChange={e => update(i, 'component_type', e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
            >
              {types.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <input
                type="number"
                min={0}
                max={100}
                value={comp.weight}
                onChange={e => update(i, 'weight', Number(e.target.value))}
                className="w-14 text-sm font-bold text-right outline-none"
              />
              <span className="text-sm text-gray-400 font-bold">%</span>
            </div>
            <button onClick={() => remove(i)} className="p-2 hover:bg-red-50 rounded-xl transition-all">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Add Component
      </button>
    </div>
  );
}
