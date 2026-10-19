<script setup lang="ts">
import { HeartPulse, Minus, TrendingDown, TrendingUp } from '@lucide/vue'
import { format, parseISO, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed, ref } from 'vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { getBrazilWallDateKey, getSaoPauloTodayNoonDate } from '@/shared/lib/datetime-br'
import { cn } from '@/shared/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { usePatientMood } from '../queries'
import { emotionInfo, emotionLabel, MOOD_BAR, MOOD_SCORE, MOODS, moodFromAverage, moodLabel, moodUi } from '../ui'

const props = defineProps<{ patientId: number }>()
const privacy = usePrivacyMode()
const PERIODS = [{ v: '30', l: 'Últimos 30 dias' }, { v: '90', l: 'Últimos 90 dias' }, { v: '180', l: 'Últimos 6 meses' }]
const period = ref('30')
const days = computed(() => Number(period.value))
const query = usePatientMood(() => props.patientId, days)
const data = computed(() => query.data.value)
const summary = computed(() => data.value?.summary)

// um ponto por dia do período (dias sem registro ficam vazios no gráfico)
const series = computed(() => {
  const byDate = new Map((data.value?.checkins ?? []).map((c) => [c.date.slice(0, 10), c]))
  return Array.from({ length: days.value }, (_, i) => {
    const d = subDays(getSaoPauloTodayNoonDate(), days.value - 1 - i) // mesmo "hoje" do backend (Brasília)
    const key = getBrazilWallDateKey(d)
    return { key, date: d, checkin: byDate.get(key) ?? null }
  })
})
const avgMood = computed(() => (summary.value?.average != null ? moodFromAverage(summary.value.average) : null))
const trend = computed(() => summary.value?.trend ?? null)
const coverage = computed(() => (summary.value ? Math.round((summary.value.count / days.value) * 100) : 0))
const notes = computed(() => (data.value?.checkins ?? []).filter((c) => c.note).slice(-5).reverse())
// emoções: top 6 do período (em % dos dias com registro) e top 3 dos dias difíceis
const topEmotions = computed(() => {
  const counts = summary.value?.emotion_counts ?? {}
  const n = summary.value?.count || 1
  return Object.entries(counts).slice(0, 6).map(([k, c]) => ({ key: k, count: c as number, pct: Math.round(((c as number) / n) * 100) }))
})
const lowEmotions = computed(() => Object.entries(summary.value?.emotion_low_days ?? {}).slice(0, 3).map(([k, c]) => ({ key: k, count: c as number })))
const tip = (c: { mood: string; emotions?: string[] | null; note: string | null }) =>
  [moodLabel(c.mood), c.emotions?.length ? c.emotions.map(emotionLabel).join(', ') : '', c.note && !privacy.enabled.value ? c.note : ''].filter(Boolean).join(' — ')
const dayLabel = (d: Date) => format(d, "EEE, dd/MM", { locale: ptBR })
</script>

