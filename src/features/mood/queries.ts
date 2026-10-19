import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { moodApi } from './api'

export const moodKeys = { all: ['mood'] as const, today: ['mood', 'today'] as const }

export function useTodayMood() {
  return useQuery({ queryKey: moodKeys.today, queryFn: () => moodApi.today(), staleTime: 5 * 60_000 })
}

export function useSaveMood(onSuccess?: () => void) {
  return useApiMutation(moodApi.save, { error: 'Não foi possível salvar', invalidate: [moodKeys.all], onSuccess })
}

export function usePatientMood(patientId: MaybeRefOrGetter<number>, days: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...moodKeys.all, 'patient', toValue(patientId), toValue(days)] as const,
    queryFn: () => moodApi.forPatient(toValue(patientId), toValue(days)),
    placeholderData: keepPreviousData,
    enabled: () => toValue(patientId) > 0,
  })
}

/** Portal: os próprios registros (calendário). */
export function useMyMood(days: MaybeRefOrGetter<number>) {
  return useQuery({ queryKey: () => [...moodKeys.all, 'mine', toValue(days)] as const, queryFn: () => moodApi.mine(toValue(days)) })
}

/** Dashboard: respostas de hoje, média da semana e alertas. */
export function useMoodOverview() {
  return useQuery({ queryKey: [...moodKeys.all, 'overview'] as const, queryFn: () => moodApi.overview(), refetchInterval: 60_000 })
}
