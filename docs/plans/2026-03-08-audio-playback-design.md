# Дизайн: Аудиоплеер с привязкой к транскрипции

## Проблема
Руководители хотят переслушать конкретный момент звонка, не ища его вручную в записи. Сейчас аудио удаляется после обработки.

## Решение
Sticky аудиоплеер на странице сессии + клик по фрагменту транскрипции перематывает на нужный момент.

## Архитектура

### Хранение аудио
- Файл сохраняется в `/data/audio/{session_id}.{ext}` (Railway volume)
- В БД: колонка `audio_path TEXT` в sessions
- API: `GET /api/audio/{id}` — стриминг файла
- Автоочистка: файлы старше 30 дней удаляются при запуске + `audio_path = NULL`

### Таймкоды
- Deepgram возвращает `start`/`end` для каждого utterance
- Сохраняются в `transcript_json` как `{ speaker, text, start, end }`
- В `cleanTranscript()` (Claude) таймкоды прокидываются без изменений
- В `generateFeedback()` таймкоды сохраняются в segments

### UI
- **AudioPlayer** — sticky компонент под заголовком сессии
  - Play/pause, progress bar, текущее время
  - Не показывается если `audio_path = null` (файл удалён)
- **TranscriptView** — клик по сегменту → `onSegmentClick(startTime)` → перемотка
- **RawTranscriptView** — аналогично
- **Подсветка активного фрагмента** — outline на текущем сегменте при воспроизведении

### Изменяемые файлы
- `src/lib/db.ts` — миграция: `audio_path`, очистка старых файлов
- `src/lib/deepgram.ts` — сохранять `start`/`end` в DiarizedSegment
- `src/lib/anthropic.ts` — прокидывать таймкоды через cleanup и feedback
- `src/lib/types.ts` — обновить интерфейсы (start/end)
- `src/app/api/upload/route.ts` — сохранять аудиофайл на диск
- `src/app/api/audio/[id]/route.ts` — новый: стриминг аудио
- `src/app/session/[id]/page.tsx` — интеграция плеера
- `src/components/AudioPlayer.tsx` — новый: sticky плеер
- `src/components/TranscriptView.tsx` — клик по сегменту + подсветка
- `src/components/RawTranscriptView.tsx` — клик по сегменту + подсветка
