'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EmployeeSummary } from '@/lib/types';
import { scoreColor } from '@/lib/utils';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => { setEmployees(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-semibold tracking-tight">Сотрудники</h1>
          <p className="text-zinc-500 text-sm mt-1">Аналитика по менеджерам</p>
        </header>

        {employees.length === 0 ? (
          <p className="text-zinc-500 text-center py-12">
            Пока нет данных. Загрузите звонки для анализа.
          </p>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {employees.map((emp) => (
              <Link
                key={emp.manager_name}
                href={`/employee/${encodeURIComponent(emp.manager_name)}`}
                className="block p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{emp.manager_name}</h3>
                    <p className="text-zinc-500 text-sm mt-0.5">
                      {emp.call_count} {emp.call_count === 1 ? 'звонок' : emp.call_count < 5 ? 'звонка' : 'звонков'}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${scoreColor(emp.avg_score)}`}>
                    {emp.avg_score}/10
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
