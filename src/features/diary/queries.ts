import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import diaryService from './api'
import type { CreateDiaryEntryData, DiaryFilters, WeeklyAnalysisResponse } from './types'

export const diaryKeys = {
  all: ['diary'] as const,
  patient: (patientId: number, filters: object) => [...diaryKeys.all, 'patient', patientId, filters] as const,
  mineCount: () => [...diaryKeys.all, 'mine', 'count'] as const,
}

export function usePatientDiary(patientId: MaybeRefOrGetter<number>, filters: MaybeRefOrGetter<Omit<DiaryFilters, 'patient_id'>>) {
  return useQuery({
    queryKey: () => diaryKeys.patient(toValue(patientId), toValue(filters)),
    queryFn: () => diaryService.getPatientEntries(toValue(patientId), toValue(filters)),
    placeholderData: keepPreviousData,
  })
}

/** Análise por IA dos últimos N dias. Erros (inclusive "sem entradas") viram toast. */
export function useWeeklyAnalysis(patientId: MaybeRefOrGetter<number>, onDone?: (r: WeeklyAnalysisResponse, days: number) => void) {
  return useApiMutation(
    async (days: number) => {
      const res = await diaryService.analyzeWeekly(toValue(patientId), days)
      if (!res.success || !res.analysis) throw Object.assign(new Error(), { response: { data: { message: res.message || 'Nenhuma entrada encontrada no período selecionado' } } })
      return res
    },
    { success: 'Análise concluída!', error: 'Erro na análise', onSuccess: (r, days) => onDone?.(r, days) },
  )
}

/** Entradas do paciente logado (portal). */
export function useMyDiary(filters: MaybeRefOrGetter<DiaryFilters> = {}) {
  return useQuery({
    queryKey: () => [...diaryKeys.all, 'mine', toValue(filters)] as const,
    queryFn: () => diaryService.getMyEntries(toValue(filters)),
    placeholderData: keepPreviousData,
  })
}

/** Backend define título e humor a partir do texto — o paciente só envia o conteúdo. */
export function useCreateDiaryEntry(onSuccess?: () => void) {
  return useApiMutation((content: string) => diaryService.create({ content } as CreateDiaryEntryData), {
    success: 'Sua entrada foi salva com sucesso!',
    error: 'Erro ao salvar entrada',
    invalidate: [diaryKeys.all],
    onSuccess,
  })
}

/** Todas as entradas (psicóloga), com filtro opcional por paciente. */
export function useAllDiary(filters: MaybeRefOrGetter<DiaryFilters>) {
  return useQuery({
    queryKey: () => [...diaryKeys.all, 'all', toValue(filters)] as const,
    queryFn: () => diaryService.getAllEntries(toValue(filters)),
    placeholderData: keepPreviousData,
  })
}

export function useDiaryEntry(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...diaryKeys.all, 'entry', toValue(id)] as const,
    queryFn: async () => {
      const res = await diaryService.getEntry(toValue(id))
      if (!res.success || !res.entry) throw new Error('Entrada não encontrada')
      return res.entry
    },
    enabled: () => !!toValue(id),
  })
}
