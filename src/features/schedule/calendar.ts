import { TZDate } from '@date-fns/tz'
import { addDays, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  SESSION_WALL_TIME_ZONE, buildSaoPauloCalendarDays, formatSessionInstantInSaoPaulo, getBrazilWallDateKey, saoPauloWallDateTimeToUtcIso,
} from '@/shared/lib/datetime-br'

export type CalendarView = 'day' | 'week' | 'month' | 'list'
export const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'list', label: 'Lista' },
]

/** Todas as datas são "meio-dia em Brasília" (mesma âncora de datetime-br), para o dia civil nunca virar. */
const dow = (d: Date) => new TZDate(d.getTime(), SESSION_WALL_TIME_ZONE).getDay()

export function weekDays(anchor: Date): Date[] {
  const start = addDays(anchor, -dow(anchor))
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Dias que a visão desenha (mês/lista usam a grade completa, com os dias vizinhos). */
export function visibleDays(view: CalendarView, anchor: Date): Date[] {
  if (view === 'day') return [anchor]
  if (view === 'week') return weekDays(anchor)
  return buildSaoPauloCalendarDays(anchor)
}

export function daysToUtcRange(days: Date[]): { start: string; end: string } {
  return {
    start: saoPauloWallDateTimeToUtcIso(getBrazilWallDateKey(days[0]), '00:00'),
    end: saoPauloWallDateTimeToUtcIso(getBrazilWallDateKey(days[days.length - 1]), '23:59'),
  }
}

export function shiftAnchor(view: CalendarView, d: Date, dir: 1 | -1): Date {
  if (view === 'day') return addDays(d, dir)
  if (view === 'week') return addDays(d, 7 * dir)
  return addMonths(d, dir)
}

const fmt = (d: Date, p: string) => formatSessionInstantInSaoPaulo(d.toISOString(), p, { locale: ptBR })

export function viewTitle(view: CalendarView, anchor: Date): string {
  if (view === 'day') return fmt(anchor, "EEEE, d 'de' MMMM 'de' yyyy")
  if (view === 'week') {
    const days = weekDays(anchor)
    const a = days[0]
    const b = days[6]
    return fmt(a, 'MMyyyy') === fmt(b, 'MMyyyy')
      ? `${fmt(a, 'd')} – ${fmt(b, "d 'de' MMMM 'de' yyyy")}`
      : fmt(a, 'yyyy') === fmt(b, 'yyyy')
        ? `${fmt(a, "d 'de' MMM")} – ${fmt(b, "d 'de' MMM 'de' yyyy")}`
        : `${fmt(a, "d 'de' MMM 'de' yyyy")} – ${fmt(b, "d 'de' MMM 'de' yyyy")}`
  }
  return fmt(anchor, 'MMMM yyyy')
}

/** Item unificado (sessão ou evento do Google) para a grade de horários. */
export interface CalItem {
  key: string
  kind: 'session' | 'event'
  dayKey: string
  /** minutos desde 00:00 (Brasília) */
  startMin: number
  endMin: number
  title: string
  subtitle?: string
  ref: unknown
}

export const minutesOfDay = (iso: string) => Number(formatSessionInstantInSaoPaulo(iso, 'H')) * 60 + Number(formatSessionInstantInSaoPaulo(iso, 'm'))

/** Distribui itens sobrepostos no mesmo dia em colunas lado a lado. */
export function layoutLanes<T extends { startMin: number; endMin: number }>(items: T[]): (T & { lane: number; lanes: number })[] {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)
  const out: (T & { lane: number; lanes: number })[] = []
  let cluster: (T & { lane: number; lanes: number })[] = []
  let clusterEnd = -1
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1))
    cluster.forEach((c) => (c.lanes = lanes))
    out.push(...cluster)
    cluster = []
  }
  for (const it of sorted) {
    if (cluster.length && it.startMin >= clusterEnd) flush()
    const used = new Set(cluster.filter((c) => c.endMin > it.startMin).map((c) => c.lane))
    let lane = 0
    while (used.has(lane)) lane++
    cluster.push({ ...it, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, it.endMin)
  }
  if (cluster.length) flush()
  return out
}
