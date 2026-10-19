<script setup lang="ts">
/** Paginação + "itens por página" + resumo. Props em modelo de API Laravel (total / per_page). */
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { Button } from '@/shared/ui/button'
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
} from '@/shared/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const props = withDefaults(defineProps<{ total: number; sizes?: readonly number[] }>(), { sizes: () => [10, 20, 50] })
const page = defineModel<number>('page', { default: 1 })
const perPage = defineModel<number>('perPage', { default: 10 })

const from = () => (props.total === 0 ? 0 : (page.value - 1) * perPage.value + 1)
const to = () => Math.min(page.value * perPage.value, props.total)
const onSize = (v: unknown) => {
  perPage.value = Number(v)
  page.value = 1
}
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center justify-between gap-3 sm:justify-start">
      <span class="whitespace-nowrap text-sm text-muted-foreground">Mostrando {{ from() }}–{{ to() }} de {{ total }}</span>
      <Select :model-value="String(perPage)" @update:model-value="onSize">
        <SelectTrigger class="h-9 w-20" aria-label="Itens por página"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="s in sizes" :key="s" :value="String(s)">{{ s }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Pagination v-slot="{ page: current }" v-model:page="page" :total="total" :items-per-page="perPage" :sibling-count="1" class="mx-0 w-auto justify-center">
      <PaginationContent v-slot="{ items }">
        <Button variant="ghost" size="icon" aria-label="Página anterior" :disabled="current === 1" @click="page = Math.max(1, page - 1)">
          <ChevronLeft />
        </Button>
        <template v-for="(item, i) in items" :key="i">
          <PaginationItem v-if="item.type === 'page'" :value="item.value" :is-active="item.value === current">{{ item.value }}</PaginationItem>
          <PaginationEllipsis v-else :index="i" />
        </template>
        <Button variant="ghost" size="icon" aria-label="Próxima página" :disabled="current * perPage >= total" @click="page = page + 1">
          <ChevronRight />
        </Button>
      </PaginationContent>
    </Pagination>
  </div>
</template>
