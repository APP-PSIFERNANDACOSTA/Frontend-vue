<script setup lang="ts">
import { Calendar, ListFilter } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { isUpcoming } from '@/features/sessions/format'
import { useMySessions } from '@/features/sessions/queries'
import EmptyState from '@/shared/components/EmptyState.vue'
import PullToRefresh from '@/shared/components/PullToRefresh.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import PortalSessionCard from '../components/PortalSessionCard.vue'

const qc = useQueryClient()
const query = useMySessions()
const sessions = computed(() => query.data.value ?? [])
const t = (s: { session_date: string }) => +new Date(s.session_date)

const desc = (list: typeof sessions.value) => [...list].sort((a, b) => t(b) - t(a))
const upcoming = computed(() => sessions.value.filter(isUpcoming).sort((a, b) => t(a) - t(b)))
const next = computed(() => upcoming.value[0])
const later = computed(() => upcoming.value.slice(1))

type Filter = 'upcoming' | 'completed' | 'rescheduled' | 'no_show' | 'cancelled' | 'all'
const groups = computed<Record<Filter, typeof sessions.value>>(() => ({
  upcoming: upcoming.value,
  completed: desc(sessions.value.filter((s) => s.status === 'completed')),
  rescheduled: desc(sessions.value.filter((s) => s.status === 'rescheduled')),
  no_show: desc(sessions.value.filter((s) => s.status === 'no_show')),
  cancelled: desc(sessions.value.filter((s) => s.status === 'cancelled')),
  all: desc(sessions.value),
}))
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'completed', label: 'Realizadas' },
  { value: 'rescheduled', label: 'Remarcadas' },
  { value: 'no_show', label: 'Faltas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'all', label: 'Todas' },
]
// filtros sem sessões somem (exceto Próximas e Todas, que sempre fazem sentido)
const visibleFilters = computed(() => FILTERS.filter((f) => f.value === 'upcoming' || f.value === 'all' || groups.value[f.value].length))
const filter = ref<Filter>('upcoming')
// sem sessões futuras, abre direto nas realizadas (só na primeira carga)
let settled = false
watch(() => query.data.value, (d) => {
  if (settled || !d) return
  settled = true
  if (!d.some(isUpcoming)) filter.value = 'completed'
}, { immediate: true })
const list = computed(() => groups.value[filter.value])
const EMPTY: Record<Filter, string> = {
  upcoming: 'Você não tem sessões agendadas no momento.',
  completed: 'Nenhuma sessão realizada ainda.',
  rescheduled: 'Nenhuma sessão remarcada.',
  no_show: 'Nenhuma falta registrada.',
  cancelled: 'Nenhuma sessão cancelada.',
  all: 'Nenhuma sessão ainda.',
}
</script>

<template>
  <PullToRefresh :on-refresh="() => qc.invalidateQueries({ queryKey: ['sessions'] })">
    <div class="space-y-6">
      <p class="text-sm text-muted-foreground">Acompanhe seu histórico e próximas sessões terapêuticas</p>

      <QueryState :query="query" :empty="sessions.length === 0">
        <template #empty><EmptyState :icon="Calendar" title="Nenhuma sessão ainda" description="Suas sessões agendadas e realizadas aparecem aqui." /></template>

        <Select v-model="filter">
          <SelectTrigger class="h-11 w-full bg-card" aria-label="Filtrar sessões">
            <span class="flex items-center gap-2"><ListFilter class="size-4 text-muted-foreground" /><SelectValue /></span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="f in visibleFilters" :key="f.value" :value="f.value">{{ f.label }} ({{ groups[f.value].length }})</SelectItem>
          </SelectContent>
        </Select>

        <template v-if="filter === 'upcoming' && next">
          <section class="space-y-2">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand">Próxima sessão</h2>
            <PortalSessionCard :session="next" highlight />
          </section>
          <section v-if="later.length" class="space-y-2">
            <h2 class="font-semibold">Depois</h2>
            <PortalSessionCard v-for="s in later" :key="s.id" :session="s" />
          </section>
        </template>
        <EmptyState v-else-if="!list.length" :icon="Calendar" title="Nada por aqui" :description="EMPTY[filter]" />
        <section v-else class="space-y-2">
          <PortalSessionCard v-for="s in list" :key="s.id" :session="s" />
        </section>
      </QueryState>
    </div>
  </PullToRefresh>
</template>
