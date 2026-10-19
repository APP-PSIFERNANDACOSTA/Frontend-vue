import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Session } from '@/features/sessions/types'
import { SESSION_STATUS_LABELS } from '@/features/sessions/types'
import { DEFAULT_POST_THERAPY_TEMPLATE_LABEL, type PatientNote, type PostTherapyStructured } from './types'

export function getPatientNoteDisplayTitle(n: PatientNote): string {
  return (
    n.title?.trim() ||
    (n.kind === 'structured' ? n.template_label || DEFAULT_POST_THERAPY_TEMPLATE_LABEL : 'Anotação em texto livre')
  )
}

/** Primeiro trecho relevante de uma pós-terapia, para preview. */
export function getPostTherapySnippet(note: PatientNote, max = 160): string | null {
  const b = note.body_structured
  if (!b) return null
  const text = [b.discussion_summary, b.phrase_to_remember, b.daily_application, b.extra_notes]
    .map((s) => s?.trim())
    .find(Boolean)
  if (!text) return null
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}

export function formatSessionLine(s: Session) {
  const dt = format(parseISO(s.session_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  const dur = s.duration != null ? ` · ${s.duration} min` : ''
  return `${dt}${dur} (${SESSION_STATUS_LABELS[s.status] ?? s.status})`
}

/** Linha compacta: sessão vinculada ou textos salvos de data/hora/duração. */
export function getSessionMetaCompactLine(n: PatientNote): string | null {
  if (n.session_id && n.session) return formatSessionLine(n.session as Session)
  const b = n.body_structured
  if (!b) return null
  const parts = [b.session_date_label, b.session_time_label, b.duration_label].map((s) => s?.trim()).filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

/** Linha do select de vínculo: data/hora · duração · status. */
export function sessionOptionLabel(s: Session) {
  const dt = format(parseISO(s.session_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  const dur = s.duration != null ? `${s.duration} min` : '—'
  return `${dt} · ${dur} · ${SESSION_STATUS_LABELS[s.status] ?? s.status}`
}

/** Próxima sessão futura (agendada ou remarcada). */
export function findNextScheduledSession(sessions: Session[]): Session | null {
  const now = Date.now()
  return (
    sessions
      .filter((s) => (s.status === 'scheduled' || s.status === 'rescheduled') && parseISO(s.session_date).getTime() >= now)
      .sort((a, b) => parseISO(a.session_date).getTime() - parseISO(b.session_date).getTime())[0] ?? null
  )
}

/** Sessões que já aconteceram (anotação refere-se ao passado); mantém a já vinculada. */
export function findPastSessionsForNoteLink(sessions: Session[], includeId?: number | null): Session[] {
  const now = Date.now()
  return sessions
    .filter((s) => s.id === includeId || parseISO(s.session_date).getTime() < now)
    .sort((a, b) => parseISO(b.session_date).getTime() - parseISO(a.session_date).getTime())
}

/** Pré-preenche data/hora/duração do modelo a partir da sessão. */
export function prefillFromSession(s: Session, base: PostTherapyStructured): PostTherapyStructured {
  const d = parseISO(s.session_date)
  return {
    ...base,
    session_date_label: format(d, "EEEE, d 'de' MMMM yyyy", { locale: ptBR }),
    session_time_label: format(d, 'HH:mm'),
    duration_label: s.duration != null ? `${s.duration} min` : base.duration_label,
  }
}
