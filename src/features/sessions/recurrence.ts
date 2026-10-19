import { addSaoPauloWallDateTime, sessionDateTimeToApiIso } from '@/shared/lib/datetime-br'
import type { CreateSessionData, SessionStatus } from './types'

export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly'

export interface SessionDraft {
  date: string // yyyy-MM-dd (Brasília)
  time: string // HH:mm (Brasília)
  duration: number | null
  status: SessionStatus
  notes: string
}

export const emptyDraft = (): SessionDraft => ({ date: '', time: '', duration: 50, status: 'scheduled', notes: '' })

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  weekly: 'semanal',
  biweekly: 'quinzenal (a cada 2 semanas)',
  monthly: 'mensal',
}

export const RECURRENCE_COUNTS: Record<RecurrenceType, { value: number; label: string }[]> = {
  weekly: [2, 4, 8, 12, 16, 24].map((n) => ({ value: n, label: `${n} sessões` })).concat([{ value: 52, label: '52 sessões (1 ano)' }]),
  biweekly: [2, 3, 4, 6, 8, 12].map((n) => ({ value: n, label: `${n} sessões` })),
  monthly: [2, 3, 4, 6].map((n) => ({ value: n, label: `${n} sessões` })).concat([
    { value: 12, label: '12 sessões (1 ano)' },
    { value: 24, label: '24 sessões (2 anos)' },
  ]),
}

export const defaultRecurrenceCount = (t: RecurrenceType) => (t === 'monthly' ? 6 : 4)

/**
 * Drafts → payload da API (ISO UTC). Recorrência expande a 1ª sessão mantendo o
 * mesmo horário de Brasília (quinzenal = +2 semanas, não +15 dias).
 */
export function buildSessionsPayload(
  drafts: SessionDraft[],
  recurrence?: { type: RecurrenceType; count: number },
): CreateSessionData[] {
  const toData = (d: SessionDraft, date = d.date, time = d.time): CreateSessionData => ({
    session_date: sessionDateTimeToApiIso(`${date}T${time}`),
    duration: d.duration || null,
    notes: d.notes || null,
    status: d.status || 'scheduled',
  })

  const out = drafts.map((d) => toData(d))
  if (recurrence && drafts.length === 1) {
    const base = drafts[0]
    for (let i = 1; i < recurrence.count; i++) {
      const step =
        recurrence.type === 'weekly'
          ? { kind: 'weeks' as const, count: i }
          : recurrence.type === 'biweekly'
            ? { kind: 'weeks' as const, count: i * 2 }
            : { kind: 'months' as const, count: i }
      const next = addSaoPauloWallDateTime(base.date, base.time || '09:00', step)
      out.push(toData(base, next.date, next.time))
    }
  }
  return out
}
