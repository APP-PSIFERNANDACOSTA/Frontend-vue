import type { Payment } from '@/features/payments/types'
import type { Session } from '@/features/sessions/types'

export interface MonthSessionStats {
  completed: number
  no_show: number
  cancelled: number
  rescheduled: number
  scheduled: number
}

export function monthSessionStats(sessions: Session[]): MonthSessionStats {
  const count = (s: Session['status']) => sessions.filter((x) => x.status === s).length
  return {
    completed: count('completed'),
    no_show: count('no_show'),
    cancelled: count('cancelled'),
    rescheduled: count('rescheduled'),
    scheduled: count('scheduled'),
  }
}

/**
 * Taxa de comparecimento = realizadas / (realizadas + faltas). `null` quando ainda não há base.
 * (No app antigo as sessões futuras agendadas entravam no denominador e derrubavam a taxa no meio do mês.)
 */
export function attendanceRate(stats: MonthSessionStats): number | null {
  const base = stats.completed + stats.no_show
  return base === 0 ? null : Math.round((stats.completed / base) * 100)
}

export const sumPayments = (payments: Payment[]) => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

/** Variação percentual de `current` contra `previous`; `null` se não há base de comparação. */
export function variation(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null
}

/** Valor médio por sessão realizada. */
export const averagePerSession = (revenue: number, completed: number) => (completed > 0 ? revenue / completed : 0)
