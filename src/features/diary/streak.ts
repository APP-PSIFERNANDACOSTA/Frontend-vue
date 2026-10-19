import { format, subDays } from 'date-fns'

/** Dias consecutivos com entrada, contando de hoje (ou de ontem, se hoje ainda não escreveu) para trás. */
export function consecutiveDays(entryDates: string[], now = new Date()): number {
  const days = new Set(entryDates.map((d) => d.slice(0, 10)))
  const key = (d: Date) => format(d, 'yyyy-MM-dd')
  let cursor = days.has(key(now)) ? now : subDays(now, 1)
  let count = 0
  while (days.has(key(cursor))) {
    count++
    cursor = subDays(cursor, 1)
  }
  return count
}
