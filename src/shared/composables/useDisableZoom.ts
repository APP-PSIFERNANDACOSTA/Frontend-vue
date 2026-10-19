import { onBeforeUnmount, onMounted } from 'vue'

const NO_ZOOM = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

/**
 * Desativa o zoom (pinça e duplo toque) enquanto o componente estiver montado — usado no portal do paciente.
 * Restaura o viewport original ao sair (a área da psicóloga mantém o zoom liberado).
 * No iOS o pinça pode continuar valendo (acessibilidade do sistema); `touch-action: manipulation` barra o duplo toque.
 */
export function useDisableZoom() {
  let meta: HTMLMetaElement | null = null
  let original: string | null = null

  onMounted(() => {
    meta = document.querySelector('meta[name="viewport"]')
    if (!meta) return
    original = meta.getAttribute('content')
    meta.setAttribute('content', NO_ZOOM)
    document.documentElement.classList.add('no-zoom')
  })

  onBeforeUnmount(() => {
    if (meta && original !== null) meta.setAttribute('content', original)
    document.documentElement.classList.remove('no-zoom')
  })
}
