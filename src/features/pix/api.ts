import apiClient from '@/shared/lib/api-client'
import type { BillingSettings, BillingToggleResult, CreatePixChargeData, ManualPaymentMethod, MercadoPagoSettingsData, MercadoPagoStatus, PixCharge, PixChargeStatus, PublicPixCharge } from './types'

interface Page<T> { data: T[]; current_page: number; last_page: number; total: number }

export const pixApi = {
  status: () => apiClient.get<MercadoPagoStatus>('/mercadopago/status'),
  saveSettings: async (data: MercadoPagoSettingsData) => (await apiClient.put<{ data: MercadoPagoStatus }>('/mercadopago/settings', data)).data,
  deleteSettings: async () => (await apiClient.delete<{ data: MercadoPagoStatus }>('/mercadopago/settings')).data,
  list: (params: { status?: PixChargeStatus; patient_id?: number; per_page?: number } = {}) => apiClient.get<Page<PixCharge>>('/pix-charges', { params }),
  get: async (id: number) => (await apiClient.get<{ data: PixCharge }>(`/pix-charges/${id}`)).data,
  create: async (data: CreatePixChargeData) => (await apiClient.post<{ data: PixCharge }>('/pix-charges', data)).data,
  cancel: async (id: number) => (await apiClient.post<{ data: PixCharge }>(`/pix-charges/${id}/cancel`)).data,
  update: async (id: number, data: { amount?: number; due_date?: string | null; description?: string }) => (await apiClient.put<{ data: PixCharge }>(`/pix-charges/${id}`, data)).data,
  markPaid: async (id: number, data: { payment_method: ManualPaymentMethod; payment_date: string }) => (await apiClient.post<{ data: PixCharge }>(`/pix-charges/${id}/mark-paid`, data)).data,

  billingSettings: () => apiClient.get<BillingSettings>('/billing/settings'),
  saveBillingSettings: (data: { enabled: boolean; start?: 'today' | 'next_month' }) => apiClient.put<BillingToggleResult>('/billing/settings', data),

  // link público (sem login) e portal do paciente
  publicGet: async (token: string) => (await apiClient.get<{ data: PublicPixCharge }>(`/public/pix/${token}`)).data,
  publicRenew: async (token: string) => (await apiClient.post<{ data: PublicPixCharge }>(`/public/pix/${token}/renew`)).data,
  mine: async () => (await apiClient.get<{ data: PublicPixCharge[] }>('/patient/pix-charges')).data,
}

/** Link que a psicóloga envia (usa o domínio onde o app está aberto). */
export const pixPaymentLink = (token: string) => `${window.location.origin}/pagamento/${token}`
