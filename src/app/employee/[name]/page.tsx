'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ScoreChart from '@/components/ScoreChart';
import EmployeeReport from '@/components/EmployeeReport';
import { Session, EmployeeReportResult } from '@/lib/types';
import { scoreColor } from '@/lib/utils';

export default function EmployeePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const decodedName = decodeURIComponent(name);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<EmployeeReportResult | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/employees/${encodeURIComponent(decodedName)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSessions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [decodedName]);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(decodedName)}/report`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Ошибка генерации');
      const data = await res.json();
      setReport(data);
    } catch {
      setReportError('Не удалось сгенерировать отчёт');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  const scores = sessions
    .filter(s => s.score != null)
    .map(s => ({ score: s.score!, date: s.created_at }));

  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10) / 10
    : 0;

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8 animate-fade-in p-5 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{decodedName}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-zinc-600">
                <span>{sessions.length} {sessions.length === 1 ? 'звонок' : sessions.length < 5 ? 'звонка' : 'звонков'}</span>
                {scores.length >= 2 && (
                  <>
                    <span className="text-zinc-300">|</span>
                    <span className={
                      scores.slice(-3).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3) >
                      scores.slice(0, Math.min(scores.length, 3)).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3)
                        ? 'text-emerald-600'
                        : scores.slice(-3).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3) <
                          scores.slice(0, Math.min(scores.length, 3)).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3)
                        ? 'text-red-600'
                        : 'text-zinc-500'
                    }>
                      {scores.slice(-3).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3) >
                       scores.slice(0, Math.min(scores.length, 3)).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3)
                        ? 'Тренд: растёт'
                        : scores.slice(-3).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3) <
                          scores.slice(0, Math.min(scores.length, 3)).reduce((s, v) => s + v.score, 0) / Math.min(scores.length, 3)
                        ? 'Тренд: снижается'
                        : 'Тренд: стабильно'}
                    </span>
                  </>
                )}
              </div>
            </div>
            {avgScore > 0 && (
              <div className={`px-4 py-2 rounded-xl text-lg font-semibold ${scoreColor(avgScore)}`}>
                {avgScore}/10
              </div>
            )}
          </div>
        </header>

        {/* Score chart */}
        <section className="mb-10 animate-fade-in">
          <h2 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wide">Динамика оценок</h2>
          <ScoreChart scores={scores} />
        </section>

        {/* Generate report button */}
        <section className="mb-10 animate-fade-in">
          {!report && !generatingReport && (
            <button
              onClick={handleGenerateReport}
              disabled={sessions.length < 2}
              className="w-full py-3 px-4 rounded-xl border border-zinc-200 hover:border-zinc-300
                         hover:bg-zinc-50 transition-all text-sm font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sessions.length < 2
                ? 'Нужно минимум 2 звонка для отчёта'
                : 'Сгенерировать отчёт по сотруднику'}
            </button>
          )}

          {generatingReport && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-700 rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Анализирую звонки...</p>
            </div>
          )}

          {reportError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-4">
              <p className="text-red-600 text-sm">{reportError}</p>
            </div>
          )}

          {report && <EmployeeReport report={report} />}
        </section>

        {/* Sessions list */}
        <section className="animate-fade-in">
          <h2 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wide">Звонки</h2>
          <div className="space-y-2">
            {sessions.map(s => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="block p-3 rounded-xl border border-zinc-200 hover:border-zinc-300
                           hover:bg-zinc-50/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{s.title}</span>
                  {s.score != null && (
                    <span className="text-sm text-zinc-500">{s.score}/10</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(s.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
