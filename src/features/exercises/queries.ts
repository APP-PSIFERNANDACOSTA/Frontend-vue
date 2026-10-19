import { useQuery } from '@tanstack/vue-query'
import type { Exercise } from './types'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import exerciseService from './api'

export const exerciseKeys = {
  all: ['exercises'] as const,
  mine: () => [...exerciseKeys.all, 'mine'] as const,
}

/** Exercícios liberados para o paciente logado (portal). */
export function useMyExercises() {
  return useQuery({ queryKey: exerciseKeys.mine(), queryFn: () => exerciseService.getMyExercises() })
}

export function useStartExercise() {
  return useApiMutation((id: number) => exerciseService.startExercise(id), { error: 'Não foi possível iniciar o exercício' })
}

export function useCompleteExercise(onSuccess?: () => void) {
  return useApiMutation(
    (v: { id: number; sessionId?: number; durationSeconds?: number; reps?: number }) =>
      exerciseService.completeExercise(v.id, { session_id: v.sessionId, duration_seconds_real: v.durationSeconds, reps_real: v.reps }),
    { success: 'Exercício concluído! Excelente, continue praticando!', error: 'Não foi possível registrar a conclusão', invalidate: [exerciseKeys.all], onSuccess },
  )
}

/** Todos os exercícios cadastrados (psicóloga). */
export function useExercises() {
  return useQuery({ queryKey: [...exerciseKeys.all, 'all'] as const, queryFn: () => exerciseService.getAll() })
}

export function useSaveExercise(id: number | null, onSuccess?: () => void) {
  return useApiMutation(
    (data: Partial<Exercise>) => (id ? exerciseService.update(id, data) : exerciseService.create(data)),
    { success: id ? 'Exercício atualizado' : 'Exercício criado', error: 'Erro ao salvar exercício', invalidate: [exerciseKeys.all], onSuccess },
  )
}

export function useToggleExercise() {
  return useApiMutation((id: number) => exerciseService.toggleActive(id), {
    success: (e) => (e.is_active ? 'Exercício ativado para os pacientes.' : 'Exercício desativado para os pacientes.'),
    error: 'Não foi possível atualizar o status',
    invalidate: [exerciseKeys.all],
  })
}
