import { useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import sessionReportService from '@/features/sessions/report.api'
import recordService from './api'
import type { CreateRecordData, UpdateRecordData } from './types'

export const recordKeys = { all: ['records'] as const }

export function useRecords(search: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: () => [...recordKeys.all, 'list', toValue(search)] as const,
    queryFn: () => recordService.getAll(toValue(search) ? { search: toValue(search) } : {}),
  })
}

export function useRecord(id: MaybeRefOrGetter<number>) {
  return useQuery({ queryKey: () => [...recordKeys.all, 'detail', toValue(id)] as const, queryFn: () => recordService.getById(toValue(id)), enabled: () => !!toValue(id) })
}

/** Relatórios de sessão do paciente, para vincular ao prontuário. */
export function usePatientSessionReports(patientId: MaybeRefOrGetter<number | null>) {
  return useQuery({
    queryKey: () => [...recordKeys.all, 'reports', toValue(patientId)] as const,
    queryFn: () => sessionReportService.getAll(toValue(patientId)!),
    enabled: () => !!toValue(patientId),
  })
}

export function useSaveRecord(id: number | null, onSuccess?: () => void) {
  return useApiMutation(
    (data: CreateRecordData | UpdateRecordData) => (id ? recordService.update(id, data as UpdateRecordData) : recordService.create(data as CreateRecordData)),
    { success: id ? 'Prontuário atualizado' : 'Prontuário criado', error: 'Não foi possível salvar o prontuário', invalidate: [recordKeys.all], onSuccess },
  )
}
