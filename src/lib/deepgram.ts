import { createClient } from '@deepgram/sdk';

interface DiarizedSegment {
  speaker: number;
  text: string;
  start: number;
  end: number;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<DiarizedSegment[]> {
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

  console.log(`[Deepgram] Starting transcription, buffer size: ${audioBuffer.length}, mimeType: ${mimeType}`);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: 'nova-3',
    language: 'ru',
    smart_format: true,
    diarize: true,
    paragraphs: true,
    utterances: true,
    mimetype: mimeType,
  });

  if (error) {
    console.error('[Deepgram] API error:', JSON.stringify(error));
    throw new Error(`Deepgram error: ${error.message || JSON.stringify(error)}`);
  }

  console.log(`[Deepgram] Result channels: ${result?.results?.channels?.length}, utterances: ${result?.results?.utterances?.length}`);

  const utterances = result?.results?.utterances;
  if (!utterances || utterances.length === 0) {
    // Fallback: try channels/alternatives
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    console.log(`[Deepgram] Fallback transcript: ${transcript?.substring(0, 200)}`);

    if (transcript && transcript.trim().length > 0) {
      // Use paragraphs from channel if utterances unavailable
      const paragraphs = result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs;
      if (paragraphs && paragraphs.length > 0) {
        const segments: DiarizedSegment[] = [];
        for (const para of paragraphs) {
          for (const sentence of para.sentences) {
            segments.push({
              speaker: para.speaker ?? 0,
              text: sentence.text,
              start: sentence.start ?? 0,
              end: sentence.end ?? 0,
            });
          }
        }
        if (segments.length > 0) return segments;
      }

      // Last resort: return full transcript as single segment
      return [{ speaker: 0, text: transcript, start: 0, end: 0 }];
    }

    throw new Error('Транскрипция не удалась — нет результатов');
  }

  return utterances.map((u) => ({
    speaker: u.speaker ?? 0,
    text: u.transcript,
    start: u.start ?? 0,
    end: u.end ?? 0,
  }));
}
