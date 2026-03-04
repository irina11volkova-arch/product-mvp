import { createClient } from '@deepgram/sdk';

interface DiarizedSegment {
  speaker: number;
  text: string;
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<DiarizedSegment[]> {
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

  const { result } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: 'nova-3',
    language: 'ru',
    smart_format: true,
    diarize: true,
    paragraphs: true,
    utterances: true,
  });

  const utterances = result?.results?.utterances;
  if (!utterances || utterances.length === 0) {
    throw new Error('Транскрипция не удалась — нет результатов');
  }

  return utterances.map((u) => ({
    speaker: u.speaker ?? 0,
    text: u.transcript,
  }));
}
