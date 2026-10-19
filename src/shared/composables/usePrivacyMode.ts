import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/shared/lib/storage'
import * as mask from '@/shared/lib/privacy-mask'

const STORAGE_KEY = 'psychologist-privacy-mode'
const LEGACY_KEY = 'dashboard-privacy-mode'

/** Modo privacidade do painel da psicóloga (esconde nomes, CPF, valores...). */
export const usePrivacyStore = defineStore('privacy', () => {
  const initial = storage.get(STORAGE_KEY) ?? storage.get(LEGACY_KEY)
  const enabled = ref(initial === 'true')

  function set(value: boolean) {
    enabled.value = value
    storage.set(STORAGE_KEY, String(value))
  }
  const toggle = () => set(!enabled.value)

  return { enabled, set, toggle }
})

/** Atalho: estado + funções de máscara já ligadas ao estado atual. */
export function usePrivacyMode() {
  const store = usePrivacyStore()
  const { enabled } = storeToRefs(store)
  return {
    enabled,
    toggle: store.toggle,
    set: store.set,
    name: (v?: string | null) => mask.maskPatientName(v, enabled.value),
    cpf: (v?: string | null) => mask.maskCpf(v, enabled.value),
    phone: (v?: string | null) => mask.maskPhone(v, enabled.value),
    email: (v?: string | null) => mask.maskEmail(v, enabled.value),
    money: (v?: number | string | null) => mask.maskMoneyBr(v, enabled.value),
    text: (v?: string | null, keep?: number) => mask.maskLongText(v, enabled.value, keep),
  }
}
