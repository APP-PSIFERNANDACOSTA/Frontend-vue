import { notify } from '@/shared/lib/toast'

/** Copia texto e avisa por toast. Funciona em http (fallback via textarea) e sem permissão da API moderna. */
export function useClipboardToast() {
  async function copy(text: string, title = 'Copiado!', description?: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text)
      else {
        const ta = Object.assign(document.createElement('textarea'), { value: text })
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
      }
      notify.success(title, description)
      return true
    } catch {
      notify.error('Erro ao copiar', 'Não foi possível copiar o texto')
      return false
    }
  }
  return { copy }
}
