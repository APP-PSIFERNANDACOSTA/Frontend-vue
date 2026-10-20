<script setup lang="ts">
import { DollarSign, Plus } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import DataView from '@/shared/components/data/DataView.vue'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import ViewToggle from '@/shared/components/data/ViewToggle.vue'
import type { Column, ViewMode } from '@/shared/components/data/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useClientPagination } from '@/shared/composables/useClientPagination'
import { useConfirm } from '@/shared/composables/useConfirm'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import PaymentCard from '../components/PaymentCard.vue'
import PaymentRowActions from '../components/PaymentRowActions.vue'
import { PAYMENT_METHOD_MAP } from '../constants'
import { useDeletePayment, useDownloadReceipt, usePayments } from '../queries'
import { PAYMENT_METHOD_LABELS, type Payment } from '../types'

const router = useRouter()
const privacy = usePrivacyMode()
const confirm = useConfirm()

const search = ref(String(useRoute().query.q ?? '')) // ?q= vem do perfil do paciente ("Ver todos")
const method = ref('all')
const view = useStorage<ViewMode>('payments-listing-view', 'cards')

const query = usePayments(() => ({ payment_method: method.value !== 'all' ? method.value : undefined }))
// busca local (paciente, recibo, valor) — a API devolve a lista inteira
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const all = query.data.value ?? []
  return q ? all.filter((p) => p.patient?.name.toLowerCase().includes(q) || p.receipt_number.toLowerCase().includes(q) || String(p.amount).includes(q)) : all
})
const { page, perPage, total, pageItems } = useClientPagination(filtered, 10)
watch([search, method], () => (page.value = 1))

const download = useDownloadReceipt()
const del = useDeletePayment()
const downloadingId = computed(() => (download.isPending.value ? download.variables.value : null))
async function askDelete(p: Payment) {
  const ok = await confirm({ title: 'Excluir pagamento?', description: `O pagamento ${p.receipt_number} e o recibo gerado serão removidos. Esta ação não pode ser desfeita.`, confirmText: 'Excluir', destructive: true })
  if (ok) del.mutate(p.id)
}

const columns: Column[] = [
  { key: 'patient', label: 'Paciente' },
  { key: 'amount', label: 'Valor' },
  { key: 'date', label: 'Data' },
  { key: 'method', label: 'Método' },
  { key: 'receipt', label: 'Recibo', hideBelow: 'xl' },
]
const activeFilters = computed(() => (method.value !== 'all' ? 1 : 0))
const clear = () => ((search.value = ''), (method.value = 'all'))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Pagamentos" description="Gerencie os pagamentos e recibos dos pacientes">
      <template #actions><Button as-child><RouterLink to="/dashboard/payments/create"><Plus /> Cadastrar pagamento</RouterLink></Button></template>
    </PageHeader>

    <FilterBar v-model:search="search" search-placeholder="Paciente, recibo, valor..." :active-count="activeFilters" storage-key="payments-filters-open" @clear="clear">
      <FormField label="Método de pagamento">
        <Select v-model="method">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem v-for="(label, value) in PAYMENT_METHOD_LABELS" :key="value" :value="value">{{ label }}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <template #actions><ViewToggle v-model="view" class="hidden lg:inline-flex" /></template>
    </FilterBar>

    <DataView
      v-model:view="view" v-model:page="page" v-model:per-page="perPage"
      :query="query" :items="pageItems" :columns="columns" item-key="id" :total="total" clickable
      @row-click="(p: Payment) => router.push(`/dashboard/payments/${p.id}`)"
    >
      <template #card="{ item }"><PaymentCard :payment="item" :downloading="downloadingId === item.id" @download="download.mutate(item.id)" @delete="askDelete(item)" /></template>

      <template #cell-patient="{ row }"><span class="font-medium">{{ row.patient?.name ? privacy.name(row.patient.name) : 'N/A' }}</span></template>
      <template #cell-amount="{ row }"><span class="font-semibold text-success">{{ privacy.money(row.amount) }}</span></template>
      <template #cell-date="{ row }">{{ formatDate(row.payment_date) }}</template>
      <template #cell-method="{ row }"><StatusBadge :status="row.payment_method" :map="PAYMENT_METHOD_MAP" /></template>
      <template #cell-receipt="{ row }"><span class="font-mono text-xs">{{ row.receipt_number }}</span></template>
      <template #actions="{ row }"><PaymentRowActions :payment="row" :downloading="downloadingId === row.id" @download="download.mutate(row.id)" @delete="askDelete(row)" /></template>

      <template #empty>
        <EmptyState :icon="DollarSign" title="Nenhum pagamento encontrado" :description="search || method !== 'all' ? 'Não há pagamentos correspondentes aos filtros aplicados.' : 'Você ainda não cadastrou nenhum pagamento.'">
          <Button v-if="!search && method === 'all'" as-child><RouterLink to="/dashboard/payments/create"><Plus /> Cadastrar primeiro pagamento</RouterLink></Button>
        </EmptyState>
      </template>
    </DataView>
  </div>
</template>
