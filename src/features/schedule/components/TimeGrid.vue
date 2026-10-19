<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ptBR } from 'date-fns/locale'
import { SESSION_STATUS_LABELS, type Session } from '@/features/sessions/types'
import type { GoogleCalendarEvent } from '@/features/settings/google.api'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatBrazilCalendarDayNumber, formatSessionInstantInSaoPaulo, getBrazilWallDateKey, getSaoPauloTodayNoonDate } from '@/shared/lib/datetime-br'
import { cn } from '@/shared/lib/utils'
import { SESSION_CHIP } from '../chip'
import { layoutLanes, minutesOfDay, type CalItem } from '../calendar'
import { googleEventStyle } from '../googleColors'

const props = defineProps<{ days: Date[]; sessions: Session[]; events: GoogleCalendarEvent[]; selectedKey: string | null }>()
const emit = defineEmits<{ selectDay: [day: Date]; openSession: [s: Session]; openEvent: [e: GoogleCalendarEvent] }>()
const privacy = usePrivacyMode()

const HOUR_PX = 60
const todayKey = getBrazilWallDateKey(getSaoPauloTodayNoonDate())
const wall = (iso: string, p: string) => formatSessionInstantInSaoPaulo(iso, p, { locale: ptBR })

// eventos do Google já vinculados a uma sessão não se repetem
const linked = computed(() => new Set(props.sessions.map((s) => s.google_event_id).filter((id): id is string => !!id)))

const items = computed<CalItem[]>(() => {
  const out: CalItem[] = []
  for (const s of props.sessions) {
    const start = minutesOfDay(s.session_date)
    out.push({ key: `s${s.id}`, kind: 'session', dayKey: wall(s.session_date, 'yyyy-MM-dd'), startMin: start, endMin: start + Math.max(s.duration || 50, 25), title: s.patient?.name ? privacy.name(s.patient.name) : 'Sem paciente', subtitle: SESSION_STATUS_LABELS[s.status], ref: s })
  }
  for (const e of props.events.filter((x) => !linked.value.has(x.id))) {
    const start = minutesOfDay(e.start)
    const dur = Math.round((+new Date(e.end) - +new Date(e.start)) / 60000)
    out.push({ key: `e${e.id}`, kind: 'event', dayKey: wall(e.start, 'yyyy-MM-dd'), startMin: start, endMin: start + Math.min(Math.max(dur || 50, 25), 24 * 60 - start), title: e.summary || '(sem título)', subtitle: 'Google Calendar', ref: e })
  }
  return out
})

// janela de horas: 6h–22h, ampliada se houver algo fora dela
const bounds = computed(() => {
  const mins = items.value.map((i) => i.startMin)
  const maxs = items.value.map((i) => i.endMin)
  return { start: Math.min(6, Math.floor(Math.min(...mins, 360) / 60)), end: Math.min(24, Math.max(22, Math.ceil(Math.max(...maxs, 0) / 60))) }
})
const hours = computed(() => Array.from({ length: bounds.value.end - bounds.value.start }, (_, i) => bounds.value.start + i))
const totalH = computed(() => hours.value.length * HOUR_PX)

const columns = computed(() =>
  props.days.map((d) => {
    const key = getBrazilWallDateKey(d)
    const list = layoutLanes(items.value.filter((i) => i.dayKey === key))
    return { day: d, key, list, count: list.filter((i) => i.kind === 'session').length }
  }),
)

const top = (min: number) => ((min - bounds.value.start * 60) / 60) * HOUR_PX
const nowMin = ref(minutesOfDay(new Date().toISOString()))
setInterval(() => (nowMin.value = minutesOfDay(new Date().toISOString())), 60_000)

// rola até a primeira sessão do período; sem sessões, até a hora atual (se hoje estiver visível) ou 8h
const scroller = ref<HTMLElement | null>(null)
function scrollToFocus() {
  const el = scroller.value
  if (!el) return
  const today = columns.value.some((c) => c.key === todayKey)
  const first = Math.min(...items.value.map((i) => i.startMin), Infinity)
  const target = Number.isFinite(first) ? first - 30 : today ? nowMin.value - 60 : 8 * 60
  el.scrollTop = Math.max(0, top(Math.max(target, bounds.value.start * 60)))
}
onMounted(() => nextTick(scrollToFocus))
watch(() => [props.days[0]?.getTime(), props.days.length], () => nextTick(scrollToFocus))

