<script setup lang="ts">
/** Portal: "Seu humor" — últimas 5 semanas em calendário e registro rápido do dia. */
import { HeartPulse } from '@lucide/vue'
import { addDays, format, parseISO, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed } from 'vue'
import type { MoodType } from '@/features/diary/types'
import { getBrazilWallDateKey, getSaoPauloTodayNoonDate } from '@/shared/lib/datetime-br'
import { notify } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { useMyMood, useSaveMood, useTodayMood } from '../queries'
import { emotionLabel, MOOD_BAR, MOOD_SCORE, MOODS, moodFromAverage, moodLabel, moodUi } from '../ui'

const WEEKS = 5
const today = useTodayMood()
const query = useMyMood(WEEKS * 7 + 7)
const save = useSaveMood(() => notify.success('Registro salvo', 'Obrigada por compartilhar.'))

const todayKey = computed(() => getBrazilWallDateKey(getSaoPauloTodayNoonDate()))
const byDate = computed(() => new Map((query.data.value?.checkins ?? []).map((c) => [c.date.slice(0, 10), c])))
// grade de semanas (domingo a sábado) terminando na semana atual
const grid = computed(() => {
  const end = getSaoPauloTodayNoonDate()
  const start = subDays(end, end.getDay() + (WEEKS - 1) * 7)
  return Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = addDays(start, i)
    const key = getBrazilWallDateKey(d)
    return { key, day: Number(key.slice(8, 10)), future: key > todayKey.value, checkin: byDate.value.get(key) ?? null }
  })
})
const month = computed(() => {
  const list = [...byDate.value.values()].filter((c) => c.date.slice(0, 7) === todayKey.value.slice(0, 7))
  if (!list.length) return null
  const avg = list.reduce((a, c) => a + MOOD_SCORE[c.mood], 0) / list.length
  const good = list.filter((c) => MOOD_SCORE[c.mood] >= 4).length
  return { count: list.length, mood: moodFromAverage(avg), good }
})
const answered = computed(() => !!today.data.value?.checkin)
const pick = (m: MoodType) => save.mutate({ mood: m })
const label = (key: string) => format(parseISO(key), "d 'de' MMMM", { locale: ptBR })
</script>

<template>
  <section class="space-y-4 rounded-2xl border bg-card p-4 shadow-xs">
    <header class="flex items-center gap-3">
      <span class="flex size-9 items-center justify-center rounded-xl bg-brand-50"><HeartPulse class="size-5 text-brand-600" /></span>
      <div class="min-w-0"><h2 class="font-semibold">Seu humor</h2><p class="text-xs text-muted-foreground">{{ month ? `Este mês: ${month.good} de ${month.count} dias bons ou ótimos` : 'Registre como você está todos os dias' }}</p></div>
    </header>

    <!-- registro rápido do dia (se ainda não respondeu) -->
    <div v-if="today.data.value && !answered" class="space-y-2 rounded-xl bg-brand-50 p-3">
      <p class="text-sm font-medium">Como você está hoje?</p>
      <div class="grid grid-cols-5 gap-1.5">
        <button v-for="m in MOODS" :key="m" type="button" :disabled="save.isPending.value" class="flex flex-col items-center gap-1 rounded-xl bg-background py-2 transition-transform active:scale-95" :aria-label="moodLabel(m)" @click="pick(m)">
          <component :is="moodUi(m).icon" :class="cn('size-6', moodUi(m).text)" />
          <span class="text-[10px] leading-tight">{{ moodLabel(m) }}</span>
        </button>
      </div>
    </div>

    <!-- calendário -->
    <div>
      <div class="mb-1 grid grid-cols-7 text-center text-[10px] font-medium uppercase text-muted-foreground"><span v-for="(d, i) in ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']" :key="i">{{ d }}</span></div>
      <div class="grid grid-cols-7 gap-1.5">
        <div v-for="c in grid" :key="c.key" :class="cn('flex aspect-square items-center justify-center rounded-lg text-xs tabular-nums', c.future ? 'opacity-0' : c.checkin ? cn(MOOD_BAR[c.checkin.mood], 'font-semibold text-white') : 'bg-muted text-muted-foreground', c.key === todayKey && 'ring-2 ring-brand-500 ring-offset-1 ring-offset-card')" :title="c.checkin ? `${label(c.key)}: ${moodLabel(c.checkin.mood)}${c.checkin.emotions?.length ? ` (${c.checkin.emotions.map(emotionLabel).join(', ')})` : ''}` : label(c.key)">{{ c.future ? '' : c.day }}</div>
      </div>
    </div>

    <div class="flex flex-wrap gap-x-3 gap-y-1">
      <span v-for="m in MOODS" :key="m" class="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><span :class="cn('size-2 rounded-full', MOOD_BAR[m])" />{{ moodLabel(m) }}</span>
    </div>
  </section>
</template>
