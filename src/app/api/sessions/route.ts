import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const sessions = db
    .prepare('SELECT id, title, status, prompt_id, created_at FROM sessions ORDER BY created_at DESC')
    .all();
  return NextResponse.json(sessions);
}
