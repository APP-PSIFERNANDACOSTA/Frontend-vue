import type { StatusMap } from '@/shared/components/status'
import { SESSION_STATUS_LABELS } from './types'

/** Status de sessão → badge (substitui SESSION_STATUS_COLORS com cores hardcoded). */
export const SESSION_STATUS_MAP: StatusMap = {
  scheduled: { label: SESSION_STATUS_LABELS.scheduled, tone: 'brand' },
  rescheduled: { label: SESSION_STATUS_LABELS.rescheduled, tone: 'brand' },
  completed: { label: SESSION_STATUS_LABELS.completed, tone: 'success' },
  cancelled: { label: SESSION_STATUS_LABELS.cancelled, tone: 'danger' },
  no_show: { label: SESSION_STATUS_LABELS.no_show, tone: 'warning' },
}
