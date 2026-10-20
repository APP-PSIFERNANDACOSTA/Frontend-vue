export type PixChargeStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'rejected' | 'refunded'

export interface PixCharge {
  id: number
  uuid: string
  /** token do link público /pagamento/{token} */
  token: string
  public_url: string
  /** QR venceu sem pagamento: dá para gerar outro na mesma cobrança */
  can_renew: boolean
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
  /** de onde vêm as credenciais: painel (Integrações) ou .env do servidor */
  source: 'panel' | 'env' | null
  sandbox: boolean
  /** token mascarado, ex. "APP_USR-1116…6906" */
  access_token_hint: string | null
  public_key: string | null
  webhook_url: string | null
  webhook_signature: boolean
  account: { id: number | null; nickname: string | null; email: string | null; name: string | null } | null
  error: string | null
}

/** O que o link público e o portal recebem (só o necessário para pagar). */
export interface PublicPixCharge {
  token: string
  amount: string
  description: string
  status: PixChargeStatus
  qr_code: string | null
  qr_code_base64: string | null
  expires_at: string | null
  paid_at: string | null
  created_at: string | null
  can_renew: boolean
  patient_first_name: string | null
  psychologist: { name: string | null; crp: string | null }
}

/** Campos que o painel de pagamento precisa (serve para as duas formas acima). */
export type PayableCharge = Pick<PublicPixCharge, 'amount' | 'description' | 'status' | 'qr_code' | 'expires_at' | 'paid_at' | 'can_renew'> & { qr_code_base64?: string | null }

export interface MercadoPagoSettingsData {
  access_token?: string
  public_key?: string
  /** "" remove */
  webhook_secret?: string
}
