import { useQuery } from '@tanstack/vue-query'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import messageService from './message.api'
import templateService, { type NotificationTemplate, type SessionReminderRule } from './templates.api'

export const messageKeys = { all: ['messages'] as const }

/** Mensagens enviadas pela psicóloga (lista da aba Mensagens). */
export function useMessages() {
  return useQuery({ queryKey: [...messageKeys.all, 'sent'] as const, queryFn: () => messageService.getAll() })
}

export function useSendMessage(onSuccess?: () => void) {
  return useApiMutation(
    (v: { title: string; body: string; patient_id: number | null | 'all' }) => messageService.create(v),
    { success: 'Mensagem enviada. Ela ficará visível no portal dos pacientes.', error: 'Não foi possível enviar a mensagem', invalidate: [messageKeys.all], onSuccess },
  )
}

// ---- modelos de notificação e regras de lembrete (aba Configurações) ----
export const templateKeys = { templates: ['notif-templates', 'push'] as const, rules: ['notif-rules', 'push'] as const }

export function useNotificationTemplates() {
  return useQuery({ queryKey: templateKeys.templates, queryFn: () => templateService.getTemplates('push') })
}
export function useSessionRules() {
  return useQuery({ queryKey: templateKeys.rules, queryFn: () => templateService.getRules('push') })
}

export function useSaveTemplates() {
  return useApiMutation((list: NotificationTemplate[]) => templateService.updateTemplates(list, 'push'), { success: 'Modelos de notificação salvos', error: 'Não foi possível salvar os modelos', invalidate: [templateKeys.templates] })
}

/** Salva TODAS as regras (a API substitui a lista inteira). */
export function useSaveRules(message = 'Regras de lembrete salvas') {
  return useApiMutation((list: SessionReminderRule[]) => templateService.updateRules(list, 'push'), { success: message, error: 'Não foi possível salvar as regras', invalidate: [templateKeys.rules] })
}
