<script setup lang="ts">
import { Search, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Input } from '@/shared/ui/input'

const props = withDefaults(defineProps<{ placeholder?: string; debounce?: number }>(), {
  placeholder: 'Buscar...',
  debounce: 300,
})
const model = defineModel<string>({ default: '' })
const local = ref(model.value)
const push = useDebounceFn((v: string) => (model.value = v), props.debounce)
watch(local, (v) => push(v))
watch(model, (v) => v !== local.value && (local.value = v))
</script>

<template>
  <div class="relative w-full">
    <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input v-model="local" type="search" :placeholder="placeholder" class="h-10 pl-9 pr-9" />
    <button
      v-if="local"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
      aria-label="Limpar busca"
      @click="local = ''"
    >
      <X class="size-4" />
    </button>
  </div>
</template>
