<script setup lang="ts">
import { AlertCircle, Eye, FileCheck, FileDown, Loader2 } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import DataView from '@/shared/components/data/DataView.vue'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import ViewToggle from '@/shared/components/data/ViewToggle.vue'
import type { Column, ViewMode } from '@/shared/components/data/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useClientPagination } from '@/shared/composables/useClientPagination'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import ReceiptCard from '../components/ReceiptCard.vue'
import { RECEIPT_STATUS_MAP } from '../constants'
import type { HealthReceipt } from '../types'
import { useExportPendingReceipts, useHealthReceipts } from '../queries'

const router = useRouter()
const privacy = usePrivacyMode()
const view = useStorage<ViewMode>('receipts-listing-view', 'cards')
const columns: Column[] = [
  { key: 'patient', label: 'Paciente' },
  { key: 'amount', label: 'Valor' },
  { key: 'paymentDate', label: 'Pagamento' },
  { key: 'serviceDate', label: 'Atendimento', hideBelow: 'xl' },
  { key: 'status', label: 'Status' },
  { key: 'receipt', label: 'Recibo', hideBelow: 'xl' },
]

const status = ref<'pending' | 'issued' | 'all'>('pending')
const patientId = ref<number | null>(null)
const from = ref('')
const to = ref('')

const filters = computed(() => ({
  patient_id: patientId.value ?? undefined,
  start_date: from.value || undefined,
  end_date: to.value || undefined,
}))
const query = useHealthReceipts(() => ({ ...filters.value, status: status.value !== 'all' ? status.value : undefined }))
const receipts = computed(() => query.data.value?.receipts ?? [])
const pendingCount = computed(() => query.data.value?.pending_count ?? 0)
const { page, perPage, total, pageItems } = useClientPagination(receipts, 10)
watch([status, patientId, from, to], () => (page.value = 1))

const activeCount = computed(() => [status.value !== 'pending', patientId.value, from.value, to.value].filter(Boolean).length)
const clear = () => ((status.value = 'pending'), (patientId.value = null), (from.value = ''), (to.value = ''))
const exportPending = useExportPendingReceipts()
const hasFilters = computed(() => !!(patientId.value || from.value || to.value))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Recibo Saúde" description="Recibos para emissão no Carnê-leão">
      <template #actions>
        <StatusBadge v-if="pendingCount > 0" tone="warning" :label="`${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`" />
        <Button variant="outline" :disabled="exportPending.isPending.value || pendingCount === 0" @click="exportPending.mutate(filters)">
          <Loader2 v-if="exportPending.isPending.value" class="animate-spin" /><FileDown v-else /> Exportar PDF
        </Button>
      </template>
    </PageHeader>

    <FilterBar no-search :active-count="activeCount" storage-key="receipts-filters-open" default-open @clear="clear">
      <FormField label="Paciente"><PatientSelect v-model="patientId" clearable /></FormField>
      <FormField label="Status">
        <Select v-model="status">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="issued">Emitidos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField v-slot="{ id }" label="Data de"><Input :id="id" v-model="from" type="date" /></FormField>
      <FormField v-slot="{ id }" label="Data até"><Input :id="id" v-model="to" type="date" :min="from || undefined" /></FormField>
      <template #actions><ViewToggle v-model="view" class="hidden lg:inline-flex" /></template>
    </FilterBar>

    <DataView
      v-model:view="view" v-model:page="page" v-model:per-page="perPage"
      :query="query" :items="pageItems" :columns="columns" item-key="id" :total="total" density="sm" clickable
      @row-click="(r: HealthReceipt) => router.push(`/dashboard/receipts/${r.id}`)"
    >
      <template #card="{ item }"><ReceiptCard :receipt="item" /></template>

      <template #cell-patient="{ row }">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-medium">{{ privacy.name(row.payment?.patient?.name || 'Paciente') }}</span>
          <StatusBadge v-if="row.missing_cpf" tone="danger"><AlertCircle class="size-3" /> CPF ausente</StatusBadge>
        </div>
      </template>
      <template #cell-amount="{ row }"><span class="font-semibold">{{ privacy.money(row.amount) }}</span></template>
      <template #cell-paymentDate="{ row }">{{ formatDate(row.payment_date) }}</template>
      <template #cell-serviceDate="{ row }">{{ formatDate(row.service_date) }}</template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" :map="RECEIPT_STATUS_MAP" /></template>
      <template #cell-receipt="{ row }"><span class="font-mono text-xs">{{ row.payment?.receipt_number || '—' }}</span></template>
      <template #actions="{ row }">
        <Button size="sm" variant="outline" as-child @click.stop><RouterLink :to="`/dashboard/receipts/${row.id}`"><Eye /> {{ row.status === 'pending' ? 'Emitir' : 'Ver' }}</RouterLink></Button>
      </template>

      <template #empty>
        <EmptyState
          :icon="FileCheck"
          title="Nenhum recibo encontrado"
          :description="status === 'pending' && !hasFilters ? 'Todos os recibos foram emitidos.' : hasFilters ? 'Nenhum recibo corresponde aos filtros aplicados.' : 'Cadastre um pagamento para gerar um recibo automaticamente.'"
        >
          <Button v-if="hasFilters" variant="outline" size="sm" @click="clear">Limpar filtros</Button>
        </EmptyState>
      </template>
    </DataView>
  </div>
</template>
