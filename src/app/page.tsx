'use client';

import { useState } from 'react';
import PromptSelector from '@/components/PromptSelector';
import AudioUpload from '@/components/AudioUpload';
import ProcessingStatus from '@/components/ProcessingStatus';
import SessionList from '@/components/SessionList';

export default function Home() {
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10 animate-fade-in">
          <h1 className="text-2xl font-semibold tracking-tight">Анализ звонков</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Загрузите запись и получите AI-разбор
          </p>
        </header>

        <section className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <PromptSelector selectedId={selectedPromptId} onSelect={setSelectedPromptId} />
        </section>

        <section className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {processingSessionId ? (
            <ProcessingStatus sessionId={processingSessionId} />
          ) : (
            <AudioUpload
              promptId={selectedPromptId}
              onUploadStart={(id) => setProcessingSessionId(id)}
            />
          )}
        </section>

        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SessionList />
        </section>
      </div>
    </main>
  );
}
