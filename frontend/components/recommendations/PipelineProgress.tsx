'use client';

interface Props {
  stage: string;
  percent: number;
  message?: string;
}

const STAGES = [
  'Validating',
  'Understanding room',
  'Analyzing style',
  'Generating design',
  'Matching furniture',
  'Assembling scene',
];

export function PipelineProgress({ stage, percent, message }: Props) {
  return (
    <div className="p-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{stage}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className="bg-amber-500 h-2 rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      {message && <p className="text-xs text-gray-500">{message}</p>}

      <ol className="mt-4 space-y-1.5">
        {STAGES.map((s, i) => {
          const threshold = ((i + 1) / STAGES.length) * 100;
          const done = percent >= threshold;
          const active = !done && percent >= (i / STAGES.length) * 100;
          return (
            <li key={s} className={`flex items-center gap-2 text-xs ${done ? 'text-green-600' : active ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
              <span>{done ? '✓' : active ? '◌' : '○'}</span>
              {s}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
