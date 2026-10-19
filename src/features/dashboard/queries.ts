import { useQuery } from '@tanstack/vue-query'
import { addDays, endOfDay, endOfMonth, endOfWeek, format, isSameDay, startOfDay, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import patientService from '@/features/patients/api'
import paymentService from '@/features/payments/api'
import sessionService from '@/features/sessions/api'
import { attendanceRate, averagePerSession, monthSessionStats, sumPayments, variation } from './metrics'

const REFRESH = 60_000 // substitui o useAutoRefresh do app antigo
const day = (d: Date) => format(d, 'yyyy-MM-dd')
const range = (a: Date, b: Date) => ({ start_date: a.toISOString(), end_date: b.toISOString() })

export const dashboardKeys = { all: ['dashboard'] as const }

/** Cada bloco do dashboard é uma query independente: se uma falha, as outras continuam. */
export function useDashboard() {
  const now = new Date()

  const patients = useQuery({
    queryKey: [...dashboardKeys.all, 'patients'],
    queryFn: async () => {
      const res = await patientService.getAll({ status: 'active', per_page: 1000 })
      const list = res.patients?.data ?? []
      const monthStart = startOfMonth(now)
      return { active: list.length, newThisMonth: list.filter((p) => new Date(p.created_at) >= monthStart).length }
    },
    refetchInterval: REFRESH,
  })

  const weekSessions = useQuery({
    queryKey: [...dashboardKeys.all, 'week-sessions'],
    queryFn: async () => (await sessionService.getAllSessions(range(startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })))).length,
    refetchInterval: REFRESH,
  })

  const monthSessions = useQuery({
    queryKey: [...dashboardKeys.all, 'month-sessions'],
    queryFn: async () => {
      const sessions = await sessionService.getAllSessions(range(startOfMonth(now), endOfMonth(now)))
      const stats = monthSessionStats(sessions)
      return { stats, rate: attendanceRate(stats) }
    },
    refetchInterval: REFRESH,
  })

  const revenue = useQuery({
    queryKey: [...dashboardKeys.all, 'revenue'],
    queryFn: async () => {
      const prev = subMonths(now, 1)
      const [cur, last] = await Promise.all([
        paymentService.getAll({ start_date: day(startOfMonth(now)), end_date: day(endOfMonth(now)) }),
        paymentService.getAll({ start_date: day(startOfMonth(prev)), end_date: day(endOfMonth(prev)) }),
      ])
      const current = sumPayments(cur)
      const previous = sumPayments(last)
      return { current, previous, change: variation(current, previous), payments: cur.length }
    },
    refetchInterval: REFRESH,
  })

  // todas as sessões do dia (menos canceladas): o cartão calcula próxima, restantes e progresso
  const today = useQuery({
    queryKey: [...dashboardKeys.all, 'today'],
    queryFn: async () => {
      const sessions = await sessionService.getAllSessions(range(startOfDay(now), endOfDay(now)))
      return sessions
        .filter((s) => isSameDay(new Date(s.session_date), now) && s.status !== 'cancelled')
        .sort((a, b) => +new Date(a.session_date) - +new Date(b.session_date))
    },
    refetchInterval: REFRESH,
  })

  // próxima sessão futura (para o dia sem atendimentos não deixar o cartão vazio)
  const upcoming = useQuery({
    queryKey: [...dashboardKeys.all, 'upcoming'],
    queryFn: async () => {
      const sessions = await sessionService.getAllSessions(range(now, addDays(now, 60)))
      return sessions
        .filter((s) => (s.status === 'scheduled' || s.status === 'rescheduled') && new Date(s.session_date) > now)
        .sort((a, b) => +new Date(a.session_date) - +new Date(b.session_date))[0] ?? null
    },
    refetchInterval: REFRESH,
  })

  return { patients, weekSessions, monthSessions, revenue, today, upcoming, averagePerSession }
}
