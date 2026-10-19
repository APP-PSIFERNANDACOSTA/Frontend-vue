import { storage } from '@/shared/lib/storage'

/** Cores padrão da marca (iguais a frontend/lib/colors.ts). */
export const DEFAULT_BRAND = { primary: '#E8B8D9', primaryDark: '#543949' } as const

// Mesmas chaves que o app Next usava para customização local
const KEY_PRIMARY = 'custom-primary'
const KEY_PRIMARY_DARK = 'custom-primary-dark'

function apply(primary: string, primaryDark: string) {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', primary)
  root.style.setProperty('--brand-primary-dark', primaryDark)
}

/** Aplica as duas cores da marca. Todo o resto da paleta deriva delas em tokens.css. */
export function useBranding() {
  function load() {
    apply(storage.get(KEY_PRIMARY) || DEFAULT_BRAND.primary, storage.get(KEY_PRIMARY_DARK) || DEFAULT_BRAND.primaryDark)
  }

  /** Cores em vigor (personalizadas ou padrão). */
  const current = () => ({ primary: storage.get(KEY_PRIMARY) || DEFAULT_BRAND.primary, primaryDark: storage.get(KEY_PRIMARY_DARK) || DEFAULT_BRAND.primaryDark })

  function setColors(primary: string, primaryDark: string) {
    storage.set(KEY_PRIMARY, primary)
    storage.set(KEY_PRIMARY_DARK, primaryDark)
    apply(primary, primaryDark)
  }

  function reset() {
    storage.remove(KEY_PRIMARY)
    storage.remove(KEY_PRIMARY_DARK)
    apply(DEFAULT_BRAND.primary, DEFAULT_BRAND.primaryDark)
  }

  return { load, current, setColors, reset }
}
