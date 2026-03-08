'use client';

import { useToast } from './Toast';

interface RawSegment {
  speaker: number | string;
  text: string;
}

interface RawTranscriptViewProps {
  segments: RawSegment[];
}

export default function RawTranscriptView({ segments }: RawTranscriptViewProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    const text = segments
      .map((s) => `Спикер ${s.speaker}: ${s.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast('Текст скопирован');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          Транскрипция
        </h2>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-zinc-200
                     text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          Копировать
        </button>
      </div>

      <div className="space-y-3">
        {segments.map((segment, i) => (
          <div key={i} className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
            <div className="text-xs font-medium text-zinc-400 mb-1.5">
              Спикер {segment.speaker}
            </div>
            <p className="text-zinc-700 text-sm leading-relaxed">
              {segment.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
