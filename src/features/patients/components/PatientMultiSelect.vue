<script setup lang="ts">
/** Seleção de vários pacientes ativos (checkboxes com busca). v-model = ids. */
import { Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { useActivePatients } from '../queries'

const model = defineModel<number[]>({ default: () => [] })
const privacy = usePrivacyMode()
const query = useActivePatients()
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (query.data.value ?? []).filter((p) => !q || `${p.name} ${p.email ?? ''}`.toLowerCase().includes(q))
})
const toggle = (id: number, on: boolean) => (model.value = on ? [...new Set([...model.value, id])] : model.value.filter((x) => x !== id))
</script>

<template>
  <LoadingState v-if="query.isPending.value" label="Carregando pacientes..." />
  <div v-else class="space-y-2">
    <div class="relative"><Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input v-model="search" placeholder="Buscar paciente..." class="pl-9" /></div>
    <ul class="max-h-60 divide-y overflow-y-auto rounded-lg border">
      <li v-if="!filtered.length" class="p-4 text-center text-sm text-muted-foreground">Nenhum paciente encontrado.</li>
      <li v-for="p in filtered" :key="p.id">
        <label class="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
          <Checkbox :model-value="model.includes(p.id)" @update:model-value="(v) => toggle(p.id, v === true)" />
          <span class="min-w-0"><span class="block truncate text-sm font-medium">{{ privacy.name(p.name) }}</span><span v-if="p.email" class="block truncate text-xs text-muted-foreground">{{ privacy.email(p.email) }}</span></span>
        </label>
      </li>
    </ul>
    <p class="text-xs text-muted-foreground">{{ model.length }} paciente(s) selecionado(s)</p>
  </div>
</template>
