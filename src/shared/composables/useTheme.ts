import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

/** Tema claro/escuro (classe .dark no <html>). Mesma chave do app Next. */
export function useTheme() {
  const mode = useColorMode({ storageKey: 'theme-preference', initialValue: 'light', disableTransition: true })
  const isDark = computed(() => mode.value === 'dark')
  const toggle = () => (mode.value = isDark.value ? 'light' : 'dark')
  const reset = () => (mode.value = 'light')
  return { mode, isDark, toggle, reset }
}
