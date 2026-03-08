import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const session = db.prepare('SELECT audio_path FROM sessions WHERE id = ?').get(id) as { audio_path: string | null } | undefined;

  if (!session || !session.audio_path) {
    return NextResponse.json({ error: 'Аудио не найдено' }, { status: 404 });
  }

  if (!fs.existsSync(session.audio_path)) {
    // File was deleted, clear DB reference
    db.prepare('UPDATE sessions SET audio_path = NULL WHERE id = ?').run(id);
    return NextResponse.json({ error: 'Аудиофайл удалён' }, { status: 404 });
  }

  const stat = fs.statSync(session.audio_path);
  const ext = path.extname(session.audio_path).slice(1);
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    flac: 'audio/flac',
  };
  const contentType = mimeMap[ext] || 'audio/mpeg';

  const fileBuffer = fs.readFileSync(session.audio_path);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': stat.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
