<script setup lang="ts">
import { Mail, Phone, Plus, Users } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import DataView from '@/shared/components/data/DataView.vue'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import ViewToggle from '@/shared/components/data/ViewToggle.vue'
import type { Column, ViewMode } from '@/shared/components/data/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import PatientActions from '../components/PatientActions.vue'
import PatientCard from '../components/PatientCard.vue'
import { PATIENT_STATUS_MAP, paymentTypeLabel } from '../constants'
import { usePatients } from '../queries'
import type { Patient } from '../types'

type Status = 'all' | 'active' | 'inactive'

const router = useRouter()
const privacy = usePrivacyMode()

const search = ref('')
const status = ref<Status>('active')
const page = ref(1)
const perPage = useStorage('patients-per-page', 10)
const view = useStorage<ViewMode>('patients-listing-view', 'cards') // mesma chave do app Next

const columns: Column[] = [
  { key: 'name', label: 'Paciente' },
  { key: 'status', label: 'Status' },
  { key: 'birthdate', label: 'Nascimento' },
  { key: 'contact', label: 'Contato' },
  { key: 'payment', label: 'Pagamento' },
]

const activeFilters = computed(() => (status.value !== 'active' ? 1 : 0))
const clear = () => ((search.value = ''), (status.value = 'active'))
watch([search, status, perPage], () => (page.value = 1))

const query = usePatients(() => ({
  search: search.value || undefined,
  status: status.value,
  page: page.value,
  per_page: perPage.value,
}))
const patients = computed(() => query.data.value?.patients.data ?? [])
const total = computed(() => query.data.value?.patients.total ?? 0)
const open = (p: Patient) => router.push(`/dashboard/patients/${p.id}`)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Pacientes" description="Gerencie seus pacientes e seus dados">
      <template #actions>
        <Button as-child><RouterLink to="/dashboard/patients/create"><Plus /> Cadastrar paciente</RouterLink></Button>
      </template>
    </PageHeader>

    <FilterBar v-model:search="search" search-placeholder="Buscar por nome, e-mail ou telefone..." :active-count="activeFilters" storage-key="patients-filters-open" @clear="clear">
      <FormField label="Status">
        <Select v-model="status">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <template #actions><ViewToggle v-model="view" class="hidden lg:inline-flex" /></template>
    </FilterBar>

    <DataView
      v-model:view="view" v-model:page="page" v-model:per-page="perPage"
      :query="query" :items="patients" :columns="columns" item-key="id" :total="total" :sizes="[6, 10, 20, 50]" clickable
      @row-click="open"
    >
      <template #card="{ item }"><PatientCard :patient="item" /></template>

      <template #cell-name="{ row }">
        <p class="font-medium">{{ privacy.name(row.name) }}</p>
        <p class="text-xs text-muted-foreground">ID: {{ row.id }}</p>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" :map="PATIENT_STATUS_MAP" /></template>
      <template #cell-birthdate="{ row }">{{ formatDate(row.birthdate) || 'Não informado' }}</template>
      <template #cell-contact="{ row }">
        <div class="space-y-1 text-sm">
          <div v-if="row.email" class="flex items-center gap-2"><Mail class="size-3.5 text-muted-foreground" /><span class="max-w-[220px] truncate">{{ privacy.email(row.email) }}</span></div>
          <div v-if="row.phone" class="flex items-center gap-2"><Phone class="size-3.5 text-muted-foreground" />{{ privacy.phone(row.phone) }}</div>
          <span v-if="!row.email && !row.phone" class="text-muted-foreground">—</span>
        </div>
      </template>
      <template #cell-payment="{ row }">
        <p class="text-sm">{{ paymentTypeLabel(row.payment_type) }}</p>
        <p class="text-sm text-muted-foreground">{{ row.price_session ? privacy.money(row.price_session) : '—' }}</p>
      </template>
      <template #actions="{ row }"><PatientActions :patient="row" :label="privacy.name(row.name)" /></template>

      <template #empty>
        <EmptyState
          :icon="Users"
          :title="search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'"
          :description="search ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando seu primeiro paciente'"
        >
          <Button v-if="!search" as-child><RouterLink to="/dashboard/patients/create"><Plus /> Cadastrar primeiro paciente</RouterLink></Button>
        </EmptyState>
      </template>
    </DataView>
  </div>
</template>
