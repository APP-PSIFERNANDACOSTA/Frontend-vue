import { addDays, endOfMonth, startOfMonth } from 'date-fns'
import type { Contract } from '@/features/contracts/types'

const day0 = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Quantas vezes algum dos `daysOfMonth` cai dentro do intervalo [start, end]. */
export function countMonthlyDayOccurrences(daysOfMonth: number[], start: Date, end: Date): number {
  const days = new Set(daysOfMonth)
  const last = day0(end)
  let count = 0
  for (const cursor = day0(start); cursor <= last; cursor.setDate(cursor.getDate() + 1)) if (days.has(cursor.getDate())) count++
  return count
}

/** Estimativa de cobranças de um contrato no período. */
export function occurrencesForPeriod(contract: Pick<Contract, 'payment_type' | 'payment_day'>, start: Date, end: Date): number {
  const a = day0(start)
  const b = day0(end)
  const periodDays = Math.max(1, Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1)
  switch (contract.payment_type) {
    case 'por_sessao':
      return Math.max(1, Math.ceil(periodDays / 7)) // estimativa: 1 sessão por semana por contrato
    case 'quinzenal':
      return countMonthlyDayOccurrences([15, 30], a, b) // ciclos nos dias 15 e 30
    case 'mensal':
      return contract.payment_day ? countMonthlyDayOccurrences([contract.payment_day], a, b) : periodDays >= 30 ? 1 : 0
    default:
      return 0
  }
}

/** Receita prevista dos contratos assinados no intervalo. */
export function projectedRevenue(contracts: Contract[], start: Date, end: Date): number {
  return contracts.reduce((sum, c) => sum + Number(c.price_session || 0) * occurrencesForPeriod(c, start, end), 0)
}

/** Projeções exibidas no relatório: 7, 15 e 30 dias a partir de hoje + mês corrente inteiro. */
export function projections(contracts: Contract[], now = new Date()) {
  const start = day0(now)
  return {
    weekly: projectedRevenue(contracts, start, addDays(start, 7)),
    fortnight: projectedRevenue(contracts, start, addDays(start, 15)),
    monthly: projectedRevenue(contracts, start, addDays(start, 30)),
    currentMonth: projectedRevenue(contracts, startOfMonth(now), endOfMonth(now)),
  }
}
