import type { SessionStatus } from '@/features/sessions/types'

/** Estilo do chip de sessão dentro da grade, por status. Agendada/remarcada = rosa escuro da marca. */
export const SESSION_CHIP: Record<SessionStatus, string> = {
  scheduled: 'bg-brand-100 text-brand-900 border-brand-700 dark:bg-brand-900/50 dark:text-brand-100 dark:border-brand-300',
  rescheduled: 'bg-brand-100 text-brand-900 border-brand-700 dark:bg-brand-900/50 dark:text-brand-100 dark:border-brand-300',
  completed: 'bg-success/15 text-success border-success',
  cancelled: 'bg-destructive/10 text-destructive border-destructive line-through',
  no_show: 'bg-warning/15 text-warning border-warning',
}

/** Cor do pontinho (visão compacta no celular). */
export const SESSION_DOT: Record<SessionStatus, string> = {
  scheduled: 'bg-brand-800 dark:bg-brand-300',
  rescheduled: 'bg-brand-800 dark:bg-brand-300',
  completed: 'bg-success',
  cancelled: 'bg-destructive',
  no_show: 'bg-warning',
}
