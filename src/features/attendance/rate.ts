/** Faixas de leitura da taxa de frequência. */
export function rateTone(rate: number | null): { label: string; text: string; bar: string; bg: string } {
  if (rate === null) return { label: 'Sem dados', text: 'text-muted-foreground', bar: 'bg-muted-foreground/40', bg: 'bg-muted' }
  if (rate >= 85) return { label: 'Ótima frequência', text: 'text-success', bar: 'bg-success', bg: 'bg-success/10' }
  if (rate >= 70) return { label: 'Atenção', text: 'text-warning', bar: 'bg-warning', bg: 'bg-warning/10' }
  return { label: 'Frequência baixa', text: 'text-destructive', bar: 'bg-destructive', bg: 'bg-destructive/10' }
}

export const PERIODS = [
  { value: 'all', label: 'Todo o período', days: null },
  { value: '365', label: 'Últimos 12 meses', days: 365 },
  { value: '90', label: 'Últimos 90 dias', days: 90 },
  { value: '30', label: 'Últimos 30 dias', days: 30 },
] as const
