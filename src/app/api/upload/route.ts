import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { transcribeAudio } from '@/lib/deepgram';
import { cleanTranscript, generateFeedback } from '@/lib/anthropic';
import { v4 as uuidv4 } from 'uuid';
import { Prompt, PageMode } from '@/lib/types';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;
    const promptId = formData.get('prompt_id') as string | null;
    const mode = (formData.get('mode') as PageMode | null) || null;

    if (!file) {
      return NextResponse.json({ error: 'Аудиофайл не загружен' }, { status: 400 });
    }

    const db = getDb();
    let promptText: string | null = null;

    if (mode !== 'transcription') {
      if (!promptId) {
        return NextResponse.json({ error: 'Не выбран промт' }, { status: 400 });
      }
      const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(promptId) as Prompt | undefined;
      if (!prompt) {
        return NextResponse.json({ error: 'Промт не найден' }, { status: 404 });
      }
      promptText = prompt.text;
    }

    // Create session
    const sessionId = uuidv4();
    const title = file.name.replace(/\.[^.]+$/, '') || 'Без названия';

    db.prepare(
      "INSERT INTO sessions (id, title, status, prompt_id, mode, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
    ).run(sessionId, title, 'processing', promptId, mode);

    if (mode === 'transcription') {
      processTranscriptionOnly(sessionId, file).catch((err) => {
        console.error('Transcription processing error:', err);
        const db = getDb();
        db.prepare('UPDATE sessions SET status = ?, error_message = ? WHERE id = ?').run(
          'error', err.message || 'Произошла ошибка при транскрибации', sessionId
        );
      });
    } else {
      processAudio(sessionId, file, promptText!).catch((err) => {
        console.error('Processing error:', err);
        const db = getDb();
        db.prepare('UPDATE sessions SET status = ?, error_message = ? WHERE id = ?').run(
          'error', err.message || 'Произошла ошибка при обработке', sessionId
        );
      });
    }

    return NextResponse.json({ session_id: sessionId });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 });
  }
}

async function processTranscriptionOnly(sessionId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Only Deepgram — no Claude
  const rawSegments = await transcribeAudio(buffer, file.type);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const smartTitle = `${dateStr} · Транскрибация`;

  const db = getDb();
  db.prepare(
    'UPDATE sessions SET status = ?, title = ?, transcript_json = ? WHERE id = ?'
  ).run('done', smartTitle, JSON.stringify(rawSegments), sessionId);
}

async function processAudio(sessionId: string, file: File, promptText: string) {
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. Transcribe with Deepgram
  const rawSegments = await transcribeAudio(buffer, file.type);

  // 2. Clean transcript via Claude
  const cleanedSegments = await cleanTranscript(rawSegments);

  // 3. Generate AI feedback via Claude
  const feedback = await generateFeedback(cleanedSegments, promptText);

  // 4. Build smart title: "DD.MM.YYYY · Имя клиента · X/10"
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const clientName = feedback.client_name || 'Клиент';
  const score = feedback.score || 0;
  const smartTitle = `${dateStr} · ${clientName} · ${score}/10`;

  // 5. Save results
  const managerName = feedback.manager_name || 'Менеджер';
  const db = getDb();
  db.prepare(
    'UPDATE sessions SET status = ?, title = ?, transcript_json = ?, feedback_json = ?, manager_name = ?, score = ? WHERE id = ?'
  ).run('done', smartTitle, JSON.stringify(cleanedSegments), JSON.stringify(feedback), managerName, score, sessionId);
}