<template>
  <section class="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
    <header class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 class="flex items-center gap-2 font-semibold"><HeartPulse class="size-5 text-brand-600" /> Como tem se sentido</h3>
      <Select v-model="period">
        <SelectTrigger class="h-8 w-44 text-xs" aria-label="Período"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem v-for="p in PERIODS" :key="p.v" :value="p.v">{{ p.l }}</SelectItem></SelectContent>
      </Select>
    </header>

    <QueryState :query="query" :empty="!summary || summary.count === 0" loading-label="Carregando humor...">
      <template #empty><EmptyState :icon="HeartPulse" title="Ainda sem registros" description="Quando o paciente responder “Como você está hoje?” no portal, o humor aparece aqui." /></template>

      <div v-if="summary" class="space-y-5">
        <!-- resumo -->
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <component :is="moodUi(avgMood!).icon" :class="cn('size-8 shrink-0', moodUi(avgMood!).text)" />
            <div><p class="text-xs text-muted-foreground">Humor médio</p><p class="font-semibold">{{ moodLabel(avgMood!) }} <span class="text-xs font-normal text-muted-foreground">({{ summary.average }}/5)</span></p></div>
          </div>
          <div class="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <TrendingUp v-if="trend !== null && trend >= 0.3" class="size-8 shrink-0 text-success" />
            <TrendingDown v-else-if="trend !== null && trend <= -0.3" class="size-8 shrink-0 text-destructive" />
            <Minus v-else class="size-8 shrink-0 text-muted-foreground" />
            <div><p class="text-xs text-muted-foreground">Tendência</p><p class="font-semibold">{{ trend === null ? 'Poucos dados' : trend >= 0.3 ? 'Melhorando' : trend <= -0.3 ? 'Piorando' : 'Estável' }}</p></div>
          </div>
          <div class="rounded-xl bg-muted/50 p-3">
            <p class="text-xs text-muted-foreground">Dias com registro</p>
            <p class="font-semibold">{{ summary.count }} de {{ days }} <span class="text-xs font-normal text-muted-foreground">({{ coverage }}%)</span></p>
          </div>
        </div>

        <!-- gráfico: uma barra por dia, altura = humor -->
        <div>
          <div class="flex h-28 items-end gap-px" role="img" :aria-label="`Humor diário nos últimos ${days} dias`">
            <div v-for="p in series" :key="p.key" class="flex h-full min-w-0 flex-1 items-end" :title="p.checkin ? `${dayLabel(p.date)}: ${tip(p.checkin)}` : `${dayLabel(p.date)}: sem registro`">
              <div v-if="p.checkin" :class="cn('w-full rounded-t-sm', MOOD_BAR[p.checkin.mood])" :style="{ height: `${MOOD_SCORE[p.checkin.mood] * 20}%` }" />
              <div v-else class="h-1 w-full rounded-sm bg-muted" />
            </div>
          </div>
          <div class="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{{ dayLabel(series[0].date) }}</span><span>Hoje</span></div>
        </div>

        <!-- distribuição -->
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <span v-for="m in MOODS" :key="m" class="inline-flex items-center gap-1.5 text-sm">
            <span :class="cn('size-2.5 rounded-full', MOOD_BAR[m])" /> {{ moodLabel(m) }} <strong class="tabular-nums">{{ summary.counts[m] ?? 0 }}</strong>
          </span>
        </div>

        <!-- emoções -->
        <div v-if="topEmotions.length" class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emoções mais frequentes</p>
            <ul class="space-y-1.5">
              <li v-for="e in topEmotions" :key="e.key" class="flex items-center gap-2 text-sm">
                <component :is="emotionInfo(e.key)?.icon" class="size-4 shrink-0 text-brand-600" />
                <span class="w-24 shrink-0 truncate">{{ emotionLabel(e.key) }}</span>
                <span class="h-2 flex-1 overflow-hidden rounded-full bg-brand-100"><span class="block h-full rounded-full bg-brand-500" :style="{ width: `${e.pct}%` }" /></span>
                <span class="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{{ e.count }} dia{{ e.count === 1 ? '' : 's' }} · {{ e.pct }}%</span>
              </li>
            </ul>
          </div>
          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nos dias difíceis ({{ summary.low_days }})</p>
            <p v-if="!lowEmotions.length" class="text-sm text-muted-foreground">{{ summary.low_days ? 'Sem emoções marcadas nesses dias.' : 'Nenhum dia triste ou pior no período.' }}</p>
            <div v-else class="flex flex-wrap gap-2">
              <span v-for="e in lowEmotions" :key="e.key" class="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm text-destructive"><component :is="emotionInfo(e.key)?.icon" class="size-3.5" />{{ emotionLabel(e.key) }} <strong class="tabular-nums">{{ e.count }}</strong></span>
            </div>
            <p v-if="lowEmotions.length" class="text-xs text-muted-foreground">O que mais aparece quando o humor cai (triste ou muito triste).</p>
          </div>
        </div>

        <!-- comentários recentes -->
        <div v-if="notes.length" class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comentários recentes</p>
          <ul class="space-y-1.5">
            <li v-for="c in notes" :key="c.date" class="flex items-start gap-2 text-sm">
              <component :is="moodUi(c.mood).icon" :class="cn('mt-0.5 size-4 shrink-0', moodUi(c.mood).text)" />
              <span class="w-12 shrink-0 tabular-nums text-muted-foreground">{{ format(parseISO(c.date.slice(0, 10)), 'dd/MM') }}</span>
              <span class="min-w-0">{{ privacy.text(c.note, 12) }}<span v-if="c.emotions?.length" class="ml-1.5 text-xs text-muted-foreground">· {{ c.emotions.map(emotionLabel).join(', ') }}</span></span>
            </li>
          </ul>
        </div>
      </div>
    </QueryState>
  </section>
</template>
