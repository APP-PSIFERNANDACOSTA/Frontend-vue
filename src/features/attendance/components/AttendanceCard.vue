<script setup lang="ts">
import { CalendarCheck, CalendarClock, CalendarX2, Info, UserX } from '@lucide/vue'
import { computed } from 'vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useAttendance } from '../queries'
import { PERIODS, rateTone } from '../rate'

const props = withDefaults(defineProps<{ patientId?: number; title?: string }>(), { title: 'Frequência' })
const period = defineModel<string>('period', { default: 'all' })
const days = computed(() => PERIODS.find((p) => p.value === period.value)?.days ?? null)
const query = useAttendance(() => ({ ...(props.patientId ? { patient_id: props.patientId } : {}), days: days.value }))
const s = computed(() => query.data.value?.summary)
const tone = computed(() => rateTone(s.value?.rate ?? null))

const rows = computed(() => {
  const v = s.value
  if (!v) return []
  return [
    { icon: CalendarCheck, label: 'Sessões realizadas', value: v.completed, counts: false },
    { icon: UserX, label: 'Faltas', value: v.no_show, counts: true },
    { icon: CalendarClock, label: 'Remarcações pelo paciente', value: v.patient_reschedules, counts: true },
    { icon: CalendarX2, label: 'Cancelamentos pelo paciente', value: v.patient_cancellations, counts: true },
  ]
})
const psiEvents = computed(() => (s.value ? s.value.psychologist_reschedules + s.value.psychologist_cancellations : 0))
</script>

<template>
  <section class="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
    <header class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 class="font-semibold">{{ title }}</h3>
      <Select v-model="period">
        <SelectTrigger class="h-8 w-44 text-xs" aria-label="Período"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem v-for="p in PERIODS" :key="p.value" :value="p.value">{{ p.label }}</SelectItem></SelectContent>
      </Select>
    </header>

    <QueryState :query="query" :empty="!s || s.total === 0" loading-label="Calculando frequência...">
      <template #empty><EmptyState :icon="CalendarCheck" title="Ainda sem dados" description="A frequência aparece depois das primeiras sessões realizadas, faltas, remarcações ou cancelamentos." /></template>

      <div class="space-y-4">
        <div class="flex items-end justify-between gap-3">
          <div>
            <p :class="cn('text-4xl font-bold tabular-nums leading-none', tone.text)">{{ s?.rate }}%</p>
            <p :class="cn('mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium', tone.bg, tone.text)">{{ tone.label }}</p>
          </div>
          <p class="text-right text-xs text-muted-foreground">{{ s?.completed }} de {{ s?.total }} encontros<br />aconteceram como agendado</p>
        </div>

        <div class="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" :aria-valuenow="s?.rate ?? 0" aria-valuemin="0" aria-valuemax="100">
          <div :class="cn('h-full rounded-full transition-all duration-500', tone.bar)" :style="{ width: `${s?.rate ?? 0}%` }" />
        </div>

        <ul class="divide-y rounded-xl border">
          <li v-for="r in rows" :key="r.label" class="flex items-center gap-3 px-3 py-2.5 text-sm">
            <component :is="r.icon" class="size-4 shrink-0 text-muted-foreground" />
            <span class="flex-1">{{ r.label }}</span>
            <span class="font-semibold tabular-nums">{{ r.value }}</span>
          </li>
        </ul>

        <p v-if="psiEvents" class="text-xs text-muted-foreground">{{ psiEvents }} remarcação(ões) ou cancelamento(s) feitos por você não entram no cálculo.</p>
        <p class="flex items-start gap-1.5 text-xs text-muted-foreground"><Info class="mt-0.5 size-3.5 shrink-0" /> Frequência = realizadas ÷ (realizadas + faltas + remarcações e cancelamentos pedidos pelo paciente).</p>
      </div>
    </QueryState>
  </section>
</template>
