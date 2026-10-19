<script setup lang="ts">
import { BookOpen, Calendar, Users } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import CardGrid from '@/shared/components/data/CardGrid.vue'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import StatCard from '@/shared/components/StatCard.vue'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import DiaryEntryCard from '../components/DiaryEntryCard.vue'
import { useAllDiary } from '../queries'
import { MOOD_OPTIONS, type MoodType } from '../types'

const PER_PAGE = 15
const search = ref('')
const patientId = ref<number | null>(null)
const mood = ref<MoodType | 'all'>('all')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const perPage = ref(PER_PAGE)

const activeCount = computed(() => [patientId.value, mood.value !== 'all', dateFrom.value, dateTo.value].filter(Boolean).length)
const clear = () => ((search.value = ''), (patientId.value = null), (mood.value = 'all'), (dateFrom.value = ''), (dateTo.value = ''))
watch([search, patientId, mood, dateFrom, dateTo], () => (page.value = 1))

const query = useAllDiary(() => ({
  page: page.value,
  patient_id: patientId.value ?? undefined,
  mood: mood.value === 'all' ? undefined : mood.value,
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
  search: search.value || undefined,
}))
const entries = computed(() => query.data.value?.entries.data ?? [])
const total = computed(() => query.data.value?.entries.total ?? 0)
const patientsCount = computed(() => new Set(entries.value.map((e) => e.patient_id)).size)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Diários" description="Visualize os diários emocionais dos seus pacientes" />

    <div class="grid gap-4 sm:grid-cols-3">
      <StatCard label="Total de entradas" :value="total" :icon="BookOpen" hint="Diários registrados" :loading="query.isPending.value" />
      <StatCard label="Exibindo" :value="entries.length" :icon="Calendar" hint="Entradas nesta página" :loading="query.isPending.value" />
      <StatCard label="Pacientes na página" :value="patientsCount" :icon="Users" hint="Com entradas listadas" :loading="query.isPending.value" />
    </div>

    <FilterBar v-model:search="search" search-placeholder="Buscar no conteúdo..." :active-count="activeCount" storage-key="diary-filters-open" @clear="clear">
      <FormField label="Paciente"><PatientSelect v-model="patientId" clearable /></FormField>
      <FormField label="Humor">
        <Select v-model="mood">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os humores</SelectItem>
            <SelectItem v-for="m in MOOD_OPTIONS" :key="m.value" :value="m.value">{{ m.label }}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField v-slot="{ id }" label="Data inicial"><Input :id="id" v-model="dateFrom" type="date" /></FormField>
      <FormField v-slot="{ id }" label="Data final"><Input :id="id" v-model="dateTo" type="date" :min="dateFrom || undefined" /></FormField>
    </FilterBar>

    <QueryState :query="query" :empty="entries.length === 0">
      <template #empty>
        <EmptyState :icon="BookOpen" title="Nenhum diário encontrado" :description="search || activeCount ? 'Tente ajustar os filtros para encontrar mais resultados' : 'Ainda não há diários registrados pelos pacientes'" />
      </template>
      <CardGrid :items="entries" item-key="id">
        <template #item="{ item }">
          <RouterLink :to="`/dashboard/diary/${item.id}`" class="block h-full"><DiaryEntryCard :entry="item" show-patient-name class="h-full" /></RouterLink>
        </template>
      </CardGrid>
      <AppPagination v-if="total > PER_PAGE" v-model:page="page" v-model:per-page="perPage" :total="total" :sizes="[PER_PAGE]" />
    </QueryState>
  </div>
</template>
