<script setup lang="ts">
import { computed } from 'vue'
import type { Session } from '@/features/sessions/types'
import { SESSION_STATUS_LABELS } from '@/features/sessions/types'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import {
  buildSaoPauloCalendarDays, formatBrazilCalendarDayNumber, formatSessionInstantInLocalTimezone, formatSessionInstantInSaoPaulo,
  getBrazilWallDateKey, getSaoPauloTodayNoonDate, isSaoPauloWallMonthEqual,
} from '@/shared/lib/datetime-br'
import { cn } from '@/shared/lib/utils'
import type { GoogleCalendarEvent } from '@/features/settings/google.api'
import { googleEventStyle } from '../googleColors'
import { SESSION_CHIP, SESSION_DOT } from '../chip'

const props = defineProps<{ month: Date; sessions: Session[]; events: GoogleCalendarEvent[]; selectedKey: string | null }>()
const emit = defineEmits<{ selectDay: [day: Date]; openSession: [session: Session]; openEvent: [event: GoogleCalendarEvent] }>()
const privacy = usePrivacyMode()

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const days = computed(() => buildSaoPauloCalendarDays(props.month))
const todayKey = getBrazilWallDateKey(getSaoPauloTodayNoonDate())
const key = (iso: string) => formatSessionInstantInSaoPaulo(iso, 'yyyy-MM-dd')

// Não duplica no calendário eventos do Google que já têm sessão vinculada
const linked = computed(() => new Set(props.sessions.map((s) => s.google_event_id).filter((id): id is string => !!id)))
function groupBy<T>(items: T[], keyOf: (x: T) => string) {
  const m = new Map<string, T[]>()
  for (const it of items) {
    const k = keyOf(it)
    m.set(k, [...(m.get(k) ?? []), it])
  }
  return m
}
const sessionsByDay = computed(() => groupBy([...props.sessions].sort((a, b) => +new Date(a.session_date) - +new Date(b.session_date)), (s) => key(s.session_date)))
const eventsByDay = computed(() => groupBy(props.events.filter((e) => !linked.value.has(e.id)), (e) => key(e.start)))

const time = (iso: string) => formatSessionInstantInLocalTimezone(iso, 'HH:mm')
const label = (s: Session) => (s.patient?.name ? privacy.name(s.patient.name) : 'Sem paciente')
const MAX = 4
</script>

<template>
  <div class="overflow-hidden rounded-xl border bg-border">
    <div class="grid grid-cols-7 gap-px">
      <div v-for="d in WEEK" :key="d" class="bg-muted/60 py-2 text-center text-xs font-semibold text-muted-foreground sm:text-sm">{{ d }}</div>

      <button
        v-for="day in days"
        :key="day.getTime()"
        type="button"
        :aria-label="`Dia ${formatBrazilCalendarDayNumber(day)}`"
        :class="cn(
          'flex min-h-16 flex-col items-stretch bg-card p-1.5 text-left transition-colors hover:bg-muted/50 md:min-h-32 md:p-2 xl:min-h-36',
          !isSaoPauloWallMonthEqual(day, month.getFullYear(), month.getMonth()) && 'bg-muted/30 text-muted-foreground',
          selectedKey === getBrazilWallDateKey(day) && 'relative z-[1] ring-2 ring-inset ring-brand-400',
        )"
        @click="emit('selectDay', new Date(day.getTime()))"
      >
        <span
          :class="cn('mb-1 flex size-6 items-center justify-center self-start rounded-full text-xs font-medium md:text-sm',
            getBrazilWallDateKey(day) === todayKey && 'bg-primary font-bold text-primary-foreground')"
        >{{ formatBrazilCalendarDayNumber(day) }}</span>

        <!-- Desktop: chips -->
        <span class="hidden flex-col gap-1 md:flex">
          <template v-for="(s, i) in sessionsByDay.get(getBrazilWallDateKey(day)) ?? []" :key="s.id">
            <span
              v-if="i < MAX"
              role="button"
              tabindex="0"
              :class="cn('truncate rounded border-l-[3px] px-1.5 py-0.5 text-xs transition-opacity hover:opacity-90', SESSION_CHIP[s.status])"
              :title="`${time(s.session_date)} - ${label(s)} - ${SESSION_STATUS_LABELS[s.status]}`"
              @click.stop="emit('openSession', s)"
              @keydown.enter.stop="emit('openSession', s)"
            ><b>{{ time(s.session_date) }}</b> {{ label(s) }}</span>
          </template>
          <template v-for="e in (eventsByDay.get(getBrazilWallDateKey(day)) ?? []).slice(0, Math.max(0, MAX - (sessionsByDay.get(getBrazilWallDateKey(day))?.length ?? 0)))" :key="e.id">
            <span
              role="button"
              tabindex="0"
              class="truncate rounded border-l-[3px] px-1.5 py-0.5 text-xs hover:opacity-90"
              :style="googleEventStyle(e.colorId)"
              :title="`${time(e.start)} - ${e.summary} (Google)`"
              @click.stop="emit('openEvent', e)"
              @keydown.enter.stop="emit('openEvent', e)"
            ><b>{{ time(e.start) }}</b> {{ e.summary }}</span>
          </template>
          <span v-if="(sessionsByDay.get(getBrazilWallDateKey(day))?.length ?? 0) + (eventsByDay.get(getBrazilWallDateKey(day))?.length ?? 0) > MAX" class="px-1 text-xs font-medium text-muted-foreground">
            +{{ (sessionsByDay.get(getBrazilWallDateKey(day))?.length ?? 0) + (eventsByDay.get(getBrazilWallDateKey(day))?.length ?? 0) - MAX }} mais
          </span>
        </span>

        <!-- Celular: pontinhos -->
        <span class="flex flex-wrap justify-center gap-0.5 md:hidden">
          <span v-for="s in (sessionsByDay.get(getBrazilWallDateKey(day)) ?? []).slice(0, 4)" :key="s.id" :class="cn('size-1.5 rounded-full', SESSION_DOT[s.status])" />
          <span v-for="e in (eventsByDay.get(getBrazilWallDateKey(day)) ?? []).slice(0, 2)" :key="e.id" class="size-1.5 rounded-full" :style="{ backgroundColor: googleEventStyle(e.colorId).backgroundColor }" />
        </span>
      </button>
    </div>
  </div>
</template>
