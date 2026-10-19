import { useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import quizService from './api'
import { quizAssignmentService } from './assignment.api'
import type { CreateQuizData, SubmitQuizResponseData } from './types'

export const quizKeys = {
  all: ['quizzes'] as const,
  available: () => [...quizKeys.all, 'available'] as const,
  history: () => [...quizKeys.all, 'history'] as const,
}

/** Quizzes atribuídos ao paciente logado (já com as perguntas). */
export function useAvailableQuizzes() {
  return useQuery({
    queryKey: quizKeys.available(),
    queryFn: async () => {
      const res = await quizService.getAvailableQuizzes()
      if (!res.success) throw Object.assign(new Error(), { response: { data: { message: res.message } } })
      return res.quizzes ?? []
    },
  })
}

export function useSubmitQuiz(quizId: number, onSuccess?: () => void) {
  return useApiMutation(
    async (data: SubmitQuizResponseData) => {
      const res = await quizService.submitResponse(quizId, data)
      if (!res.success) throw Object.assign(new Error(), { response: { data: { message: res.message } } })
      return res
    },
    { error: 'Erro ao enviar respostas', invalidate: [quizKeys.all], onSuccess },
  )
}

const fail = (message?: string): never => {
  throw Object.assign(new Error(message), { response: { data: { message } } })
}

// ---- psicóloga ----
export function useQuizzes() {
  return useQuery({
    queryKey: [...quizKeys.all, 'list'] as const,
    queryFn: async () => {
      const res = await quizService.getAll({ per_page: 100 })
      if (!res.success) fail(res.message)
      return res.data ?? []
    },
  })
}

export function useQuiz(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...quizKeys.all, 'detail', toValue(id)] as const,
    queryFn: async () => {
      const res = await quizService.getById(toValue(id))
      if (!res.success || !res.quiz) fail(res.message || 'Quiz não encontrado')
      return res.quiz!
    },
    enabled: () => !!toValue(id),
  })
}

export function useQuizAssignments(quizId: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...quizKeys.all, 'assignments', toValue(quizId)] as const,
    queryFn: async () => (await quizAssignmentService.getAssignments({ quiz_id: toValue(quizId) })).data ?? [],
    enabled: () => !!toValue(quizId),
  })
}

export function useQuizAttempts(quizId: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...quizKeys.all, 'attempts', toValue(quizId)] as const,
    queryFn: async () => (await quizService.getQuizAttempts(toValue(quizId))).data ?? [],
    enabled: () => !!toValue(quizId),
  })
}

export function usePatientQuizResponses(quizId: MaybeRefOrGetter<number>, patientId: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...quizKeys.all, 'responses', toValue(quizId), toValue(patientId)] as const,
    queryFn: async () => {
      const res = await quizService.getPatientResponses(toValue(quizId), toValue(patientId))
      if (!res.success || !res.data) fail(res.message || 'Nenhuma resposta encontrada')
      return res.data!
    },
  })
}

export function useDeleteQuiz(onSuccess?: () => void) {
  return useApiMutation(
    async (id: number) => {
      const res = await quizService.delete(id)
      if (!res.success) fail(res.message || 'Erro ao excluir quiz')
    },
    { success: 'Quiz excluído com sucesso.', error: 'Erro ao excluir quiz', invalidate: [quizKeys.all], onSuccess },
  )
}

export interface SaveQuizVars {
  data: CreateQuizData
  patientIds: number[]
  dueDate?: string
  notes?: string
}

/** Cria/atualiza o quiz e, se houver pacientes selecionados, atualiza as atribuições. */
export function useSaveQuiz(id: number | null, onSuccess?: () => void) {
  return useApiMutation(
    async ({ data, patientIds, dueDate, notes }: SaveQuizVars) => {
      const res = id ? await quizService.update(id, data) : await quizService.create(data)
      if (!res.success) fail(res.message || 'Erro ao salvar quiz')
      const quizId = id ?? res.quiz!.id
      let assignError = false
      if (patientIds.length) {
        const a = await quizAssignmentService.assignToPatients(quizId, { patient_ids: patientIds, due_date: dueDate || undefined, notes: notes || undefined })
        assignError = !a.success
      }
      return { assignError }
    },
    {
      success: (r) => (r.assignError ? 'Quiz salvo, mas houve erro ao atribuir aos pacientes.' : id ? 'Quiz atualizado com sucesso.' : 'Quiz criado com sucesso.'),
      error: 'Erro ao salvar quiz',
      invalidate: [quizKeys.all],
      onSuccess,
    },
  )
}

export function useGenerateQuiz(onDone: (d: NonNullable<Awaited<ReturnType<typeof quizService.generateQuizWithAI>>['data']>) => void) {
  return useApiMutation(
    async (v: { topic: string; question_count: number }) => {
      const res = await quizService.generateQuizWithAI(v)
      if (!res.success || !res.data) fail(res.message || 'Erro ao gerar quiz com IA')
      return res.data!
    },
    { error: 'Erro ao gerar quiz com IA', onSuccess: (d) => onDone(d) },
  )
}

export function useGenerateQuestions(onDone: (questions: any[]) => void) {
  return useApiMutation(
    async (v: { type: string; count: number; question_type: string }) => {
      const res = await quizService.generateQuestionsWithAI(v)
      if (!res.success || !res.data?.questions) fail(res.message || 'Erro ao gerar perguntas com IA')
      return res.data!.questions
    },
    { error: 'Erro ao gerar perguntas com IA', onSuccess: (q) => onDone(q) },
  )
}
