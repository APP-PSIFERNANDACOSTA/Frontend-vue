import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  formatSessionInstantInLocalTimezone as local,
  formatSessionInstantInSaoPaulo as brasilia,
} from '@/shared/lib/datetime-br'

/** "qua, 12 mar" (compacto) ou "quarta-feira, 12 de março" — fuso do navegador */
export function formatSessionDay(iso: string, compact = false) {
  return format(new Date(iso), compact ? 'EEE, dd MMM' : "EEEE, dd 'de' MMMM", { locale: ptBR })
}

/** "14:00 - 14:50" quando há duração */
export function formatSessionTimeRange(iso: string, duration: number | null) {
  const start = new Date(iso)
  const s = format(start, 'HH:mm')
  return duration ? `${s} - ${format(new Date(start.getTime() + duration * 60000), 'HH:mm')}` : s
}

export const isUpcoming = (s: { status: string; session_date: string }) =>
  (s.status === 'scheduled' || s.status === 'rescheduled') && new Date(s.session_date) >= new Date()

// Agenda da psicóloga: horário no fuso dela; cadastro sempre em Brasília
export const fmtLongDate = (iso: string) => local(iso, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
export const fmtTime = (iso: string) => local(iso, 'HH:mm')
export const fmtShortDate = (iso: string) => local(iso, 'dd/MM/yyyy', { locale: ptBR })
export const fmtBrasilia = (iso: string) => brasilia(iso, "dd/MM 'às' HH:mm", { locale: ptBR })

export const fmtDayNum = (iso: string) => local(iso, 'dd')
export const fmtMonthShort = (iso: string) => local(iso, 'MMM', { locale: ptBR }).replace('.', '')
export const fmtWeekday = (iso: string) => local(iso, 'EEEE', { locale: ptBR })
/** Sessão agendada cujo horário já passou: falta registrar se aconteceu. */
export const isPendingRecord = (s: { status: string; session_date: string }) =>
  (s.status === 'scheduled' || s.status === 'rescheduled') && new Date(s.session_date) < new Date()
