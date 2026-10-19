import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient, { getApiErrorMessage } from '@/shared/lib/api-client'

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
const isStandalone = () =>
  (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches

function urlBase64ToUint8Array(base64String: string) {
  const clean = base64String.trim().replace(/\s/g, '')
  const base64 = (clean + '='.repeat((4 - (clean.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

function subscriptionToJSON(sub: PushSubscription) {
  const key = sub.getKey('p256dh')
  const auth = sub.getKey('auth')
  if (!key || !auth) throw new Error('Chaves de subscription não encontradas')
  const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  return { endpoint: sub.endpoint, keys: { p256dh: b64(key), auth: b64(auth) } }
}

/** Estado de push notifications compartilhado (banner, configurações...). Porte de hooks/use-push-notifications.ts. */
export const usePushStore = defineStore('push', () => {
  const isSupported = ref(false)
  const permission = ref<NotificationPermission>('default')
  const isSubscribed = ref(false)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  let checked = false

  async function check() {
    if (checked) return
    checked = true
    const basic = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    isSupported.value = basic
    if (!basic) {
      error.value = isIOS()
        ? 'No iPhone, as notificações exigem iOS 16.4+ com o app adicionado à tela inicial.'
        : 'Notificações push não são suportadas neste navegador.'
      isLoading.value = false
      return
    }
    permission.value = Notification.permission
    if (isIOS() && !isStandalone()) {
      error.value = 'No iOS, adicione o app à tela inicial e abra pelo ícone para receber notificações push.'
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      isSubscribed.value = !!(await reg?.pushManager.getSubscription())
    } catch {
      isSubscribed.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function subscribe(): Promise<boolean> {
    if (!isSupported.value) {
      error.value = 'Push notifications não são suportadas neste navegador'
      return false
    }
    error.value = null
    isLoading.value = true
    try {
      const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapid) throw new Error('VAPID public key não configurada (VITE_VAPID_PUBLIC_KEY).')
      if (isIOS() && !isStandalone()) {
        throw new Error('No iOS, você precisa adicionar o app à tela inicial e abrir pelo ícone para receber notificações push.')
      }
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      if (Notification.permission === 'denied') {
        throw new Error('Permissão de notificações negada. Ative nas configurações do navegador.')
      }
      permission.value = await Notification.requestPermission()
      if (permission.value !== 'granted') {
        throw new Error(
          isIOS()
            ? 'Permissão negada. No iOS, vá em Ajustes > Notificações e permita para este app.'
            : 'Permissão de notificações negada.',
        )
      }
      await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      })
      try {
        await apiClient.post('/push/subscribe', subscriptionToJSON(sub))
      } catch (e) {
        throw new Error(getApiErrorMessage(e, 'Erro ao salvar subscription'))
      }
      isSubscribed.value = true
      return true
    } catch (e: any) {
      error.value = e?.message || 'Erro ao ativar notificações push'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function unsubscribe(): Promise<boolean> {
    error.value = null
    isLoading.value = true
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await apiClient.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {})
        await sub.unsubscribe()
      }
      isSubscribed.value = false
      return true
    } catch (e: any) {
      error.value = e?.message || 'Erro ao desativar notificações push'
      return false
    } finally {
      isLoading.value = false
    }
  }

  return { isSupported, permission, isSubscribed, isLoading, error, check, subscribe, unsubscribe }
})
