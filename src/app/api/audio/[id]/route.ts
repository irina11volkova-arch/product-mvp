import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const session = db.prepare('SELECT audio_path FROM sessions WHERE id = ?').get(id) as { audio_path: string | null } | undefined;

  if (!session?.audio_path) {
    return NextResponse.json({ error: 'Аудио не найдено' }, { status: 404 });
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(session.audio_path);
  } catch {
    db.prepare('UPDATE sessions SET audio_path = NULL WHERE id = ?').run(id);
    return NextResponse.json({ error: 'Аудиофайл удалён' }, { status: 404 });
  }

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
  const { size } = stat;

  // Handle Range requests for seeking support
  const range = request.headers.get('range');
  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : size - 1;
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(session.audio_path, { start, end });
    return new NextResponse(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': chunkSize.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  const stream = fs.createReadStream(session.audio_path);
  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
