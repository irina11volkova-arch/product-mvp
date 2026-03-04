import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = getDb();
  const prompts = db.prepare('SELECT * FROM prompts ORDER BY created_at ASC').all();
  return NextResponse.json(prompts);
}

export async function POST(request: NextRequest) {
  const { name, text } = await request.json();
  if (!name || !text) {
    return NextResponse.json({ error: 'name и text обязательны' }, { status: 400 });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare(
    "INSERT INTO prompts (id, name, text, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))"
  ).run(id, name, text);

  const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
  return NextResponse.json(prompt, { status: 201 });
}
