import { useQueries, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import sessionReportService from './report.api'
import sessionService from './api'
import type { CreateSessionData, Session, SessionApplyTo, SessionInitiator, SessionStatus } from './types'

export const sessionKeys = {
  all: ['sessions'] as const,
  mine: () => [...sessionKeys.all, 'mine'] as const,
  patient: (patientId: number) => [...sessionKeys.all, 'patient', patientId] as const,
  series: (patientId: number, sessionId: number) => [...sessionKeys.all, 'series', patientId, sessionId] as const,
  report: (patientId: number, sessionId: number) => ['session-reports', patientId, sessionId, 'exists'] as const,
}

/** Sessões do paciente logado (portal). */
export function useMySessions() {
  return useQuery({ queryKey: sessionKeys.mine(), queryFn: () => sessionService.getMySessions(), refetchInterval: 60_000 })
}

/** Sessões de um paciente (visão da psicóloga). */
export function usePatientSessions(patientId: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => sessionKeys.patient(toValue(patientId)),
    queryFn: () => sessionService.getPatientSessions(toValue(patientId)),
  })
}

/** Quais sessões já têm relatório → Map(sessionId → existe?). */
export function useReportsExist(patientId: MaybeRefOrGetter<number>, sessions: MaybeRefOrGetter<Session[]>) {
  return useQueries({
    queries: () =>
      toValue(sessions).map((s) => ({
        queryKey: sessionKeys.report(toValue(patientId), s.id),
        queryFn: () => sessionReportService.exists(toValue(patientId), s.id).then((r) => r.exists),
        staleTime: 60_000,
      })),
    combine: (results) => {
      const list = toValue(sessions)
      return {
        has: (id: number) => {
          const i = list.findIndex((s) => s.id === id)
          return i >= 0 ? results[i]?.data === true : false
        },
        loading: (id: number) => {
          const i = list.findIndex((s) => s.id === id)
          return i >= 0 ? !!results[i]?.isPending : false
        },
      }
    },
  })
}

/** Info de série recorrente (quantas sessões futuras seriam afetadas). */
export function useSeriesInfo(patientId: MaybeRefOrGetter<number | undefined>, sessionId: MaybeRefOrGetter<number | undefined>) {
  return useQuery({
    queryKey: () => sessionKeys.series(toValue(patientId) ?? 0, toValue(sessionId) ?? 0),
    queryFn: () => sessionService.getSeriesInfo(toValue(patientId)!, toValue(sessionId)!),
    enabled: () => !!toValue(patientId) && !!toValue(sessionId),
    gcTime: 0,
  })
}

const invalidateSessions = [sessionKeys.all, ['attendance']]

export function useCreateSessions(patientId: MaybeRefOrGetter<number>, onSuccess?: (count: number) => void) {
  return useApiMutation(
    (sessions: CreateSessionData[]) => sessionService.createSessions(toValue(patientId), { sessions }),
    { error: 'Erro ao criar sessões', invalidate: invalidateSessions, onSuccess: (_d, vars) => onSuccess?.(vars.length) },
  )
}

export function useChangeSessionStatus(patientId: MaybeRefOrGetter<number>) {
  return useApiMutation(
    (v: { id: number; status: SessionStatus; initiated_by?: SessionInitiator }) => sessionService.updateSession(toValue(patientId), v.id, { status: v.status, initiated_by: v.initiated_by }),
    { success: 'Status da sessão alterado.', error: 'Erro ao atualizar status', invalidate: invalidateSessions },
  )
}

export function useCompleteSession(patientId: MaybeRefOrGetter<number>) {
  return useApiMutation((id: number) => sessionService.markAsCompleted(toValue(patientId), id), {
    success: 'Sessão marcada como realizada.',
    error: 'Erro ao marcar sessão',
    invalidate: invalidateSessions,
  })
}

export function useNoShowSession(patientId: MaybeRefOrGetter<number>) {
  return useApiMutation((id: number) => sessionService.markAsNoShow(toValue(patientId), id), {
    success: 'Falta registrada com sucesso.',
    error: 'Erro ao marcar sessão',
    invalidate: invalidateSessions,
  })
}

export function useRescheduleSession(patientId: MaybeRefOrGetter<number>, onSuccess?: () => void) {
  return useApiMutation(
    (v: { id: number; data: { session_date: string; duration?: number | null; notes?: string | null; apply_to?: SessionApplyTo; initiated_by?: SessionInitiator } }) =>
      sessionService.reschedule(toValue(patientId), v.id, v.data),
    {
      success: (r) => (r.updated_sessions_count > 1 ? `${r.updated_sessions_count} sessões remarcadas com sucesso` : 'Sessão remarcada com sucesso'),
      error: 'Erro ao remarcar sessão',
      invalidate: invalidateSessions,
      onSuccess,
    },
  )
}

export function useDeleteSession(onSuccess?: () => void) {
  return useApiMutation(
    (v: { patientId: number; id: number; applyTo?: SessionApplyTo }) =>
      sessionService.deleteSession(v.patientId, v.id, v.applyTo ? { apply_to: v.applyTo } : undefined),
    {
      success: (r) => (r.deleted_sessions_count > 1 ? `${r.deleted_sessions_count} sessões excluídas com sucesso` : 'Sessão excluída com sucesso'),
      error: 'Erro ao excluir sessão',
      invalidate: invalidateSessions,
      onSuccess,
    },
  )
}
