<script setup lang="ts">
/** Dashboard: bem-estar dos pacientes do portal (respostas de hoje, média da semana e quem precisa de atenção). */
import { AlertTriangle, ChevronRight, HeartPulse } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import QueryState from '@/shared/components/QueryState.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { cn } from '@/shared/lib/utils'
import { useMoodOverview } from '../queries'
import { emotionInfo, emotionLabel, moodFromAverage, moodLabel, moodUi } from '../ui'

const privacy = usePrivacyMode()
const query = useMoodOverview()
const o = computed(() => query.data.value)
const avgMood = computed(() => (o.value?.week_average != null ? moodFromAverage(o.value.week_average) : null))
const answeredPct = computed(() => (o.value?.portal_patients ? Math.round((o.value.answered_today / o.value.portal_patients) * 100) : 0))
const weekEmotions = computed(() => Object.entries(o.value?.week_emotions ?? {}).slice(0, 6))
const shortDate = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7)
</script>

<template>
  <section class="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
    <h3 class="mb-4 flex items-center gap-2 font-semibold"><HeartPulse class="size-5 text-brand-600" /> Bem-estar dos pacientes</h3>
    <QueryState :query="query" loading-label="Carregando humor...">
      <div v-if="o" class="grid gap-4 lg:grid-cols-3">
        <div class="space-y-3">
          <div class="rounded-xl bg-muted/50 p-3">
            <p class="text-xs text-muted-foreground">Responderam hoje</p>
            <p class="text-2xl font-bold tabular-nums">{{ o.answered_today }} <span class="text-sm font-normal text-muted-foreground">de {{ o.portal_patients }} com portal</span></p>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-brand-100"><div class="h-full rounded-full bg-brand-500 transition-all" :style="{ width: `${answeredPct}%` }" /></div>
          </div>
          <div class="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <component :is="avgMood ? moodUi(avgMood).icon : HeartPulse" :class="cn('size-8 shrink-0', avgMood ? moodUi(avgMood).text : 'text-muted-foreground')" />
            <div><p class="text-xs text-muted-foreground">Humor médio da semana</p><p class="font-semibold">{{ avgMood ? `${moodLabel(avgMood)} (${o.week_average}/5)` : 'Sem registros' }}</p><p class="text-xs text-muted-foreground">{{ o.week_respondents }} paciente(s) responderam</p></div>
          </div>
        </div>

        <div v-if="weekEmotions.length" class="lg:col-span-3 -mt-1 order-last">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emoções da semana (todos os pacientes)</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="[k, c] in weekEmotions" :key="k" :class="cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm', emotionInfo(k)?.hard ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')"><component :is="emotionInfo(k)?.icon" class="size-3.5" />{{ emotionLabel(k) }} <strong class="tabular-nums">{{ c }}</strong></span>
          </div>
        </div>

        <div class="lg:col-span-2">
          <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><AlertTriangle class="size-3.5" /> Precisam de atenção</p>
          <p v-if="!o.alerts.length" class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum alerta de humor nos últimos dias.</p>
          <ul v-else class="divide-y rounded-xl border">
            <li v-for="a in o.alerts" :key="a.patient_id">
              <RouterLink :to="`/dashboard/patients/${a.patient_id}`" class="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40">
                <component :is="moodUi(a.last_mood).icon" :class="cn('size-6 shrink-0', moodUi(a.last_mood).text)" />
                <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ privacy.name(a.name) }}</span><span class="block truncate text-xs text-muted-foreground">{{ a.reason }} · último registro {{ shortDate(a.last_date) }}</span></span>
                <span :class="cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', a.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')">{{ a.severity === 'high' ? 'Alta' : 'Média' }}</span>
                <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </QueryState>
  </section>
</template>
