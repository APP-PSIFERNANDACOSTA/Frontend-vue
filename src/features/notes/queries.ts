import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import patientNoteService from './api'
import type { CreatePatientNotePayload } from './types'

export const noteKeys = {
  all: ['notes'] as const,
  list: (patientId: number, page: number) => [...noteKeys.all, 'patient', patientId, 'list', page] as const,
  detail: (patientId: number, noteId: number) => [...noteKeys.all, 'patient', patientId, 'detail', noteId] as const,
  portalList: (page: number, perPage: number) => [...noteKeys.all, 'portal', page, perPage] as const,
  portalDetail: (id: number) => [...noteKeys.all, 'portal', 'detail', id] as const,
}

export const NOTES_PER_PAGE = 15

/* ── Psicóloga ─────────────────────────────────────────────────────────── */

export function usePatientNotes(patientId: MaybeRefOrGetter<number>, page: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => noteKeys.list(toValue(patientId), toValue(page)),
    queryFn: () => patientNoteService.list(toValue(patientId), { page: toValue(page), per_page: NOTES_PER_PAGE }),
    placeholderData: keepPreviousData,
  })
}

export function usePatientNote(patientId: MaybeRefOrGetter<number>, noteId: MaybeRefOrGetter<number | undefined>) {
  return useQuery({
    queryKey: () => noteKeys.detail(toValue(patientId), toValue(noteId) ?? 0),
    queryFn: () => patientNoteService.get(toValue(patientId), toValue(noteId)!),
    enabled: () => !!toValue(noteId),
  })
}

export function useSaveNote(patientId: MaybeRefOrGetter<number>, noteId: MaybeRefOrGetter<number | undefined>, onSuccess?: () => void) {
  return useApiMutation(
    (payload: CreatePatientNotePayload) => {
      const id = toValue(noteId)
      return id ? patientNoteService.update(toValue(patientId), id, payload) : patientNoteService.create(toValue(patientId), payload)
    },
    {
      success: () => (toValue(noteId) ? 'Anotação atualizada' : 'Anotação salva'),
      error: 'Não foi possível salvar',
      invalidate: [noteKeys.all],
      onSuccess,
    },
  )
}

export function useDeleteNote(patientId: MaybeRefOrGetter<number>) {
  return useApiMutation((noteId: number) => patientNoteService.delete(toValue(patientId), noteId), {
    success: 'Anotação excluída',
    error: 'Erro ao excluir',
    invalidate: [noteKeys.all],
  })
}

/* ── Portal do paciente (pós-terapia) ─────────────────────────────────── */

export function useMyPostTherapyList(page: MaybeRefOrGetter<number> = 1, perPage = 20) {
  return useQuery({
    queryKey: () => noteKeys.portalList(toValue(page), perPage),
    queryFn: () => patientNoteService.listMyPortalPostTherapy({ page: toValue(page), per_page: perPage }),
  })
}

export function useMyPostTherapy(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => noteKeys.portalDetail(toValue(id)),
    queryFn: () => patientNoteService.getMyPortalPostTherapy(toValue(id)),
  })
}
