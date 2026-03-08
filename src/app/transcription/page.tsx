import CallPage from '@/components/CallPage';

export default function TranscriptionPage() {
  return (
    <CallPage
      mode="transcription"
      title="Транскрибация"
      subtitle="Только расшифровка аудио без анализа"
      promptName={null}
    />
  );
}
