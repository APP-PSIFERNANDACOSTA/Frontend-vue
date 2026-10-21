export type PixChargeStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'rejected' | 'refunded'
/** manual = avulsa; as outras nascem da agenda conforme a forma de pagamento do paciente */
export type PixChargeKind = 'manual' | 'session' | 'monthly' | 'biweekly'

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
  kind: PixChargeKind
  session_id: number | null
  period_start: string | null
  period_end: string | null
  /** vencimento (YYYY-MM-DD) */
  due_date: string | null
  sessions_count: number | null
  /** editada/cancelada à mão: a agenda não altera mais */
  locked: boolean
  overdue: boolean
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
  due_date: string | null
  overdue: boolean
  /** false quando não foi possível gerar o Pix agora (Mercado Pago fora/sem configuração) */
  pix_available?: boolean
  patient_first_name: string | null
  psychologist: { name: string | null; crp: string | null }
}

/** Campos que o painel de pagamento precisa (serve para as duas formas acima). */
export type PayableCharge = Pick<PublicPixCharge, 'amount' | 'description' | 'status' | 'qr_code' | 'expires_at' | 'paid_at' | 'can_renew'> & {
  qr_code_base64?: string | null
  due_date?: string | null
  overdue?: boolean
  pix_available?: boolean
}

export interface MercadoPagoSettingsData {
  access_token?: string
  public_key?: string
  /** "" remove */
  webhook_secret?: string
}

export interface BillingSettings {
  enabled: boolean
  starts_on: string | null
  open_total: number
  open_count: number
  patients_without_price: number
  monthly_without_day: number
}

export type ManualPaymentMethod = 'pix' | 'credit_card' | 'boleto'

export interface BillingToggleResult {
  data: BillingSettings
  /** só ao ligar: o que a análise da agenda gerou agora */
  summary: { patients: number; generated_count: number; generated_total: number } | null
}
