import type { StatusMap } from '@/shared/components/status'
import { CONTRACT_STATUS_LABELS } from './types'

export const CONTRACT_STATUS_MAP: StatusMap = {
  pending: { label: CONTRACT_STATUS_LABELS.pending, tone: 'warning' },
  signed: { label: CONTRACT_STATUS_LABELS.signed, tone: 'success' },
  expired: { label: CONTRACT_STATUS_LABELS.expired, tone: 'neutral' },
  inactive: { label: CONTRACT_STATUS_LABELS.inactive, tone: 'neutral' },
}
