import { useQuery } from '@tanstack/vue-query'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import notificationService from './api'

export const notificationKeys = { all: ['notifications'] as const }

/** Central de notificações (atualiza a cada 30 s, como no app antigo). */
export function useNotifications() {
  return useQuery({ queryKey: notificationKeys.all, queryFn: () => notificationService.getAll(), refetchInterval: 30_000 })
}

export function useMarkNotificationRead() {
  return useApiMutation((id: string) => notificationService.markAsRead(id), { invalidate: [notificationKeys.all] })
}

export function useMarkAllNotificationsRead() {
  return useApiMutation(() => notificationService.markAllAsRead(), { success: 'Todas as notificações foram marcadas como lidas.', error: 'Não foi possível marcar como lidas', invalidate: [notificationKeys.all] })
}
