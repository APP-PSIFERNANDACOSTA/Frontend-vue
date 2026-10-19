import { useMediaQuery } from '@vueuse/core'

/** lg = 1024px, mesmo corte usado no layout antigo. */
export function useBreakpoint() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 640px)')
  return { isDesktop, isTablet }
}
