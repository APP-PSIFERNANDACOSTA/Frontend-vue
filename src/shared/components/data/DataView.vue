<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * Listagem padrão: estados (loading/erro/vazio) + alternância cards/lista + paginação.
 *
 *   <DataView :query="q" :items="rows" :columns="cols" item-key="id" :total="total"
 *             v-model:page="page" v-model:per-page="perPage" v-model:view="view">
 *     <template #card="{ item }">…</template>          ← modo cards
 *     <template #cell-name="{ row }">…</template>      ← modo lista (opcional)
 *     <template #actions="{ row }">…</template>
 *     <template #empty>…</template>
 *   </DataView>
 *
 * No celular/tablet sempre mostra cards (tabela só em ≥ lg).
 */
import { computed } from 'vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { useBreakpoint } from '@/shared/composables/useBreakpoint'
import CardGrid from './CardGrid.vue'
import DataTable from './DataTable.vue'
import type { QueryLike } from '@/shared/components/QueryState.vue'
import type { Column, ViewMode } from './types'

const props = withDefaults(
  defineProps<{
    query: QueryLike
    items: T[]
    columns: Column[]
    itemKey: keyof T | ((item: T) => string | number)
    /** Total no servidor (paginação). Omita para esconder a paginação. */
    total?: number
    sizes?: readonly number[]
    density?: 'sm' | 'md'
    clickable?: boolean
  }>(),
  { sizes: () => [10, 20, 50], density: 'md' },
)
const emit = defineEmits<{ rowClick: [row: T] }>()
const view = defineModel<ViewMode>('view', { default: 'cards' })
const page = defineModel<number>('page', { default: 1 })
const perPage = defineModel<number>('perPage', { default: 10 })
defineSlots<{
  card(p: { item: T }): unknown
  actions?: (p: { row: T }) => unknown
  empty?: () => unknown
} & Record<string, ((p: any) => unknown) | undefined>>()

const { isDesktop } = useBreakpoint()
const showTable = computed(() => view.value === 'list' && isDesktop.value)
</script>

<template>
  <QueryState :query="props.query" :empty="items.length === 0">
    <template #empty><slot name="empty" /></template>

    <DataTable v-if="showTable" :columns="columns" :rows="items" :row-key="itemKey" :clickable="clickable" @row-click="emit('rowClick', $event)">
      <template v-for="c in columns" :key="c.key" #[`cell-${c.key}`]="slotProps"><slot :name="`cell-${c.key}`" v-bind="slotProps" /></template>
      <template v-if="$slots.actions" #actions="{ row }"><slot name="actions" :row="row" /></template>
    </DataTable>
    <CardGrid v-else :items="items" :item-key="itemKey" :density="density">
      <template #item="{ item }"><slot name="card" :item="item" /></template>
    </CardGrid>

    <AppPagination v-if="total !== undefined && total > 0" v-model:page="page" v-model:per-page="perPage" :total="total" :sizes="sizes" />
  </QueryState>
</template>
