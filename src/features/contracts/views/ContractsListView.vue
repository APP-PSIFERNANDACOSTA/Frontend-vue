<script setup lang="ts">
import { File, Plus } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { paymentTypeLabel } from '@/features/patients/constants'
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
import { useConfirm } from '@/shared/composables/useConfirm'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import ContractListCard from '../components/ContractListCard.vue'
import ContractRowActions from '../components/ContractRowActions.vue'
import { useContracts, useDeleteContract, useInactivateContract, useResendContract } from '../queries'
import { CONTRACT_STATUS_MAP } from '../status'
import { contractActions } from '../template'
import { CONTRACT_PAYMENT_TYPES, type Contract } from '../types'

const router = useRouter()
const privacy = usePrivacyMode()
const tab = ref('pending')
const view = useStorage<ViewMode>('contracts-listing-view', 'cards')
const query = useContracts(tab)

// filtros locais (a API devolve a lista do status escolhido)
const search = ref('')
const patientId = ref<number | null>(null)
const payType = ref('all')
const from = ref('')
const to = ref('')
const activeCount = computed(() => [patientId.value, payType.value !== 'all', from.value, to.value].filter(Boolean).length)
const clear = () => ((search.value = ''), (patientId.value = null), (payType.value = 'all'), (from.value = ''), (to.value = ''))

const contracts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (query.data.value ?? []).filter((c) => {
    const created = c.created_at.slice(0, 10)
    return (!q || [c.patient?.name, c.internal_description, `#${c.id}`].some((v) => v?.toLowerCase().includes(q)))
      && (!patientId.value || c.patient_id === patientId.value)
      && (payType.value === 'all' || c.payment_type === payType.value)
      && (!from.value || created >= from.value)
      && (!to.value || created <= to.value)
  })
})
const { page, perPage, total, pageItems } = useClientPagination(contracts, 12)
watch([tab, search, patientId, payType, from, to], () => (page.value = 1))

const columns: Column[] = [
  { key: 'patient', label: 'Paciente' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Pagamento' },
  { key: 'price', label: 'Valor da sessão' },
  { key: 'created', label: 'Criado em', hideBelow: 'xl' },
  { key: 'signed', label: 'Assinado em', hideBelow: 'xl' },
]
const dt = (iso?: string | null) => (iso ? formatDate(iso, 'dd/MM/yyyy') : '—')

const confirm = useConfirm()
const resend = useResendContract()
const inactivate = useInactivateContract()
const del = useDeleteContract()
async function askInactivate(id: number) {
  if (await confirm({ title: 'Inativar contrato?', description: 'O contrato assinado deixa de valer e sai da projeção financeira.', confirmText: 'Inativar', destructive: true })) inactivate.mutate(id)
}
async function askDelete(id: number) {
  if (await confirm({ title: 'Excluir contrato?', description: 'Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.', confirmText: 'Excluir', destructive: true })) del.mutate(id)
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Contratos terapêuticos" description="Gerencie os contratos dos seus pacientes">
      <template #actions><Button as-child><RouterLink to="/dashboard/contracts/create"><Plus /> Criar contrato</RouterLink></Button></template>
    </PageHeader>

    <Tabs v-model="tab">
      <TabsList class="grid w-full grid-cols-4 sm:inline-flex sm:w-auto">
        <TabsTrigger value="pending">Pendentes</TabsTrigger>
        <TabsTrigger value="signed">Assinados</TabsTrigger>
        <TabsTrigger value="inactive">Inativos</TabsTrigger>
        <TabsTrigger value="all">Todos</TabsTrigger>
      </TabsList>
    </Tabs>

    <FilterBar v-model:search="search" search-placeholder="Paciente, descrição ou nº do contrato..." :active-count="activeCount" storage-key="contracts-filters-open" @clear="clear">
      <FormField label="Paciente"><PatientSelect v-model="patientId" clearable /></FormField>
      <FormField label="Tipo de pagamento">
        <Select v-model="payType">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem v-for="t in CONTRACT_PAYMENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</SelectItem></SelectContent>
        </Select>
      </FormField>
      <FormField v-slot="{ id }" label="Criado de"><Input :id="id" v-model="from" type="date" /></FormField>
      <FormField v-slot="{ id }" label="Criado até"><Input :id="id" v-model="to" type="date" :min="from || undefined" /></FormField>
      <template #actions><ViewToggle v-model="view" class="hidden lg:inline-flex" /></template>
    </FilterBar>

    <DataView
      v-model:view="view" v-model:page="page" v-model:per-page="perPage"
      :query="query" :items="pageItems" :columns="columns" item-key="id" :total="total" :sizes="[12, 24, 48]" clickable
      @row-click="(c: Contract) => router.push(`/dashboard/contracts/${c.id}`)"
    >
      <template #card="{ item }"><ContractListCard :contract="item" @resend="resend.mutate(item.id)" @inactivate="askInactivate(item.id)" @delete="askDelete(item.id)" /></template>

      <template #cell-patient="{ row }">
        <span class="font-medium">{{ row.patient ? privacy.name(row.patient.name) : 'Paciente novo (cadastro na assinatura)' }}</span>
        <span v-if="row.internal_description" class="block truncate text-xs text-muted-foreground">{{ row.internal_description }}</span>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="contractActions(row).status" :map="CONTRACT_STATUS_MAP" /></template>
      <template #cell-type="{ row }">{{ paymentTypeLabel(row.payment_type) }}</template>
      <template #cell-price="{ row }"><span class="font-semibold">{{ privacy.money(row.price_session) }}</span></template>
      <template #cell-created="{ row }">{{ dt(row.created_at) }}</template>
      <template #cell-signed="{ row }">{{ dt(row.signed_at) }}</template>
      <template #actions="{ row }"><ContractRowActions :contract="row" @resend="resend.mutate(row.id)" @inactivate="askInactivate(row.id)" @delete="askDelete(row.id)" /></template>

      <template #empty>
        <EmptyState :icon="File" title="Nenhum contrato encontrado" :description="search || activeCount ? 'Nenhum contrato corresponde aos filtros aplicados.' : tab === 'all' ? 'Você ainda não criou nenhum contrato.' : 'Não há contratos nesta categoria.'">
          <Button v-if="search || activeCount" variant="outline" size="sm" @click="clear">Limpar filtros</Button>
          <Button v-else-if="tab === 'all' || tab === 'pending'" as-child><RouterLink to="/dashboard/contracts/create"><Plus /> Criar contrato</RouterLink></Button>
        </EmptyState>
      </template>
    </DataView>
  </div>
</template>
