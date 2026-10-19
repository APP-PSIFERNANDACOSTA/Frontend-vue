<script setup lang="ts" generic="T extends Record<string, any>">
/** Grid responsivo de cards. O conteúdo de cada item vem no slot `item`. */
import { cn } from '@/shared/lib/utils'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

const props = withDefaults(
  defineProps<{
    items: T[]
    itemKey: keyof T | ((item: T) => string | number)
    /** 'sm' = cards mais estreitos (até 4 colunas), 'md' = padrão (até 3). */
    density?: 'sm' | 'md'
    loading?: boolean
    skeletonCount?: number
  }>(),
  { density: 'md', skeletonCount: 6 },
)
defineSlots<{ item(p: { item: T; index: number }): unknown }>()
const keyOf = (item: T) => (typeof props.itemKey === 'function' ? props.itemKey(item) : (item[props.itemKey] as string | number))
const grid = { md: 'grid gap-4 md:grid-cols-2 xl:grid-cols-3', sm: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' }
</script>

<template>
  <div :class="cn(grid[density])">
    <template v-if="loading">
      <Card v-for="n in skeletonCount" :key="`sk-${n}`" class="gap-3 p-5">
        <Skeleton class="h-5 w-2/3" /><Skeleton class="h-4 w-1/2" /><Skeleton class="h-4 w-full" /><Skeleton class="h-9 w-full" />
      </Card>
    </template>
    <template v-else>
      <template v-for="(item, index) in items" :key="keyOf(item)"><slot name="item" :item="item" :index="index" /></template>
    </template>
  </div>
</template>
