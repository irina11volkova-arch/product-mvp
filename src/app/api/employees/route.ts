import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const employees = db.prepare(`
    SELECT manager_name, COUNT(*) as call_count, ROUND(AVG(score), 1) as avg_score
    FROM sessions
    WHERE status = 'done' AND manager_name IS NOT NULL AND manager_name != 'Менеджер'
    GROUP BY manager_name
    ORDER BY call_count DESC
  `).all();

  return NextResponse.json(employees);
}
