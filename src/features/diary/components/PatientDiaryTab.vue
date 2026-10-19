<script setup lang="ts">
import { BookOpen, RefreshCw } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import CardGrid from '@/shared/components/data/CardGrid.vue'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { usePatientDiary } from '../queries'
import { MOOD_OPTIONS, type MoodType } from '../types'
import DiaryEntryCard from './DiaryEntryCard.vue'
import WeeklyAnalysisCard from './WeeklyAnalysisCard.vue'

const props = defineProps<{ patientId: number; patientName: string }>()
const privacy = usePrivacyMode()

const PER_PAGE = 15 // o backend pagina de 15 em 15
const search = ref('')
const mood = ref<MoodType | 'all'>('all')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const perPage = ref(PER_PAGE)

const activeCount = computed(() => [mood.value !== 'all', dateFrom.value, dateTo.value].filter(Boolean).length)
const clear = () => ((search.value = ''), (mood.value = 'all'), (dateFrom.value = ''), (dateTo.value = ''))
watch([search, mood, dateFrom, dateTo, () => props.patientId], () => (page.value = 1))

const query = usePatientDiary(() => props.patientId, () => ({
  page: page.value,
  mood: mood.value === 'all' ? undefined : mood.value,
  date_from: dateFrom.value || undefined,
  date_to: dateTo.value || undefined,
  search: search.value || undefined,
}))
const entries = computed(() => query.data.value?.entries.data ?? [])
const total = computed(() => query.data.value?.entries.total ?? 0)
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold sm:text-xl">Diário emocional</h2>
        <p class="text-sm text-muted-foreground">Entradas do diário de {{ privacy.name(patientName) }}</p>
      </div>
      <Button variant="outline" class="w-full sm:w-auto" :disabled="query.isFetching.value" @click="query.refetch()">
        <RefreshCw :class="query.isFetching.value && 'animate-spin'" /> Atualizar
      </Button>
    </div>

    <WeeklyAnalysisCard :patient-id="patientId" :patient-name="patientName" />

    <FilterBar v-model:search="search" search-placeholder="Buscar no conteúdo..." :active-count="activeCount" storage-key="patient-diary-filters-open" @clear="clear">
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
        <EmptyState
          :icon="BookOpen"
          :title="search || activeCount ? 'Nenhuma entrada encontrada' : 'Nenhuma entrada encontrada'"
          :description="search || activeCount ? 'Tente ajustar os filtros' : 'O paciente ainda não criou entradas no diário'"
        />
      </template>
      <CardGrid :items="entries" item-key="id">
        <template #item="{ item }"><DiaryEntryCard :entry="item" /></template>
      </CardGrid>
      <AppPagination v-if="total > PER_PAGE" v-model:page="page" v-model:per-page="perPage" :total="total" :sizes="[PER_PAGE]" />
    </QueryState>
  </div>
</template>
