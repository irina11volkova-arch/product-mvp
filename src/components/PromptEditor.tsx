'use client';

import { useState, useEffect } from 'react';
import { Prompt } from '@/lib/types';
import { useToast } from './Toast';

interface PromptEditorProps {
  promptName: string;
  onPromptReady: (promptId: string) => void;
}

export default function PromptEditor({ promptName, onPromptReady }: PromptEditorProps) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/prompts')
      .then((r) => r.json())
      .then((data: Prompt[]) => {
        const found = data.find((p) => p.name === promptName);
        if (found) {
          setPrompt(found);
          setEditText(found.text);
          onPromptReady(found.id);
        }
      });
  }, [promptName]);

  const handleSave = async () => {
    if (!prompt) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText }),
      });
      const updated = await res.json();
      setPrompt(updated);
      setIsEditing(false);
      toast('Промпт сохранён');
    } finally {
      setIsSaving(false);
    }
  };

  if (!prompt) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 font-medium">{prompt.name}</span>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1.5 text-sm rounded-xl border border-zinc-200 text-zinc-500
                     hover:text-zinc-700 hover:border-zinc-300 transition-colors"
        >
          {isEditing ? 'Скрыть' : 'Редактировать'}
        </button>
      </div>

      {isEditing && (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={6}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-700 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
                       resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setEditText(prompt.text); setIsEditing(false); }}
              className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || editText === prompt.text}
              className="px-4 py-1.5 text-sm rounded-lg bg-zinc-900 text-white font-medium
                         hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? 'Сохраняю...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
