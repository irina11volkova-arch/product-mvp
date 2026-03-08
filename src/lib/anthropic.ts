import Anthropic from '@anthropic-ai/sdk';
import { FeedbackResult, EmployeeReportResult } from './types';

const client = new Anthropic();

interface TranscriptInput {
  speaker: number;
  text: string;
  start?: number;
  end?: number;
}

function restoreTimestamps<T extends { id?: number }>(
  items: T[],
  sources: TranscriptInput[]
): (T & { start: number; end: number })[] {
  return items.map((item, i) => {
    const originalIdx = item.id ?? i;
    if (originalIdx < 0 || originalIdx >= sources.length) {
      console.warn(`[restoreTimestamps] id ${item.id} out of range (${sources.length} segments), using fallback`);
      return { ...item, start: 0, end: 0 };
    }
    const original = sources[originalIdx];
    return { ...item, start: original?.start ?? 0, end: original?.end ?? 0 };
  });
}

export async function cleanTranscript(segments: TranscriptInput[]): Promise<TranscriptInput[]> {
  const rawText = segments
    .map((s, i) => `[${i}] Спикер ${s.speaker + 1}: ${s.text}`)
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

ВАЖНО: каждая реплика имеет номер [id]. Ты ОБЯЗАН вернуть этот id в ответе для каждой реплики. Не объединяй и не пропускай реплики.

Верни результат строго в JSON-формате — массив объектов:
[{"id": 0, "speaker": 0, "text": "очищенный текст"}, ...]

Нумерация спикеров начинается с 0.

Транскрипция:
${rawText}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return segments;

  try {
    const cleaned = JSON.parse(jsonMatch[0]) as (TranscriptInput & { id?: number })[];
    return restoreTimestamps(cleaned, segments).map(({ id, ...rest }) => rest);
  } catch {
    return segments;
  }
}

export async function generateFeedback(
  segments: TranscriptInput[],
  promptText: string
): Promise<FeedbackResult> {
  const transcript = segments
    .map((s, i) => `[${i}] Спикер ${s.speaker + 1}: ${s.text}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `${promptText}

ПРАВИЛА ОПРЕДЕЛЕНИЯ ИМЁН:
Спикер 1 — это всегда менеджер. Спикер 2 — клиент.
- Если спикер ПРЕДСТАВЛЯЕТСЯ сам ("Это Ульяна", "Меня зовут Иван", "Алексей, добрый день") — это ЕГО имя.
- Если спикер ОБРАЩАЕТСЯ к собеседнику ("Сергей Николаевич?", "Здравствуйте, Мария") — это имя СОБЕСЕДНИКА, а не говорящего.
- Если спикер 1 спрашивает "Сергей Николаевич?" — значит client_name = Сергей Николаевич, а НЕ manager_name.
- Если спикер 1 говорит "Это Ульяна" — значит manager_name = Ульяна.
- Если имя не удалось определить, используй "Менеджер" или "Клиент".

Верни результат строго в JSON-формате:
{
  "overall_status": "Общий статус звонка простым языком, без цифр и процентов",
  "rapport_note": "Оценка установления контакта/раппорта между менеджером и клиентом",
  "client_name": "Имя клиента или 'Клиент'",
  "manager_name": "Имя менеджера или 'Менеджер'",
  "score": число от 1 до 10 — общая оценка качества звонка менеджера,
  "segments": [
    {
      "id": 0,
      "speaker": "Спикер 1",
      "text": "текст фрагмента",
      "highlight": "green" или "red" или null,
      "comment": "комментарий что хорошо/плохо и почему" или null
    }
  ]
}

ВАЖНО: каждая реплика в транскрипции имеет номер [id]. Ты ОБЯЗАН вернуть этот id в каждом элементе segments. Не пропускай реплики — каждая должна быть в ответе. Для реплик без замечаний highlight и comment = null.

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

  result.segments = restoreTimestamps(
    result.segments as (typeof result.segments[number] & { id?: number })[],
    segments
  );

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
