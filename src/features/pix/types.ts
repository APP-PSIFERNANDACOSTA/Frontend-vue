export type PixChargeStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'rejected' | 'refunded'

export interface PixCharge {
  id: number
  uuid: string
  psychologist_id: number
  patient_id: number | null
  payment_id: number | null
  amount: string
  description: string
  status: PixChargeStatus
  provider: 'mercadopago'
  provider_payment_id: string | null
  provider_status: string | null
  provider_status_detail: string | null
  /** Pix copia e cola */
  qr_code: string | null
  /** PNG em base64 (só vem enquanto pendente, em show/store) */
  qr_code_base64?: string | null
  ticket_url: string | null
  payer_name: string | null
  payer_email: string | null
  expires_at: string | null
  paid_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  patient?: { id: number; name: string } | null
}

export interface CreatePixChargeData {
  amount: number
  description?: string
  patient_id?: number | null
  payer_email?: string
  payer_name?: string
  payer_document?: string
  expires_in_minutes?: number
  metadata?: Record<string, unknown>
}

export interface MercadoPagoStatus {
  configured: boolean
  sandbox: boolean
  webhook_url: string | null
  webhook_signature: boolean
  account: { id: number | null; nickname: string | null; email: string | null; name: string | null } | null
  error: string | null
}
