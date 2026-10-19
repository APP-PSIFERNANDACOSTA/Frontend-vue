import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { toValue, type MaybeRefOrGetter } from 'vue'
import contractService from '@/features/contracts/api'
import expenseService from '@/features/costs/api'
import paymentService from '@/features/payments/api'
import { projections } from './projection'

export type Period = 'current_month' | 'last_month' | 'current_year' | 'all'

export function periodRange(period: Period, now = new Date()): { start_date?: string; end_date?: string } {
  const d = (x: Date) => format(x, 'yyyy-MM-dd')
  switch (period) {
    case 'current_month': return { start_date: d(startOfMonth(now)), end_date: d(endOfMonth(now)) }
    case 'last_month': return { start_date: d(startOfMonth(subMonths(now, 1))), end_date: d(endOfMonth(subMonths(now, 1))) }
    case 'current_year': return { start_date: d(startOfYear(now)), end_date: d(endOfYear(now)) }
    default: return {}
  }
}

/** Entradas, saídas e resumo de caixa do período. */
export function useFinancialReport(period: MaybeRefOrGetter<Period>, method: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: () => ['financial', 'report', toValue(period), toValue(method)] as const,
    queryFn: async () => {
      const range = periodRange(toValue(period))
      const params = { ...range, ...(toValue(method) !== 'all' ? { payment_method: toValue(method) } : {}) }
      const [payments, summary, expenses] = await Promise.all([
        paymentService.getAll(params),
        expenseService.getFinancialSummary(params),
        expenseService.getAll(params),
      ])
      return { payments: payments ?? [], summary, expenses: expenses ?? [] }
    },
    placeholderData: keepPreviousData,
  })
}

/** Projeção por contratos assinados (de pacientes ativos). Falhar aqui não bloqueia o resto da tela. */
export function useProjections() {
  return useQuery({
    queryKey: ['financial', 'projections'] as const,
    queryFn: async () => {
      const res = await contractService.getAll('signed')
      const active = (res.contracts ?? []).filter((c) => c.patient?.status === 'active')
      return projections(active)
    },
    staleTime: 5 * 60_000,
    retry: false,
  })
}
