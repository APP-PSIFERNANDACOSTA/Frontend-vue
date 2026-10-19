/** Notificação do painel (gerada pelo backend: NotificationController@index). */
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  read: boolean
  data?: Record<string, any>
}
