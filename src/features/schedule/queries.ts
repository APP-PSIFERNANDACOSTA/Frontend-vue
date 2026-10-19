import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import googleOAuthService from '@/features/settings/google.api'
import sessionService from '@/features/sessions/api'
import type { UpdateSessionData } from '@/features/sessions/types'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { saoPauloMonthRangeUtcIso } from '@/shared/lib/datetime-br'
import { notify } from '@/shared/lib/toast'

export const scheduleKeys = {
  month: (anchor: Date) => ['sessions', 'schedule', anchor.getFullYear(), anchor.getMonth()] as const,
  googleStatus: () => ['google', 'status'] as const,
  googleEvents: (anchor: Date) => ['google', 'events', anchor.getFullYear(), anchor.getMonth()] as const,
}

/** Sessões do mês visível (limites calculados no fuso de Brasília). */
export function useMonthSessions(month: MaybeRefOrGetter<Date>) {
  return useQuery({
    queryKey: () => scheduleKeys.month(toValue(month)),
    queryFn: () => {
      const { start, end } = saoPauloMonthRangeUtcIso(toValue(month))
      return sessionService.getAllSessions({ start_date: start, end_date: end })
    },
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}

/** Sessões de um período arbitrário (dia, semana ou grade do mês), em ISO UTC. */
export function useSessionsRange(range: MaybeRefOrGetter<{ start: string; end: string }>) {
  return useQuery({
    queryKey: () => ['sessions', 'schedule', 'range', toValue(range).start, toValue(range).end] as const,
    queryFn: () => sessionService.getAllSessions({ start_date: toValue(range).start, end_date: toValue(range).end }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}

/** Eventos do Google do mesmo período. Falha de rede não derruba a agenda. */
export function useGoogleEventsRange(range: MaybeRefOrGetter<{ start: string; end: string }>, enabled: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: () => ['google', 'events', 'range', toValue(range).start, toValue(range).end] as const,
    queryFn: async () => {
      const events = await googleOAuthService.getCalendarEvents(toValue(range).start, toValue(range).end)
      if (events.length > 0) googleOAuthService.storeImportedEvents(events).catch(() => {})
      return events
    },
    enabled: () => toValue(enabled),
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: 60_000,
  })
}

export function useGoogleStatus() {
  return useQuery({ queryKey: scheduleKeys.googleStatus(), queryFn: () => googleOAuthService.getStatus(), staleTime: 5 * 60_000 })
}

/** Eventos do Google Calendar do mês. Falha de rede não derruba a agenda: vira `isError` com botão "Repuxar". */
export function useGoogleEvents(month: MaybeRefOrGetter<Date>, enabled: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: () => scheduleKeys.googleEvents(toValue(month)),
    queryFn: async () => {
      const { start, end } = saoPauloMonthRangeUtcIso(toValue(month))
      const events = await googleOAuthService.getCalendarEvents(start, end)
      if (events.length > 0) googleOAuthService.storeImportedEvents(events).catch(() => {}) // cache em background
      return events
    },
    enabled: () => toValue(enabled),
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: 60_000,
  })
}

const invalidate = [['sessions'], ['dashboard'], ['attendance']]

export function useUpdateSession(onSuccess?: (updatedCount: number) => void) {
  return useApiMutation(
    (v: { patientId: number; id: number; data: UpdateSessionData; silent?: boolean }) => sessionService.updateSession(v.patientId, v.id, v.data),
    { error: 'Erro ao salvar', invalidate, onSuccess: (r) => onSuccess?.(r.updated_sessions_count) },
  )
}

export function useMarkSession(kind: 'complete' | 'no-show', onSuccess?: () => void) {
  return useApiMutation(
    (v: { patientId: number; id: number }) => (kind === 'complete' ? sessionService.markAsCompleted(v.patientId, v.id) : sessionService.markAsNoShow(v.patientId, v.id)),
    {
      success: kind === 'complete' ? 'Sessão marcada como realizada com sucesso' : 'Falta registrada com sucesso',
      error: 'Erro ao marcar sessão',
      invalidate,
      onSuccess,
    },
  )
}

export function useDisconnectGoogle() {
  const qc = useQueryClient()
  return useApiMutation(() => googleOAuthService.disconnect(), {
    success: 'Google Calendar desconectado',
    error: 'Erro ao desconectar',
    onSuccess: () => {
      qc.setQueryData(scheduleKeys.googleStatus(), { connected: false, expired: false })
      qc.removeQueries({ queryKey: ['google', 'events'] })
    },
  })
}

/** Redireciona para a tela de consentimento do Google; ao voltar a URL traz ?google_connected=true. */
export function useConnectGoogle() {
  return useApiMutation(async () => {
    window.location.href = await googleOAuthService.getAuthUrl('dashboard/schedule')
  }, { error: 'Não foi possível conectar com Google Calendar' })
}

export function usePushSessionsToGoogle() {
  const qc = useQueryClient()
  return useApiMutation(
    async () => {
      const res = await googleOAuthService.pushSessionsToCalendar()
      if (!res.success) throw Object.assign(new Error(), { response: { data: { message: res.message || 'Não foi possível enviar as sessões.' } } })
      return res
    },
    {
      error: 'Erro ao enviar sessões',
      onSuccess: (res) => {
        notify.success((res.created ?? 0) > 0 ? 'Sessões enviadas ao Google' : 'Sincronização com o Google', res.message || 'Concluído.')
        qc.invalidateQueries({ queryKey: ['sessions'] })
        qc.invalidateQueries({ queryKey: ['google', 'events'] })
      },
    },
  )
}
