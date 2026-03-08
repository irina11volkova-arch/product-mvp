import CallPage from '@/components/CallPage';

export default function SalesPage() {
  return (
    <CallPage
      mode="sales"
      title="Отдел продаж"
      subtitle="Анализ звонков менеджеров по продажам"
      promptName="Настя — разбор с менеджером по продажам"
    />
  );
}
