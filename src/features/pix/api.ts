import apiClient from '@/shared/lib/api-client'
import type { CreatePixChargeData, MercadoPagoStatus, PixCharge, PixChargeStatus } from './types'

interface Page<T> { data: T[]; current_page: number; last_page: number; total: number }

export const pixApi = {
  status: () => apiClient.get<MercadoPagoStatus>('/mercadopago/status'),
  list: (params: { status?: PixChargeStatus; patient_id?: number; per_page?: number } = {}) => apiClient.get<Page<PixCharge>>('/pix-charges', { params }),
  get: async (id: number) => (await apiClient.get<{ data: PixCharge }>(`/pix-charges/${id}`)).data,
  create: async (data: CreatePixChargeData) => (await apiClient.post<{ data: PixCharge }>('/pix-charges', data)).data,
  cancel: async (id: number) => (await apiClient.post<{ data: PixCharge }>(`/pix-charges/${id}/cancel`)).data,
}
