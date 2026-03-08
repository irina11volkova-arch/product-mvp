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
  segments: TranscriptSegment[];
  start?: number;
  end?: number;
}

function mergeConsecutiveSegments(segments: TranscriptSegment[]): MergedSegmentGroup[] {
  const groups: MergedSegmentGroup[] = [];
  for (const seg of segments) {
    const last = groups[groups.length - 1];
    if (last && last.speaker === seg.speaker) {
      last.segments.push(seg);
      last.end = seg.end;
    } else {
      groups.push({
        speaker: seg.speaker,
        segments: [seg],
        start: seg.start,
        end: seg.end,
      });
    }
  }
  return groups;
}

export default function TranscriptView({ feedback, currentTime, onSegmentClick }: TranscriptViewProps) {
  const groups = mergeConsecutiveSegments(feedback.segments);

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
        <div className="space-y-2">
          {groups.map((group, gi) => (
            <MergedSegmentBlock
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

function MergedSegmentBlock({ group, currentTime, onSegmentClick }: {
  group: MergedSegmentGroup;
  currentTime?: number;
  onSegmentClick?: (startTime: number) => void;
}) {
  const groupActive = isSegmentActive(currentTime, group.start, group.end);
  const canClick = onSegmentClick && group.start !== undefined;

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all ${groupActive ? 'ring-2 ring-zinc-400 ring-offset-1' : ''} ${canClick ? 'cursor-pointer' : ''}`}
      onClick={canClick ? () => onSegmentClick(group.start!) : undefined}
    >
      <div className="px-3 pt-2 pb-1">
        <span className="text-xs font-mono text-zinc-500">{group.speaker}</span>
      </div>
      {group.segments.map((segment, i) => {
        const bgClass = segment.highlight === 'green'
          ? 'bg-emerald-50 border-l-emerald-500'
          : segment.highlight === 'red'
          ? 'bg-red-50 border-l-red-500'
          : 'bg-white border-l-zinc-200';

        return (
          <div key={i}>
            <div className={`px-3 py-1.5 border-l-4 ${bgClass}`}>
              <p className="text-zinc-700 text-sm leading-relaxed">{segment.text}</p>
            </div>
            {segment.comment && (
              <div className={`ml-6 mt-0.5 mb-1 p-3 rounded-lg text-sm ${
                segment.highlight === 'green'
                  ? 'bg-emerald-50/50 text-emerald-700'
                  : 'bg-red-50/50 text-red-700'
              }`}>
                {segment.comment}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
