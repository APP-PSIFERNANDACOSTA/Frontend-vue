import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { pixApi } from './api'
import type { CreatePixChargeData, MercadoPagoSettingsData, MercadoPagoStatus, PixCharge, PublicPixCharge } from './types'

export const pixKeys = {
  status: ['mercadopago', 'status'] as const,
  all: ['pix-charges'] as const,
  one: (id: number) => ['pix-charges', id] as const,
  public: (token: string) => ['pix-public', token] as const,
  mine: ['pix-charges', 'mine'] as const,
}

export function useMercadoPagoStatus() {
  return useQuery({ queryKey: pixKeys.status, queryFn: pixApi.status, staleTime: 60_000 })
}

export function usePixCharges(params: Ref<{ status?: PixCharge['status']; patient_id?: number }> = computed(() => ({}))) {
  return useQuery({ queryKey: computed(() => [...pixKeys.all, 'list', params.value]), queryFn: () => pixApi.list(params.value) })
}

/** Acompanha a cobrança: consulta a cada 5 s enquanto estiver pendente (o backend confirma no Mercado Pago). */
export function usePixCharge(id: Ref<number | null>, initial?: Ref<PixCharge | null>) {
  return useQuery({
    queryKey: computed(() => pixKeys.one(id.value ?? 0)),
    queryFn: () => pixApi.get(id.value!),
    enabled: computed(() => !!id.value),
    initialData: () => initial?.value ?? undefined,
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 5_000 : false),
    refetchIntervalInBackground: true,
  })
}

export function useCreatePixCharge(onCreated: (c: PixCharge) => void) {
  return useApiMutation((data: CreatePixChargeData) => pixApi.create(data), { error: 'Erro ao gerar o Pix', invalidate: [pixKeys.all], onSuccess: onCreated })
}

export function useCancelPixCharge() {
  const qc = useQueryClient()
  return useApiMutation((id: number) => pixApi.cancel(id), {
    success: 'Cobrança cancelada',
    error: 'Erro ao cancelar',
    invalidate: [pixKeys.all],
    onSuccess: (c) => qc.setQueryData(pixKeys.one(c.id), c),
  })
}

/** Link público / portal: acompanha pelo token (consulta a cada 5 s enquanto pendente). */
export function usePublicPixCharge(token: Ref<string | null>) {
  return useQuery({
    queryKey: computed(() => pixKeys.public(token.value ?? '')),
    queryFn: () => pixApi.publicGet(token.value!),
    enabled: computed(() => !!token.value),
    retry: (n, e: any) => e?.response?.status !== 404 && n < 2,
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 5_000 : false),
    refetchIntervalInBackground: true,
  })
}

export function useRenewPixCharge() {
  const qc = useQueryClient()
  return useApiMutation((token: string) => pixApi.publicRenew(token), {
    error: 'Não foi possível gerar um novo Pix',
    onSuccess: (c: PublicPixCharge) => {
      qc.setQueryData(pixKeys.public(c.token), c)
      qc.invalidateQueries({ queryKey: pixKeys.mine })
    },
  })
}

export function useMyPixCharges() {
  return useQuery({ queryKey: pixKeys.mine, queryFn: pixApi.mine, refetchInterval: 30_000 })
}

export function useSaveMercadoPagoSettings(onSaved?: () => void) {
  const qc = useQueryClient()
  return useApiMutation((data: MercadoPagoSettingsData) => pixApi.saveSettings(data), {
    success: 'Credenciais do Mercado Pago salvas',
    error: 'Não foi possível salvar',
    onSuccess: (s: MercadoPagoStatus) => (qc.setQueryData(pixKeys.status, s), onSaved?.()),
  })
}

export function useDeleteMercadoPagoSettings() {
  const qc = useQueryClient()
  return useApiMutation(() => pixApi.deleteSettings(), {
    success: 'Credenciais removidas',
    error: 'Não foi possível remover',
    onSuccess: (s: MercadoPagoStatus) => qc.setQueryData(pixKeys.status, s),
  })
}
