import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import resourceService from './api'
import type { UpdateResourceData } from './types'

export const resourceKeys = {
  all: ['resources'] as const,
  list: (f: object) => [...resourceKeys.all, 'list', f] as const,
  detail: (id: number) => [...resourceKeys.all, 'detail', id] as const,
  shared: (id: number) => [...resourceKeys.all, 'shared', id] as const,
  mine: (f: object) => [...resourceKeys.all, 'mine', f] as const,
  myDetail: (id: number) => [...resourceKeys.all, 'my', id] as const,
  notes: (id: number) => [...resourceKeys.all, 'notes', id] as const,
}

export interface ResourceListParams { category?: string; sharing_type?: string; search?: string }

export function useResources(params: MaybeRefOrGetter<ResourceListParams>) {
  return useQuery({
    queryKey: () => resourceKeys.list(toValue(params)),
    queryFn: async () => (await resourceService.getAll({ ...toValue(params), page: 1 })).data,
    placeholderData: keepPreviousData,
  })
}

export function useResource(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => resourceKeys.detail(toValue(id)),
    queryFn: () => resourceService.getById(toValue(id)),
    enabled: () => !!toValue(id),
  })
}

export function useSharedPatients(id: MaybeRefOrGetter<number>, enabled: MaybeRefOrGetter<boolean> = true) {
  return useQuery({
    queryKey: () => resourceKeys.shared(toValue(id)),
    queryFn: () => resourceService.getSharedPatients(toValue(id)),
    enabled: () => !!toValue(id) && toValue(enabled),
  })
}

export function useDeleteResource(onSuccess?: () => void) {
  return useApiMutation((id: number) => resourceService.delete(id), { success: 'Recurso removido com sucesso', error: 'Erro ao deletar recurso', invalidate: [resourceKeys.all], onSuccess })
}

export function useCreateResource(onSuccess?: () => void) {
  return useApiMutation((data: Parameters<typeof resourceService.create>[0]) => resourceService.create(data), { success: 'Recurso criado com sucesso', error: 'Erro ao criar recurso', invalidate: [resourceKeys.all], onSuccess })
}

export function useUpdateResource(id: number, onSuccess?: () => void) {
  return useApiMutation((data: UpdateResourceData) => resourceService.update(id, data), { success: 'Recurso atualizado com sucesso', error: 'Erro ao atualizar recurso', invalidate: [resourceKeys.all], onSuccess })
}

export function useShareResource(id: number, onSuccess?: () => void) {
  return useApiMutation((patientIds: number[]) => resourceService.shareWithPatients(id, patientIds), { success: 'Recurso compartilhado com os pacientes selecionados', error: 'Erro ao compartilhar recurso', invalidate: [resourceKeys.all], onSuccess })
}

export function useUnshareResource(id: number) {
  return useApiMutation((patientId: number) => resourceService.unshareFromPatient(id, patientId), { success: 'Compartilhamento removido', error: 'Erro ao remover compartilhamento', invalidate: [resourceKeys.all] })
}

// ---- portal do paciente ----
export function useMyResources(params: MaybeRefOrGetter<{ category?: string; search?: string }>) {
  return useQuery({
    queryKey: () => resourceKeys.mine(toValue(params)),
    queryFn: async () => (await resourceService.getMyResources(toValue(params))).data,
    placeholderData: keepPreviousData,
  })
}

export function useMyResource(id: MaybeRefOrGetter<number>) {
  return useQuery({ queryKey: () => resourceKeys.myDetail(toValue(id)), queryFn: () => resourceService.getResourceById(toValue(id)), enabled: () => !!toValue(id) })
}

export function useCompleteResource() {
  return useApiMutation((id: number) => resourceService.markAsCompleted(id), { success: 'Marcado como concluído', error: 'Erro ao marcar como concluído', invalidate: [resourceKeys.all] })
}

export function useResourceNotes(id: MaybeRefOrGetter<number>) {
  return useQuery({ queryKey: () => resourceKeys.notes(toValue(id)), queryFn: () => resourceService.getNotes(toValue(id)), enabled: () => !!toValue(id) })
}

export function useAddResourceNote(id: number, onSuccess?: () => void) {
  return useApiMutation((text: string) => resourceService.createNote(id, { note_text: text }), { success: 'Anotação salva', error: 'Erro ao adicionar anotação', invalidate: [resourceKeys.notes(id)], onSuccess })
}

export function useDeleteResourceNote(id: number) {
  return useApiMutation((noteId: number) => resourceService.deleteNote(id, noteId), { success: 'Anotação removida', error: 'Erro ao deletar anotação', invalidate: [resourceKeys.notes(id)] })
}
