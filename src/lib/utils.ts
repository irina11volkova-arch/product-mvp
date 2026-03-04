export function scoreColor(score: number): string {
  if (score >= 7) return 'text-emerald-600 bg-emerald-50';
  if (score >= 5) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}
