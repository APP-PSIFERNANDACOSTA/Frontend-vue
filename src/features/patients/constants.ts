import { PAYMENT_TYPES } from './types'

export const paymentTypeLabel = (value?: string | null) =>
  PAYMENT_TYPES.find((t) => t.value === value)?.label ?? value ?? '—'

export const PATIENT_STATUS_MAP = {
  active: { label: 'Ativo', tone: 'success' },
  inactive: { label: 'Inativo', tone: 'neutral' },
} as const
