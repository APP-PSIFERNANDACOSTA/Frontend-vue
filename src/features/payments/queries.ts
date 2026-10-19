import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import paymentService from './api'
import type { CreatePaymentData, UpdatePaymentData } from './types'

export const paymentKeys = {
  all: ['payments'] as const,
  mine: () => [...paymentKeys.all, 'mine'] as const,
  list: (params: object) => [...paymentKeys.all, 'list', params] as const,
  detail: (id: number) => [...paymentKeys.all, 'detail', id] as const,
}

/** Pagamentos do paciente logado (portal). */
export function useMyPayments() {
  return useQuery({ queryKey: paymentKeys.mine(), queryFn: () => paymentService.getMyPayments() })
}

export function useDownloadMyReceipt() {
  return useApiMutation((id: number) => paymentService.downloadMyReceipt(id), { error: 'Erro ao baixar recibo' })
}

export function useDownloadMyHealthReceipt() {
  return useApiMutation((id: number) => paymentService.downloadMyHealthReceipt(id), { error: 'Erro ao baixar Recibo de Saúde' })
}

/* ── Psicóloga ─────────────────────────────────────────────────────────── */

export interface PaymentListParams {
  patient_id?: number
  start_date?: string
  end_date?: string
  payment_method?: string
}

export function usePayments(params: MaybeRefOrGetter<PaymentListParams>) {
  return useQuery({
    queryKey: () => paymentKeys.list(toValue(params)),
    queryFn: () => paymentService.getAll(toValue(params)),
    placeholderData: keepPreviousData,
  })
}

export function usePayment(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => paymentKeys.detail(toValue(id)),
    queryFn: () => paymentService.getById(toValue(id)),
    enabled: () => !!toValue(id),
  })
}

// pagamentos mexem no financeiro e nos recibos de saúde
const invalidate = [paymentKeys.all, ['dashboard'], ['health-receipts']]

export function useCreatePayment(onSuccess?: () => void) {
  return useApiMutation((d: CreatePaymentData) => paymentService.create(d), {
    success: 'Pagamento cadastrado! O recibo foi gerado automaticamente.',
    error: 'Erro ao cadastrar pagamento',
    invalidate,
    onSuccess,
  })
}

export function useUpdatePayment(id: MaybeRefOrGetter<number>, onSuccess?: () => void) {
  return useApiMutation((d: UpdatePaymentData) => paymentService.update(toValue(id), d), {
    success: 'Pagamento atualizado com sucesso!',
    error: 'Erro ao atualizar pagamento',
    invalidate,
    onSuccess,
  })
}

export function useDeletePayment(onSuccess?: () => void) {
  return useApiMutation((id: number) => paymentService.delete(id), {
    success: 'Pagamento excluído com sucesso.',
    error: 'Erro ao excluir pagamento',
    invalidate,
    onSuccess,
  })
}

export function useDownloadReceipt() {
  return useApiMutation((id: number) => paymentService.downloadReceipt(id), { error: 'Erro ao baixar recibo' })
}
