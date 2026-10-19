import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { normalizeBlobError } from '@/shared/lib/api-client'
import healthReceiptService from './api'
import type { UpdateHealthReceiptData } from './types'

export const receiptKeys = { all: ['health-receipts'] as const }

export interface ReceiptListParams {
  status?: 'pending' | 'issued'
  patient_id?: number
  start_date?: string
  end_date?: string
}

export function useHealthReceipts(params: MaybeRefOrGetter<ReceiptListParams>) {
  return useQuery({
    queryKey: () => [...receiptKeys.all, 'list', toValue(params)] as const,
    queryFn: () => healthReceiptService.getAll(toValue(params)),
    placeholderData: keepPreviousData,
  })
}

export function useHealthReceipt(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...receiptKeys.all, 'detail', toValue(id)] as const,
    queryFn: () => healthReceiptService.getById(toValue(id)),
    enabled: () => !!toValue(id),
  })
}

// emitir/editar recibo reflete no pagamento (badge "Recibo Saúde") e no portal do paciente
const invalidate = [receiptKeys.all, ['payments']]

export function useUpdateHealthReceipt(id: MaybeRefOrGetter<number>, onSuccess?: () => void) {
  return useApiMutation((d: UpdateHealthReceiptData) => healthReceiptService.update(toValue(id), d), {
    success: 'Recibo de Saúde atualizado com sucesso',
    error: 'Erro ao salvar',
    invalidate,
    onSuccess,
  })
}

export function useIssueHealthReceipt(id: MaybeRefOrGetter<number>, onSuccess?: () => void) {
  return useApiMutation((proof: File) => healthReceiptService.issue(toValue(id), proof), {
    success: 'Recibo de Saúde marcado como emitido',
    error: 'Erro ao emitir',
    invalidate,
    onSuccess,
  })
}

export function useExportPendingReceipts() {
  return useApiMutation((p: Omit<ReceiptListParams, 'status'>) => healthReceiptService.exportPendingPdf(p).catch(normalizeBlobError), {
    success: 'Relatório de recibos pendentes baixado com sucesso',
    error: 'Erro ao exportar',
  })
}

export function useDownloadReceiptProof() {
  return useApiMutation((id: number) => healthReceiptService.downloadProof(id).catch(normalizeBlobError), { error: 'Não foi possível baixar o comprovante' })
}
