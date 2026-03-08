'use client';

import { FeedbackResult, TranscriptSegment } from '@/lib/types';
import { isSegmentActive } from '@/lib/utils';

interface TranscriptViewProps {
  feedback: FeedbackResult;
  currentTime?: number;
  onSegmentClick?: (startTime: number) => void;
}

interface MergedSegmentGroup {
  speaker: string;
  displayName: string;
  segments: TranscriptSegment[];
  start?: number;
  end?: number;
}

function buildSpeakerMap(feedback: FeedbackResult): Record<string, string> {
  const managerName = feedback.manager_name || 'Менеджер';
  const clientName = feedback.client_name || 'Клиент';
  return {
    'Спикер 1': `${managerName} (менеджер)`,
    'Спикер 2': `${clientName} (клиент)`,
  };
}

function mergeConsecutiveSegments(segments: TranscriptSegment[], speakerMap: Record<string, string>): MergedSegmentGroup[] {
  const groups: MergedSegmentGroup[] = [];
  for (const seg of segments) {
    const last = groups[groups.length - 1];
    if (last && last.speaker === seg.speaker) {
      last.segments.push(seg);
      last.end = seg.end;
    } else {
      groups.push({
        speaker: seg.speaker,
        displayName: speakerMap[seg.speaker] || seg.speaker,
        segments: [seg],
        start: seg.start,
        end: seg.end,
      });
    }
  }
  return groups;
}

export default function TranscriptView({ feedback, currentTime, onSegmentClick }: TranscriptViewProps) {
  const speakerMap = buildSpeakerMap(feedback);
  const groups = mergeConsecutiveSegments(feedback.segments, speakerMap);

  return (
    <div className="space-y-6">
      {/* Overall status */}
      <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-100">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Результат</h3>
        <p className="text-zinc-800 leading-relaxed">{feedback.overall_status}</p>
      </div>

      {/* Rapport note */}
      <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100">
        <h3 className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-2">Раппорт</h3>
        <p className="text-zinc-700 leading-relaxed">{feedback.rapport_note}</p>
      </div>

      {/* Transcript */}
      <div>
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Транскрипция</h3>
        <div className="space-y-3">
          {groups.map((group, gi) => (
            <SpeakerBlock
              key={gi}
              group={group}
              currentTime={currentTime}
              onSegmentClick={onSegmentClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SpeakerBlock({ group, currentTime, onSegmentClick }: {
  group: MergedSegmentGroup;
  currentTime?: number;
  onSegmentClick?: (startTime: number) => void;
}) {
  return (
    <div className="rounded-lg bg-zinc-50/50 border border-zinc-100 p-4">
      <div className="text-xs font-medium text-zinc-500 mb-2">
        {group.displayName}
      </div>
      <div className="text-sm text-zinc-700 leading-relaxed">
        {group.segments.map((segment, i) => {
          const active = isSegmentActive(currentTime, segment.start, segment.end);
          const canClick = onSegmentClick && segment.start !== undefined;
          const hasHighlight = segment.highlight === 'green' || segment.highlight === 'red';

          const highlightClass = segment.highlight === 'green'
            ? 'bg-emerald-100 decoration-emerald-400'
            : segment.highlight === 'red'
            ? 'bg-red-100 decoration-red-400'
            : '';

          const activeClass = active ? 'ring-1 ring-zinc-400 ring-offset-1 rounded' : '';
          const clickClass = canClick ? 'cursor-pointer hover:opacity-80' : '';

          return (
            <span key={i}>
              <span
                className={`${highlightClass} ${activeClass} ${clickClass} ${hasHighlight ? 'rounded px-0.5' : ''} transition-all`}
                onClick={canClick ? (e) => { e.stopPropagation(); onSegmentClick(segment.start!); } : undefined}
              >
                {segment.text}
              </span>
              {segment.comment && (
                <span className={`block ml-2 mt-1 mb-2 p-2 rounded text-xs ${
                  segment.highlight === 'green'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {segment.comment}
                </span>
              )}
              {!segment.comment && i < group.segments.length - 1 && ' '}
            </span>
          );
        })}
      </div>
    </div>
  );
}
