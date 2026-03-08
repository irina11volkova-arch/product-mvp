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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  if (!session) {
    return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  }

  if (body.status === 'error') {
    db.prepare('UPDATE sessions SET status = ?, error_message = ? WHERE id = ?')
      .run('error', body.error_message || 'Остановлено вручную', id);
  } else {
    return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
  }

  const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  return NextResponse.json(updated);
}
