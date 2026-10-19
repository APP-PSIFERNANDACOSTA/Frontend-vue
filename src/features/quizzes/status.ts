import type { StatusMap } from '@/shared/components/status'

export const QUIZ_STATUS_MAP: StatusMap = {
  active: { label: 'Ativo', tone: 'success' },
  inactive: { label: 'Inativo', tone: 'neutral' },
  draft: { label: 'Rascunho', tone: 'warning' },
}

export const ASSIGNMENT_STATUS_MAP: StatusMap = {
  assigned: { label: 'Atribuído', tone: 'info' },
  in_progress: { label: 'Em andamento', tone: 'warning' },
  completed: { label: 'Concluído', tone: 'success' },
  expired: { label: 'Expirado', tone: 'danger' },
}

export const ATTEMPT_STATUS_MAP: StatusMap = {
  completed: { label: 'Concluída', tone: 'success' },
  in_progress: { label: 'Em andamento', tone: 'warning' },
  abandoned: { label: 'Abandonada', tone: 'danger' },
}

const TYPE_LABELS: Record<string, string> = { anxiety: 'Ansiedade', sleep: 'Sono', mood: 'Humor', self_esteem: 'Autoestima', custom: 'Personalizado' }
/** O tipo é texto livre (tema); os valores antigos em inglês ganham tradução. */
export const quizTypeLabel = (t: string) => TYPE_LABELS[t] ?? t

export const QUESTION_TYPE_LABELS: Record<string, string> = { multiple_choice: 'Múltipla escolha', scale: 'Escala', text: 'Texto livre' }
