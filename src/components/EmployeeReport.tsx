'use client';

import { EmployeeReportResult } from '@/lib/types';

interface EmployeeReportProps {
  report: EmployeeReportResult;
}

function priorityLabel(p: string) {
  if (p === 'high') return { text: 'Важно', cls: 'bg-red-50 text-red-600' };
  if (p === 'medium') return { text: 'Средне', cls: 'bg-amber-50 text-amber-600' };
  return { text: 'Низкий', cls: 'bg-zinc-100 text-zinc-500' };
}

function trendLabel(t: string) {
  if (t === 'improving') return { text: 'Растёт', cls: 'text-emerald-600' };
  if (t === 'declining') return { text: 'Снижается', cls: 'text-red-600' };
  return { text: 'Стабильно', cls: 'text-zinc-500' };
}

export default function EmployeeReport({ report }: EmployeeReportProps) {
  const trend = trendLabel(report.score_trend);

  return (
    <div className="space-y-8">
      {/* Overall trend */}
      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Общий тренд:</span>
          <span className={`text-sm font-medium ${trend.cls}`}>{trend.text}</span>
        </div>
        <p className="text-sm text-zinc-600">{report.overall_trend}</p>
      </div>

      {/* Recurring mistakes */}
      {report.recurring_mistakes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-3 uppercase tracking-wide">
            Повторяющиеся ошибки
          </h3>
          <div className="space-y-3">
            {report.recurring_mistakes.map((m, i) => (
              <div key={i} className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-sm">{m.pattern}</p>
                  <span className="text-xs text-red-500 whitespace-nowrap">{m.frequency}</span>
                </div>
                <p className="text-sm text-zinc-500 mt-1">{m.impact}</p>
                {m.examples.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.examples.map((ex, j) => (
                      <p key={j} className="text-xs text-zinc-500 pl-3 border-l-2 border-red-200">
                        {ex}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-emerald-600 mb-3 uppercase tracking-wide">
            Сильные стороны
          </h3>
          <div className="space-y-3">
            {report.strengths.map((s, i) => (
              <div key={i} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-sm">{s.pattern}</p>
                  <span className="text-xs text-emerald-500 whitespace-nowrap">{s.frequency}</span>
                </div>
                {s.examples.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {s.examples.map((ex, j) => (
                      <p key={j} className="text-xs text-zinc-500 pl-3 border-l-2 border-emerald-200">
                        {ex}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training recommendations */}
      {report.training_recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
            Рекомендации по дообучению
          </h3>
          <div className="space-y-3">
            {report.training_recommendations.map((r, i) => {
              const pr = priorityLabel(r.priority);
              return (
                <div key={i} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pr.cls}`}>
                      {pr.text}
                    </span>
                    <span className="font-medium text-sm">{r.area}</span>
                  </div>
                  <p className="text-sm text-zinc-600">{r.action}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
