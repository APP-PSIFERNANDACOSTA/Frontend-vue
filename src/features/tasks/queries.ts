import { useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import taskService from './api'
import type { Task, TaskStatus } from './types'

export const taskKeys = {
  all: ['tasks'] as const,
  pending: () => [...taskKeys.all, 'pending'] as const,
}

/** Tarefas em aberto (a fazer + em andamento), para o dashboard. */
export function usePendingTasks(limit = 8) {
  return useQuery({
    queryKey: [...taskKeys.pending(), limit],
    queryFn: async () => {
      const { tasks } = await taskService.getAll({ status: 'all', per_page: 50 })
      return (tasks ?? []).filter((t) => t.status === 'todo' || t.status === 'in-progress').slice(0, limit)
    },
    refetchInterval: 60_000,
  })
}

export function useCompleteTask() {
  return useApiMutation((id: number) => taskService.complete(id), { error: 'Não foi possível marcar a tarefa como concluída', invalidate: [taskKeys.all] })
}

/** Todas as tarefas + estatísticas (quadro kanban). O filtro por status/busca é feito no cliente. */
export function useTasks(search: MaybeRefOrGetter<string> = '') {
  return useQuery({
    queryKey: () => [...taskKeys.all, 'board', toValue(search)] as const,
    queryFn: () => taskService.getAll({ status: 'all', search: toValue(search).trim() || undefined, per_page: 500 }),
  })
}

export type TaskInput = Partial<Pick<Task, 'title' | 'description' | 'priority' | 'category' | 'due_date' | 'patient_id'>>

/** `id` é lido no momento de salvar: null cria, número edita. */
export function useSaveTask(id: MaybeRefOrGetter<number | null>, onSuccess?: () => void) {
  return useApiMutation(
    (v: TaskInput) => {
      const data = { title: v.title?.trim(), description: v.description || undefined, priority: v.priority, category: v.category, due_date: v.due_date || undefined, patient_id: v.patient_id || undefined }
      const taskId = toValue(id)
      return taskId ? taskService.update(taskId, data as never) : taskService.create(data as never)
    },
    { success: () => (toValue(id) ? 'Tarefa atualizada' : 'Tarefa criada'), error: 'Não foi possível salvar a tarefa', invalidate: [taskKeys.all], onSuccess },
  )
}

export function useDeleteTask() {
  return useApiMutation((id: number) => taskService.delete(id), { success: 'Tarefa excluída', error: 'Não foi possível excluir a tarefa', invalidate: [taskKeys.all] })
}

/** Move a tarefa de coluna (concluir usa o endpoint próprio). */
export function useMoveTask() {
  return useApiMutation(
    ({ id, status }: { id: number; status: TaskStatus }) => (status === 'done' ? taskService.complete(id) : taskService.update(id, { status })),
    { error: 'Não foi possível mover a tarefa', invalidate: [taskKeys.all] },
  )
}
