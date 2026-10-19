import { keepPreviousData, useMutation, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import contractService from './api'
import type { Contract, CreateContractData, SignContractData } from './types'

export const contractKeys = {
  all: ['contracts'] as const,
  byPatient: (patientId: number) => [...contractKeys.all, 'patient', patientId] as const,
}

export function usePatientContracts(patientId: MaybeRefOrGetter<number>, enabled: MaybeRefOrGetter<boolean> = true) {
  return useQuery({
    queryKey: () => contractKeys.byPatient(toValue(patientId)),
    queryFn: async () => (await contractService.getPatientContracts(toValue(patientId))).contracts ?? [],
    enabled: () => toValue(enabled) && !!toValue(patientId),
  })
}

/** Contratos do paciente logado (portal). */
export function useMyContracts() {
  return useQuery({
    queryKey: [...contractKeys.all, 'mine'] as const,
    queryFn: async () => (await contractService.getMyContracts()).contracts ?? [],
  })
}

export function useContract(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...contractKeys.all, 'detail', toValue(id)] as const,
    queryFn: async () => {
      const res = await contractService.getById(toValue(id))
      if (!res.success) throw new Error('Contrato não encontrado')
      return res.contract
    },
    enabled: () => !!toValue(id),
  })
}

/* ── Psicóloga: lista e ações ─────────────────────────────────────────── */

export function useContracts(status: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: () => [...contractKeys.all, 'list', toValue(status)] as const,
    queryFn: async () => (await contractService.getAll(toValue(status) === 'all' ? undefined : toValue(status))).contracts ?? [],
    placeholderData: keepPreviousData,
  })
}

const invalidate = [contractKeys.all]

export function useCreateContract(onSuccess?: (c: Contract) => void) {
  return useApiMutation(
    async (d: CreateContractData) => {
      const res = await contractService.create(d)
      if (!res.success) throw Object.assign(new Error(), { response: { data: { message: res.message } } })
      return res.contract
    },
    { error: 'Erro ao criar contrato', invalidate, onSuccess: (c) => onSuccess?.(c) },
  )
}

export function useResendContract() {
  return useApiMutation((id: number) => contractService.resend(id), { success: 'Email reenviado! O link do contrato foi reenviado por email.', error: 'Erro ao reenviar' })
}

export function useInactivateContract() {
  return useApiMutation((id: number) => contractService.inactivate(id), { success: 'Contrato inativado com sucesso.', error: 'Erro ao inativar', invalidate })
}

export function useDeleteContract(onSuccess?: () => void) {
  return useApiMutation((id: number) => contractService.delete(id), { success: 'Contrato excluído com sucesso.', error: 'Erro ao excluir contrato', invalidate, onSuccess })
}

export function useDownloadContractPdf() {
  return useApiMutation((id: number) => contractService.downloadPdf(id), { success: 'PDF baixado com sucesso!', error: 'Erro ao baixar PDF' })
}

/* ── Público (assinatura por token) ──────────────────────────────────── */

export function useContractByToken(token: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: () => [...contractKeys.all, 'token', toValue(token)] as const,
    queryFn: () => contractService.getByToken(toValue(token)),
    retry: false,
    staleTime: Infinity,
  })
}

export function useSignContract(token: MaybeRefOrGetter<string>) {
  return useMutation({ mutationFn: (d: SignContractData) => contractService.sign(toValue(token), d) })
}
