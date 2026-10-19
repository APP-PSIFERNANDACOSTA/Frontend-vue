import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

export const useConfirmStore = defineStore('confirm', () => {
  const open = ref(false)
  const options = ref<Required<Omit<ConfirmOptions, 'description'>> & { description?: string }>({
    title: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    destructive: false,
  })
  let resolver: ((v: boolean) => void) | null = null

  function ask(opts: ConfirmOptions) {
    options.value = { confirmText: 'Confirmar', cancelText: 'Cancelar', destructive: false, ...opts }
    open.value = true
    return new Promise<boolean>((res) => (resolver = res))
  }

  function resolve(value: boolean) {
    open.value = false
    resolver?.(value)
    resolver = null
  }

  return { open, options, ask, resolve }
})

/** `if (await confirm({ title: 'Excluir?', destructive: true })) ...` */
export function useConfirm() {
  return useConfirmStore().ask
}
