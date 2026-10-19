import type { Task, TaskCategory, TaskPriority } from '@/features/tasks/types'

export const PRIORITY_LABELS: Record<TaskPriority, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' }
export const PRIORITY_TONE: Record<TaskPriority, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-muted text-muted-foreground',
}
export const CATEGORY_LABELS: Record<TaskCategory | 'planning', string> = {
  clinical: 'Clínico', admin: 'Administrativo', financial: 'Financeiro', contact: 'Contato', preparation: 'Preparação', planning: 'Planejamento', other: 'Outros',
}

/** Vencida = tem prazo anterior a hoje e não está concluída. */
export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  return task.due_date.slice(0, 10) < new Date().toLocaleDateString('sv-SE')
}
