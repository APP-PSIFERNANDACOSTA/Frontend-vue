<script setup lang="ts">
/** Humor dos últimos 7 dias de um paciente em uma linha (usado no cartão da próxima sessão). */
import { subDays } from 'date-fns'
import { computed } from 'vue'
import { getBrazilWallDateKey, getSaoPauloTodayNoonDate } from '@/shared/lib/datetime-br'
import { cn } from '@/shared/lib/utils'
import { usePatientMood } from '../queries'
import { emotionLabel, MOOD_BAR, moodFromAverage, moodLabel } from '../ui'

const props = defineProps<{ patientId: number }>()
const query = usePatientMood(() => props.patientId, 7)
const days = computed(() => {
  const by = new Map((query.data.value?.checkins ?? []).map((c) => [c.date.slice(0, 10), c.mood]))
  return Array.from({ length: 7 }, (_, i) => {
    const key = getBrazilWallDateKey(subDays(getSaoPauloTodayNoonDate(), 6 - i))
    return { key, mood: by.get(key) ?? null }
  })
})
const avg = computed(() => query.data.value?.summary.average ?? null)
// emoção mais marcada na semana (ex.: "Ansiedade 4d")
const topEmotion = computed(() => Object.entries(query.data.value?.summary.emotion_counts ?? {})[0] ?? null)
</script>

<template>
  <div v-if="query.data.value?.summary.count" class="flex items-center gap-2 text-xs text-muted-foreground">
    <span>Humor na semana:</span>
    <span class="flex gap-1" aria-hidden="true">
      <span v-for="d in days" :key="d.key" :class="cn('size-2.5 rounded-full', d.mood ? MOOD_BAR[d.mood] : 'bg-muted')" :title="d.mood ? moodLabel(d.mood) : 'sem registro'" />
    </span>
    <span v-if="avg !== null" class="font-medium text-foreground">{{ moodLabel(moodFromAverage(avg)) }}</span>
    <span v-if="topEmotion" class="text-muted-foreground">· {{ emotionLabel(topEmotion[0]) }} {{ topEmotion[1] }}d</span>
  </div>
</template>
