import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const db = getDb();
  const sessions = db.prepare(
    'SELECT * FROM sessions WHERE manager_name = ? AND status = ? ORDER BY created_at DESC'
  ).all(decodedName, 'done');

  if (sessions.length === 0) {
    return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 404 });
  }

  return NextResponse.json(sessions);
}
