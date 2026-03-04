'use client';

import { useState, useEffect } from 'react';
import { Prompt } from '@/lib/types';
import { useToast } from './Toast';

interface PromptSelectorProps {
  onSelect: (promptId: string) => void;
  selectedId: string | null;
}

export default function PromptSelector({ onSelect, selectedId }: PromptSelectorProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/prompts')
      .then((r) => r.json())
      .then((data) => {
        setPrompts(data);
        if (data.length > 0 && !selectedId) onSelect(data[0].id);
      });
  }, []);

  const selectedPrompt = prompts.find((p) => p.id === selectedId);

  useEffect(() => {
    if (selectedPrompt) setEditText(selectedPrompt.text);
  }, [selectedPrompt]);

  const handleSave = async () => {
    if (!selectedPrompt) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/prompts/${selectedPrompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText }),
      });
      const updated = await res.json();
      setPrompts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setIsEditing(false);
      toast('Промпт сохранён');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-800
                     focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500
                     appearance-none cursor-pointer text-sm"
        >
          {prompts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-2.5 text-sm rounded-xl border border-zinc-200 text-zinc-500
                     hover:text-zinc-700 hover:border-zinc-300 transition-colors"
        >
          {isEditing ? 'Скрыть' : 'Редактировать'}
        </button>
      </div>

      {isEditing && selectedPrompt && (
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
              onClick={() => { setEditText(selectedPrompt.text); setIsEditing(false); }}
              className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || editText === selectedPrompt.text}
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