const lines = `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, var(--border) ${HOUR_PX - 1}px, var(--border) ${HOUR_PX}px)`
const weekday = (d: Date) => wall(d.toISOString(), 'EEE').replace('.', '')
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const multi = computed(() => props.days.length > 1)
</script>

<template>
  <div class="overflow-hidden rounded-xl border bg-card">
    <div ref="scroller" class="max-h-[72vh] overflow-auto">
      <div :class="multi ? 'min-w-[46rem]' : ''">
        <!-- cabeçalho dos dias (fixo ao rolar) -->
        <div class="sticky top-0 z-20 grid border-b bg-card/95 backdrop-blur" :style="{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }">
          <div />
          <button
            v-for="c in columns"
            :key="c.key"
            type="button"
            :class="cn('flex flex-col items-center gap-0.5 border-l py-2.5 transition-colors hover:bg-muted/50', selectedKey === c.key && 'bg-brand-50')"
            @click="emit('selectDay', new Date(c.day.getTime()))"
          >
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ weekday(c.day) }}</span>
            <span :class="cn('flex size-8 items-center justify-center rounded-full text-base font-semibold', c.key === todayKey && 'bg-primary text-primary-foreground')">{{ formatBrazilCalendarDayNumber(c.day) }}</span>
            <span class="h-4 text-[11px] text-muted-foreground">{{ c.count ? `${c.count} ${c.count > 1 ? 'sessões' : 'sessão'}` : '' }}</span>
          </button>
        </div>

        <!-- corpo: horas + colunas -->
        <div class="grid" :style="{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }">
          <div class="relative" :style="{ height: `${totalH}px` }">
            <span v-for="(h, i) in hours" :key="h" class="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" :style="{ top: `${i * HOUR_PX}px`, display: i === 0 ? 'none' : 'block' }">{{ String(h).padStart(2, '0') }}:00</span>
          </div>

          <div v-for="c in columns" :key="c.key" :class="cn('relative border-l', c.key === todayKey && 'bg-brand-50/40')" :style="{ height: `${totalH}px`, backgroundImage: lines }">
            <div v-if="c.key === todayKey && nowMin >= bounds.start * 60 && nowMin <= bounds.end * 60" class="pointer-events-none absolute inset-x-0 z-10 flex items-center" :style="{ top: `${top(nowMin)}px` }">
              <span class="-ml-1 size-2 rounded-full bg-destructive" /><span class="h-px flex-1 bg-destructive" />
            </div>

            <template v-for="it in c.list" :key="it.key">
              <button
                type="button"
                :class="cn('absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-xs shadow-xs transition hover:z-10 hover:shadow-md', it.kind === 'session' ? SESSION_CHIP[(it.ref as Session).status] : 'border-l-black/30')"
                :style="{
                  top: `${top(it.startMin) + 1}px`,
                  height: `${Math.max(((it.endMin - it.startMin) / 60) * HOUR_PX - 2, 22)}px`,
                  left: `calc(${(it.lane / it.lanes) * 100}% + 2px)`,
                  width: `calc(${100 / it.lanes}% - 4px)`,
                  ...(it.kind === 'event' ? googleEventStyle((it.ref as GoogleCalendarEvent).colorId) : {}),
                }"
                :title="`${hhmm(it.startMin)} – ${hhmm(it.endMin)} · ${it.title}`"
                @click="it.kind === 'session' ? emit('openSession', it.ref as Session) : emit('openEvent', it.ref as GoogleCalendarEvent)"
              >
                <span class="block truncate font-semibold leading-tight">{{ it.title }}</span>
                <span v-if="it.endMin - it.startMin >= 40" class="block truncate opacity-80">{{ hhmm(it.startMin) }} – {{ hhmm(it.endMin) }}</span>
                <span v-if="it.endMin - it.startMin >= 60" class="block truncate text-[11px] opacity-70">{{ it.subtitle }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
