import { computed, ref } from 'vue'
import { storage } from '@/shared/lib/storage'

export type PwaPlatform = 'ios' | 'android' | 'desktop'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa-install-dismissed' // mesma chave do app antigo
const DISMISS_DAYS = 7

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
const platform: PwaPlatform =
  /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ? 'ios'
    : /Android/.test(ua)
      ? 'android'
      : 'desktop'

const standalone = ref(false)
const installed = ref(false)
const deferred = ref<BeforeInstallPromptEvent | null>(null)
const dismissed = ref(isRecentlyDismissed())

function isRecentlyDismissed() {
  const at = Number(storage.get(STORAGE_KEY) || 0)
  return !!at && (Date.now() - at) / 86_400_000 < DISMISS_DAYS
}

function detectStandalone() {
  return (
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Chame uma vez no boot: o Chrome dispara `beforeinstallprompt` cedo, antes de qualquer tela montar,
 * então o evento precisa ser capturado no nível do módulo para o botão "Instalar" funcionar com um toque.
 */
export function initPwaInstall() {
  if (typeof window === 'undefined') return
  standalone.value = detectStandalone()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred.value = e as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferred.value = null
  })
}

export function usePwaInstall() {
  /** Só celulares, fora do app já instalado e sem dispensa recente. */
  const shouldShow = computed(() => !standalone.value && !installed.value && (platform === 'ios' || platform === 'android') && !dismissed.value)
  /** true quando o navegador oferece instalação nativa (Android/Chrome). */
  const canPromptNative = computed(() => !!deferred.value)

  async function install(): Promise<boolean> {
    const evt = deferred.value
    if (!evt) return false
    await evt.prompt()
    const { outcome } = await evt.userChoice
    deferred.value = null // o evento só pode ser usado uma vez
    if (outcome === 'accepted') installed.value = true
    return outcome === 'accepted'
  }

  function dismiss() {
    dismissed.value = true
    storage.set(STORAGE_KEY, String(Date.now()))
  }

  return { platform, shouldShow, canPromptNative, install, dismiss }
}
