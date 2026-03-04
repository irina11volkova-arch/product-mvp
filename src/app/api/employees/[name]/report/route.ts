import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateEmployeeReport } from '@/lib/anthropic';
import { Session, FeedbackResult } from '@/lib/types';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  try {
    const db = getDb();
    const sessions = db.prepare(
      'SELECT * FROM sessions WHERE manager_name = ? AND status = ? ORDER BY created_at ASC'
    ).all(decodedName, 'done') as Session[];

    if (sessions.length === 0) {
      return NextResponse.json({ error: 'Нет звонков для анализа' }, { status: 404 });
    }

    const feedbacks: { feedback: FeedbackResult; date: string }[] = sessions
      .filter(s => s.feedback_json)
      .map(s => ({
        feedback: JSON.parse(s.feedback_json!) as FeedbackResult,
        date: s.created_at,
      }));

    const report = await generateEmployeeReport(decodedName, feedbacks);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Ошибка генерации отчёта' }, { status: 500 });
  }
}
