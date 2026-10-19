<script setup lang="ts">
import { ref, watch } from 'vue'
import { parseMoneyBr } from '@/shared/lib/format'
import { Input } from '@/shared/ui/input'

/**
 * Campo de valor em reais. Texto livre com teclado decimal: aceita "100", "100,50", "1.000,50" e "100.50"
 * (o input type="number" do Chrome em pt-BR interpreta ponto/vírgula de forma inconsistente).
 */
const model = defineModel<number | undefined>()
defineProps<{ id?: string; placeholder?: string; required?: boolean; disabled?: boolean }>()

const text = ref(toText(model.value))

function toText(v: number | undefined) {
  return v == null || Number.isNaN(v) ? '' : String(v).replace('.', ',')
}

function onInput(v: string | number) {
  text.value = String(v).replace(/[^\d.,]/g, '')
  model.value = parseMoneyBr(text.value)
}

// valor trocado por fora (reset, edição carregada) → atualiza o texto
watch(model, (v) => {
  if (v !== parseMoneyBr(text.value)) text.value = toText(v)
})
</script>

<template>
  <div class="relative">
    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">R$</span>
    <Input
      :id="id" :model-value="text" type="text" inputmode="decimal" autocomplete="off" class="pl-9"
      :placeholder="placeholder ?? '0,00'" :required="required" :disabled="disabled"
      @update:model-value="onInput"
    />
  </div>
</template>
