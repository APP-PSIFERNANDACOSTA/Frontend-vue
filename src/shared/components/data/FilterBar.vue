<script setup lang="ts">
/**
 * Barra de filtros padrão: busca sempre visível + painel de filtros colapsável.
 *   <FilterBar v-model:search="search" :active-count="n" storage-key="patients-filters" @clear="reset">
 *     <FormField label="Status">…</FormField>     ← filtros extras (grid responsivo)
 *     <template #actions><ViewToggle v-model="view" /></template>
 *   </FilterBar>
 * O estado aberto/fechado é lembrado por `storageKey`. Se não houver filtros extras, só mostra a busca.
 */
import { ChevronDown, FilterX, SlidersHorizontal } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, useSlots } from 'vue'
import SearchInput from '@/shared/components/SearchInput.vue'
import { Button } from '@/shared/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'

const props = withDefaults(
  defineProps<{
    searchPlaceholder?: string
    /** Quantos filtros (fora a busca) estão ativos — vira o contador no botão e habilita "Limpar". */
    activeCount?: number
    storageKey?: string
    defaultOpen?: boolean
    /** Oculta o campo de busca. */
    noSearch?: boolean
  }>(),
  { searchPlaceholder: 'Buscar...', activeCount: 0, defaultOpen: false },
)
const emit = defineEmits<{ clear: [] }>()
const search = defineModel<string>('search', { default: '' })
const slots = useSlots()

const open = useStorage<boolean>(props.storageKey ?? '', props.defaultOpen, undefined, { listenToStorageChanges: false })
const hasFilters = computed(() => !!slots.default)
const canClear = computed(() => props.activeCount > 0 || !!search.value)
</script>

<template>
  <Collapsible v-model:open="open" class="rounded-xl border bg-card p-3 shadow-xs sm:p-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput v-if="!noSearch" v-model="search" :placeholder="searchPlaceholder" class="sm:flex-1" />
      <div v-else class="flex-1" />

      <div class="flex items-center justify-between gap-2 sm:justify-end">
        <CollapsibleTrigger v-if="hasFilters" as-child>
          <Button type="button" variant="outline" class="h-10 gap-2" :aria-expanded="open">
            <SlidersHorizontal />
            Filtros
            <span v-if="activeCount" class="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{{ activeCount }}</span>
            <ChevronDown class="transition-transform" :class="open && 'rotate-180'" />
          </Button>
        </CollapsibleTrigger>
        <Button v-if="canClear" type="button" variant="ghost" class="h-10 gap-2" @click="emit('clear')"><FilterX /> <span class="hidden sm:inline">Limpar</span></Button>
        <slot name="actions" />
      </div>
    </div>

    <CollapsibleContent v-if="hasFilters" class="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
      <div class="grid gap-4 border-t pt-4 mt-3 sm:grid-cols-2 lg:grid-cols-4"><slot /></div>
    </CollapsibleContent>
  </Collapsible>
</template>
