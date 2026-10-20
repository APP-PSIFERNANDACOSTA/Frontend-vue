import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { pixApi } from './api'
import type { CreatePixChargeData, PixCharge } from './types'

export const pixKeys = {
  status: ['mercadopago', 'status'] as const,
  all: ['pix-charges'] as const,
  one: (id: number) => ['pix-charges', id] as const,
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
