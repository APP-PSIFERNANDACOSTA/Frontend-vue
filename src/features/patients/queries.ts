import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import patientService from './api'
import type { CreatePatientData, UpdatePatientData } from './types'

export const patientKeys = {
  all: ['patients'] as const,
  list: (params: object) => [...patientKeys.all, 'list', params] as const,
  detail: (id: number) => [...patientKeys.all, 'detail', id] as const,
  birthdays: (days: number) => [...patientKeys.all, 'birthdays', days] as const,
  me: () => [...patientKeys.all, 'me'] as const,
}

export interface PatientListParams {
  search?: string
  status?: 'active' | 'inactive' | 'all'
  page?: number
  per_page?: number
}

export function usePatients(params: MaybeRefOrGetter<PatientListParams>) {
  return useQuery({
    queryKey: () => patientKeys.list(toValue(params)),
    queryFn: () => patientService.getAll(toValue(params)),
    placeholderData: keepPreviousData,
  })
}

export function usePatient(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => patientKeys.detail(toValue(id)),
    queryFn: () => patientService.getById(toValue(id)),
    enabled: () => !!toValue(id),
  })
}

export function useCreatePatient(onSuccess?: () => void) {
  return useApiMutation((data: CreatePatientData) => patientService.create(data), {
    success: 'Paciente cadastrado com sucesso!',
    error: 'Erro ao cadastrar paciente',
    invalidate: [patientKeys.all],
    onSuccess,
  })
}

export function useUpdatePatient(id: MaybeRefOrGetter<number>, onSuccess?: () => void) {
  return useApiMutation((data: UpdatePatientData) => patientService.update(toValue(id), data), {
    success: (res) =>
      (res.removed_sessions_count ?? 0) > 0
        ? `Paciente atualizado. ${res.removed_sessions_count} sessão(ões) removida(s) da agenda.`
        : 'Paciente atualizado com sucesso!',
    error: 'Erro ao atualizar paciente',
    invalidate: [patientKeys.all],
    onSuccess,
  })
}

/** Perfil do paciente logado (portal). */
export function useMyProfile() {
  return useQuery({ queryKey: patientKeys.me(), queryFn: () => patientService.getMyProfile() })
}

export function useUpdateMyProfile(onSuccess?: () => void) {
  return useApiMutation((data: UpdatePatientData) => patientService.updateMyProfile(data), {
    success: 'Seus dados foram atualizados com sucesso.',
    error: 'Não foi possível salvar suas alterações',
    invalidate: [patientKeys.me()],
    onSuccess,
  })
}

/** Todos os pacientes ativos (para seletores). */
export function useActivePatients() {
  return useQuery({
    queryKey: [...patientKeys.all, 'active-options'] as const,
    queryFn: async () => (await patientService.getAll({ status: 'active', per_page: 1000 })).patients?.data ?? [],
    staleTime: 60_000,
  })
}

export function useUpcomingBirthdays(days: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => patientKeys.birthdays(toValue(days)),
    queryFn: async () => (await patientService.getUpcomingBirthdays(toValue(days))).birthdays,
    placeholderData: keepPreviousData,
  })
}
