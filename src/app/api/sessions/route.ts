import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode');
  const db = getDb();

  let sessions;
  if (mode) {
    sessions = db
      .prepare('SELECT id, title, status, prompt_id, mode, created_at FROM sessions WHERE mode = ? ORDER BY created_at DESC')
      .all(mode);
  } else {
    sessions = db
      .prepare('SELECT id, title, status, prompt_id, mode, created_at FROM sessions ORDER BY created_at DESC')
      .all();
  }

  return NextResponse.json(sessions);
}
