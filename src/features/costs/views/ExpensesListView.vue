<script setup lang="ts">
import { Pencil, Plus, Receipt, Trash2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DataView from '@/shared/components/data/DataView.vue'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import type { Column } from '@/shared/components/data/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatCard from '@/shared/components/StatCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useClientPagination } from '@/shared/composables/useClientPagination'
import { useConfirm } from '@/shared/composables/useConfirm'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate, formatMoney } from '@/shared/lib/format'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/features/payments/types'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useDeleteExpense, useExpenses } from '../queries'
import type { Expense } from '../types'

const privacy = usePrivacyMode()
const confirm = useConfirm()
const search = ref('')
const query = useExpenses()
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const all = query.data.value ?? []
  return q ? all.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)) : all
})
const totalAmount = computed(() => filtered.value.reduce((sum, e) => sum + Number(e.amount || 0), 0))
const { page, perPage, total, pageItems } = useClientPagination(filtered, 15)
watch(search, () => (page.value = 1))

const del = useDeleteExpense()
async function askDelete(e: Expense) {
  if (await confirm({ title: 'Excluir custo?', description: `"${e.title}" será removido dos lançamentos. Esta ação não pode ser desfeita.`, confirmText: 'Excluir', destructive: true })) del.mutate(e.id)
}
const method = (m: string | null) => (m ? (PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? m) : '—')
const columns: Column[] = [
  { key: 'title', label: 'Custo' },
  { key: 'method', label: 'Forma', hideBelow: 'md' },
  { key: 'date', label: 'Pago em', hideBelow: 'md' },
  { key: 'amount', label: 'Valor', align: 'right' },
]
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Custos de saída" description="Acompanhe e filtre os lançamentos de custos.">
      <template #actions><Button as-child><RouterLink to="/dashboard/costs/create"><Plus /> Novo custo</RouterLink></Button></template>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Lançamentos" :value="total" :icon="Receipt" :loading="query.isPending.value" />
      <StatCard label="Total em custos" :value="privacy.enabled.value ? 'R$ •••' : formatMoney(totalAmount)" :icon="Receipt" :loading="query.isPending.value" :hint="search ? 'Com a busca aplicada' : 'Todos os lançamentos'" />
    </div>

    <FilterBar v-model:search="search" search-placeholder="Buscar título ou descrição" @clear="search = ''" />

    <DataView v-model:page="page" v-model:per-page="perPage" :query="query" :items="pageItems" :columns="columns" item-key="id" :total="total" :sizes="[15, 30, 50]" view="list">
      <template #card="{ item }">
        <Card class="min-w-0">
          <CardContent class="space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0"><p class="truncate font-medium">{{ item.title }}</p><p class="line-clamp-2 text-sm text-muted-foreground">{{ item.description }}</p></div>
              <p class="shrink-0 font-semibold">{{ privacy.money(item.amount) }}</p>
            </div>
            <p class="text-xs text-muted-foreground">{{ method(item.payment_method) }}<template v-if="item.payment_date"> • Pago em {{ formatDate(item.payment_date) }}</template></p>
            <div class="flex gap-2 border-t pt-3">
              <Button size="sm" variant="outline" class="flex-1" as-child><RouterLink :to="`/dashboard/costs/${item.id}/edit`"><Pencil /> Editar</RouterLink></Button>
              <Button size="icon" variant="outline" class="size-8 text-destructive hover:text-destructive" aria-label="Excluir" @click="askDelete(item)"><Trash2 /></Button>
            </div>
          </CardContent>
        </Card>
      </template>

      <template #cell-title="{ row }"><p class="font-medium">{{ row.title }}</p><p class="line-clamp-1 text-xs text-muted-foreground">{{ row.description }}</p></template>
      <template #cell-method="{ row }"><StatusBadge tone="neutral" :label="method(row.payment_method)" /></template>
      <template #cell-date="{ row }">{{ row.payment_date ? formatDate(row.payment_date) : '—' }}</template>
      <template #cell-amount="{ row }"><span class="font-semibold">{{ privacy.money(row.amount) }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-1">
          <Button size="icon" variant="outline" class="size-8" aria-label="Editar" as-child><RouterLink :to="`/dashboard/costs/${row.id}/edit`"><Pencil /></RouterLink></Button>
          <Button size="icon" variant="outline" class="size-8 text-destructive hover:text-destructive" aria-label="Excluir" @click="askDelete(row)"><Trash2 /></Button>
        </div>
      </template>

      <template #empty>
        <EmptyState :icon="Receipt" title="Nenhum custo encontrado" :description="search ? 'Nenhum lançamento corresponde à busca.' : 'Cadastre o primeiro custo de saída.'">
          <Button v-if="!search" as-child><RouterLink to="/dashboard/costs/create"><Plus /> Novo custo</RouterLink></Button>
        </EmptyState>
      </template>
    </DataView>
  </div>
</template>
