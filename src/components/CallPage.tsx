'use client';

import { useState } from 'react';
import { PageMode } from '@/lib/types';
import PromptEditor from '@/components/PromptEditor';
import AudioUpload from '@/components/AudioUpload';
import ProcessingStatus from '@/components/ProcessingStatus';
import SessionList from '@/components/SessionList';

interface CallPageProps {
  mode: PageMode;
  title: string;
  subtitle: string;
  promptName: string | null;
}

export default function CallPage({ mode, title, subtitle, promptName }: CallPageProps) {
  const [promptId, setPromptId] = useState<string | null>(null);
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10 animate-fade-in">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
        </header>

        {promptName && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <PromptEditor promptName={promptName} onPromptReady={setPromptId} />
          </section>
        )}

        <section className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {processingSessionId ? (
            <ProcessingStatus sessionId={processingSessionId} />
          ) : (
            <AudioUpload
              promptId={promptId}
              mode={mode}
              onUploadStart={(id) => setProcessingSessionId(id)}
            />
          )}
        </section>

        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SessionList mode={mode} />
        </section>
      </div>
    </main>
  );
}
