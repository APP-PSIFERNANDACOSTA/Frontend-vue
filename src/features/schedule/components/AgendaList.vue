<script setup lang="ts">
import { Calendar } from '@lucide/vue'
import { computed } from 'vue'
import { ptBR } from 'date-fns/locale'
import { SESSION_STATUS_MAP } from '@/features/sessions/status'
import type { Session } from '@/features/sessions/types'
import type { GoogleCalendarEvent } from '@/features/settings/google.api'
import EmptyState from '@/shared/components/EmptyState.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatSessionInstantInSaoPaulo, getBrazilWallDateKey, getSaoPauloTodayNoonDate } from '@/shared/lib/datetime-br'
import { cn } from '@/shared/lib/utils'
import { googleEventStyle } from '../googleColors'

const props = defineProps<{ monthKey: string; sessions: Session[]; events: GoogleCalendarEvent[] }>()
const emit = defineEmits<{ openSession: [s: Session]; openEvent: [e: GoogleCalendarEvent] }>()
const privacy = usePrivacyMode()
const todayKey = getBrazilWallDateKey(getSaoPauloTodayNoonDate())
const wall = (iso: string, p: string) => formatSessionInstantInSaoPaulo(iso, p, { locale: ptBR })
const linked = computed(() => new Set(props.sessions.map((s) => s.google_event_id).filter((id): id is string => !!id)))

type Row = { key: string; at: number; time: string; title: string; session?: Session; event?: GoogleCalendarEvent }
const groups = computed(() => {
  const rows = new Map<string, Row[]>()
  const push = (day: string, r: Row) => {
    if (!day.startsWith(props.monthKey)) return // só o mês navegado (a busca traz dias vizinhos)
    rows.set(day, [...(rows.get(day) ?? []), r])
  }
  for (const s of props.sessions) push(wall(s.session_date, 'yyyy-MM-dd'), { key: `s${s.id}`, at: +new Date(s.session_date), time: wall(s.session_date, 'HH:mm'), title: s.patient?.name ? privacy.name(s.patient.name) : 'Sem paciente', session: s })
  for (const e of props.events.filter((x) => !linked.value.has(x.id))) push(wall(e.start, 'yyyy-MM-dd'), { key: `e${e.id}`, at: +new Date(e.start), time: wall(e.start, 'HH:mm'), title: e.summary || '(sem título)', event: e })
  return [...rows.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, list]) => ({ day, list: list.sort((a, b) => a.at - b.at) }))
})
const dayLabel = (day: string) => wall(new Date(`${day}T15:00:00Z`).toISOString(), "EEEE, d 'de' MMMM")
</script>

<template>
  <EmptyState v-if="!groups.length" :icon="Calendar" title="Nenhuma sessão neste mês" description="Navegue pelos meses ou agende uma sessão pela página do paciente." />
  <div v-else class="space-y-5">
    <section v-for="g in groups" :key="g.day">
      <h3 :class="cn('mb-2 flex items-center gap-2 text-sm font-semibold first-letter:uppercase', g.day === todayKey && 'text-brand-700')">
        {{ dayLabel(g.day) }}<span v-if="g.day === todayKey" class="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">Hoje</span>
      </h3>
      <ul class="divide-y overflow-hidden rounded-xl border bg-card">
        <li v-for="r in g.list" :key="r.key">
          <button type="button" class="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50" @click="r.session ? emit('openSession', r.session) : emit('openEvent', r.event!)">
            <span class="w-14 shrink-0 text-base font-bold tabular-nums">{{ r.time }}</span>
            <span class="min-w-0 flex-1"><span class="block truncate font-medium">{{ r.title }}</span><span v-if="r.session?.duration" class="text-xs text-muted-foreground">{{ r.session.duration }} min</span><span v-if="r.event" class="text-xs text-muted-foreground">Google Calendar</span></span>
            <StatusBadge v-if="r.session" :status="r.session.status" :map="SESSION_STATUS_MAP" />
            <span v-else class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: googleEventStyle(r.event!.colorId).backgroundColor }" />
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
