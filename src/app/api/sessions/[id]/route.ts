import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);

  if (!session) {
    return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  }

  return NextResponse.json(session);
}
