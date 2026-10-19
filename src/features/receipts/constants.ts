import type { StatusMap } from '@/shared/components/status'
import { HEALTH_RECEIPT_STATUS_LABELS } from './types'

export const RECEIPT_STATUS_MAP: StatusMap = {
  pending: { label: HEALTH_RECEIPT_STATUS_LABELS.pending, tone: 'warning' },
  issued: { label: HEALTH_RECEIPT_STATUS_LABELS.issued, tone: 'success' },
}
