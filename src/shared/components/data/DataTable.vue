<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * Tabela padrão do sistema.
 *   <DataTable :columns :rows row-key="id">
 *     <template #cell-name="{ row }">…</template>   (opcional por coluna)
 *     <template #actions="{ row }">…</template>     (coluna final de ações)
 *   </DataTable>
 */
import { computed } from 'vue'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { Breakpoint, Column } from './types'

const props = withDefaults(
  defineProps<{
    columns: Column[]
    rows: T[]
    rowKey: keyof T | ((row: T) => string | number)
    loading?: boolean
    /** Linhas de skeleton durante loading. */
    skeletonRows?: number
    actionsLabel?: string
    /** Torna a linha clicável. */
    clickable?: boolean
  }>(),
  { skeletonRows: 5, actionsLabel: 'Ações' },
)
const emit = defineEmits<{ rowClick: [row: T] }>()
defineSlots<{ actions?: (p: { row: T }) => unknown } & Record<string, ((p: { row: T; value: unknown }) => unknown) | undefined>>()

const keyOf = (row: T) => (typeof props.rowKey === 'function' ? props.rowKey(row) : (row[props.rowKey] as string | number))
const hide: Record<Breakpoint, string> = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' }
const align = { left: 'text-left', right: 'text-right', center: 'text-center' }
const cellClass = (c: Column) => cn(c.hideBelow && hide[c.hideBelow], c.align && align[c.align], c.class)
const hasActions = computed(() => true)
</script>

<template>
  <Card class="overflow-hidden p-0">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead v-for="c in columns" :key="c.key" :class="cn('h-10 text-xs', cellClass(c))">{{ c.label }}</TableHead>
          <TableHead v-if="$slots.actions && hasActions" class="h-10 text-right text-xs">{{ actionsLabel }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="loading">
          <TableRow v-for="n in skeletonRows" :key="`sk-${n}`">
            <TableCell v-for="c in columns" :key="c.key" :class="cellClass(c)"><Skeleton class="h-4 w-3/4" /></TableCell>
            <TableCell v-if="$slots.actions" class="text-right"><Skeleton class="ml-auto h-8 w-8" /></TableCell>
          </TableRow>
        </template>
        <TableRow
          v-for="row in rows"
          v-else
          :key="keyOf(row)"
          :class="clickable && 'cursor-pointer'"
          @click="clickable && emit('rowClick', row)"
        >
          <TableCell v-for="c in columns" :key="c.key" :class="cn('whitespace-normal', cellClass(c))">
            <slot :name="`cell-${c.key}`" :row="row" :value="row[c.key]">{{ row[c.key] ?? '—' }}</slot>
          </TableCell>
          <TableCell v-if="$slots.actions" class="text-right" @click.stop>
            <slot name="actions" :row="row" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </Card>
</template>
