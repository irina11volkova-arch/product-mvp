import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, text } = await request.json();

  const db = getDb();
  const existing = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
  if (!existing) {
    return NextResponse.json({ error: 'Промт не найден' }, { status: 404 });
  }

  db.prepare("UPDATE prompts SET name = COALESCE(?, name), text = COALESCE(?, text), updated_at = datetime('now') WHERE id = ?").run(
    name || null,
    text || null,
    id
  );

  const updated = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
  return NextResponse.json(updated);
}
