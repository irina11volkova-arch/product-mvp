import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    migrate(db);
    seed(db);
  }
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      prompt_id TEXT,
      transcript_json TEXT,
      feedback_json TEXT,
      error_message TEXT,
      manager_name TEXT,
      score INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (prompt_id) REFERENCES prompts(id)
    );
  `);

  // Migration: add manager_name and score columns if they don't exist
  const columns = db.prepare("PRAGMA table_info(sessions)").all() as { name: string }[];
  const columnNames = columns.map(c => c.name);
  if (!columnNames.includes('manager_name')) {
    db.exec('ALTER TABLE sessions ADD COLUMN manager_name TEXT');
  }
  if (!columnNames.includes('score')) {
    db.exec('ALTER TABLE sessions ADD COLUMN score INTEGER');
  }
}

function seed(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM prompts').get() as { c: number };
  if (count.c > 0) return;

  const prompts = [
    {
      id: uuidv4(),
      name: 'Настя — разбор с менеджером по продажам',
      text: `Ты — опытный руководитель отдела продаж. Проанализируй транскрипцию звонка менеджера по продажам.

Оцени:
1. Установление контакта: как менеджер начал разговор, был ли раппорт
2. Выявление потребностей: задавал ли правильные вопросы
3. Презентация: насколько убедительно рассказал о продукте/услуге
4. Отработка возражений: как реагировал на сомнения клиента
5. Закрытие: предложил ли следующий шаг

Подсвети зелёным фрагменты, где менеджер действовал профессионально.
Подсвети красным фрагменты, где менеджер допустил ошибки или упустил возможность.
Для каждого подсвеченного фрагмента напиши конкретный комментарий: что именно хорошо или плохо и почему.
Отдельно напиши, был ли установлен контакт/раппорт между менеджером и клиентом.
Дай общий статус результата звонка простым языком (без процентов и цифр).`,
    },
    {
      id: uuidv4(),
      name: 'Ира — разбор с менеджером по партнёрке',
      text: `Ты — опытный руководитель партнёрской программы. Проанализируй транскрипцию звонка менеджера по партнёрской программе.

Оцени:
1. Установление раппорта: создал ли менеджер эмоциональную связь с потенциальным партнёром
2. Tone of voice: где менеджер был в хорошем, доброжелательном состоянии, а где нет
3. Питч партнёрства: была ли продана идея стать партнёром, захотел ли клиент зайти на обучение и дозарабатывать
4. Отработка возражений: как менеджер реагировал на сомнения
5. Частые возражения: выдели возражения, которые клиент озвучил

Подсвети зелёным фрагменты, где менеджер действовал отлично (хороший тон, удачные шутки, сильный питч).
Подсвети красным фрагменты, где менеджер ошибся (плохой тон, слабый аргумент, упущенное возражение).
Для каждого подсвеченного фрагмента напиши конкретный комментарий.
Отдельно оцени, был ли установлен раппорт и эмоциональная связь.
Дай общий статус результата звонка простым языком (без процентов и цифр).`,
    },
  ];

  const insert = db.prepare(
    "INSERT INTO prompts (id, name, text, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))"
  );

  for (const p of prompts) {
    insert.run(p.id, p.name, p.text);
  }
}
