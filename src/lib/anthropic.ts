import Anthropic from '@anthropic-ai/sdk';
import { FeedbackResult, EmployeeReportResult } from './types';

const client = new Anthropic();

interface TranscriptInput {
  speaker: number;
  text: string;
  start?: number;
  end?: number;
}

export async function cleanTranscript(segments: TranscriptInput[]): Promise<TranscriptInput[]> {
  const rawText = segments
    .map((s) => `Спикер ${s.speaker + 1}: ${s.text}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Ты — редактор. Очисти эту транскрипцию устной речи, переведя её в письменный формат:
- Убери слова-паразиты (ну, типа, как бы, вот, э-э, м-м)
- Убери незаконченные фразы и повторы
- Исправь ошибки распознавания
- Сохрани смысл и разделение по спикерам
- Текст должен читаться бегло и понятно

Верни результат строго в JSON-формате — массив объектов:
[{"speaker": 0, "text": "очищенный текст"}, ...]

Нумерация спикеров начинается с 0. Не меняй порядок и не объединяй реплики.

Транскрипция:
${rawText}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return segments;

  try {
    const cleaned = JSON.parse(jsonMatch[0]) as TranscriptInput[];
    // Restore timestamps from original segments by index
    return cleaned.map((c, i) => ({
      ...c,
      start: segments[i]?.start ?? 0,
      end: segments[i]?.end ?? 0,
    }));
  } catch {
    return segments;
  }
}

export async function generateFeedback(
  segments: TranscriptInput[],
  promptText: string
): Promise<FeedbackResult> {
  const transcript = segments
    .map((s) => `Спикер ${s.speaker + 1}: ${s.text}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `${promptText}

Верни результат строго в JSON-формате:
{
  "overall_status": "Общий статус звонка простым языком, без цифр и процентов",
  "rapport_note": "Оценка установления контакта/раппорта между менеджером и клиентом",
  "client_name": "Имя клиента из разговора (если упоминается) или 'Клиент'",
  "manager_name": "Имя менеджера из разговора (Спикер 1 — это менеджер, определи его имя если оно звучит) или 'Менеджер'",
  "score": число от 1 до 10 — общая оценка качества звонка менеджера,
  "segments": [
    {
      "speaker": "Спикер 1",
      "text": "текст фрагмента",
      "highlight": "green" или "red" или null,
      "comment": "комментарий что хорошо/плохо и почему" или null
    }
  ]
}

Каждая реплика из транскрипции должна быть отдельным элементом в segments. Для реплик без замечаний highlight и comment = null.

Транскрипция:
${transcript}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Не удалось получить AI-фидбек');
  }

  const result = JSON.parse(jsonMatch[0]) as FeedbackResult;

  // Restore timestamps from input segments by index (don't trust Claude with numbers)
  result.segments = result.segments.map((seg, i) => ({
    ...seg,
    start: segments[i]?.start ?? 0,
    end: segments[i]?.end ?? 0,
  }));

  return result;
}

export async function generateEmployeeReport(
  managerName: string,
  feedbacks: { feedback: FeedbackResult; date: string }[]
): Promise<EmployeeReportResult> {
  const summaries = feedbacks.map((f, i) => {
    const redSegments = f.feedback.segments
      .filter(s => s.highlight === 'red')
      .map(s => `- ${s.comment}`)
      .join('\n');
    const greenSegments = f.feedback.segments
      .filter(s => s.highlight === 'green')
      .map(s => `- ${s.comment}`)
      .join('\n');

    return `Звонок ${i + 1} (${f.date}, оценка: ${f.feedback.score}/10):
Статус: ${f.feedback.overall_status}
Раппорт: ${f.feedback.rapport_note}
Ошибки:\n${redSegments || '- нет'}
Сильные моменты:\n${greenSegments || '- нет'}`;
  }).join('\n\n---\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Ты — опытный руководитель отдела продаж. Проанализируй ${feedbacks.length} звонков менеджера "${managerName}" и составь подробный отчёт.

Найди повторяющиеся паттерны — как ошибки, так и сильные стороны. Дай конкретные рекомендации по дообучению.

Верни результат строго в JSON-формате:
{
  "recurring_mistakes": [
    {
      "pattern": "Описание повторяющейся ошибки",
      "frequency": "В X из Y звонков",
      "examples": ["Конкретный пример из звонка 1", "Пример из звонка 3"],
      "impact": "Как это влияет на результат"
    }
  ],
  "strengths": [
    {
      "pattern": "Описание сильной стороны",
      "frequency": "В X из Y звонков",
      "examples": ["Конкретный пример"]
    }
  ],
  "training_recommendations": [
    {
      "area": "Область для развития",
      "action": "Конкретное действие для улучшения",
      "priority": "high" или "medium" или "low"
    }
  ],
  "overall_trend": "Общий вывод о динамике и уровне менеджера",
  "score_trend": "improving" или "declining" или "stable"
}

Данные по звонкам:

${summaries}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Не удалось сгенерировать отчёт');
  }

  return JSON.parse(jsonMatch[0]);
}
