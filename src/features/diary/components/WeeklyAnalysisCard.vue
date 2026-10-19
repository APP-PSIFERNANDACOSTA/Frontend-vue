<script setup lang="ts">
import { BarChart3, Brain, Calendar, ChevronDown, Loader2, Sparkles, TrendingUp } from '@lucide/vue'
import { ref } from 'vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { useWeeklyAnalysis } from '../queries'
import type { WeeklyAnalysisResponse } from '../types'
import MoodBadge from './MoodBadge.vue'

const props = defineProps<{ patientId: number; patientName: string }>()
const privacy = usePrivacyMode()
const open = ref(false)
const result = ref<WeeklyAnalysisResponse | null>(null)
const days = ref<number | null>(null)

const PERIODS = [
  { days: 7, label: '7 dias', icon: Calendar },
  { days: 15, label: '15 dias', icon: TrendingUp },
  { days: 30, label: '30 dias', icon: BarChart3 },
]
const analyze = useWeeklyAnalysis(() => props.patientId, (r) => {
  result.value = r
  open.value = true
})
const run = (d: number) => ((days.value = d), analyze.mutate(d))
</script>

<template>
  <Card class="border-brand-200 bg-gradient-to-br from-brand-50 to-card">
    <Collapsible v-model:open="open">
      <CollapsibleTrigger as-child>
        <CardHeader class="cursor-pointer">
          <div class="flex items-center justify-between gap-2">
            <CardTitle class="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              <Brain class="size-5 text-brand-600" /> Análise inteligente dos diários
              <Badge v-if="result" variant="outline" class="text-xs">Concluída</Badge>
            </CardTitle>
            <div class="flex items-center gap-2">
              <span v-if="result?.period" class="hidden rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline">{{ result.period.entries_count }} entradas analisadas</span>
              <ChevronDown class="size-4 text-muted-foreground transition-transform" :class="open && 'rotate-180'" />
            </div>
          </div>
          <p class="text-sm text-muted-foreground">
            {{ result ? `Clique para ${open ? 'ocultar' : 'ver'} o resumo detalhado` : `Análise dos diários de ${privacy.name(patientName)} usando IA` }}
          </p>
        </CardHeader>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <CardContent class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <Button v-for="p in PERIODS" :key="p.days" variant="outline" :class="days === p.days && 'border-brand-400 bg-brand-50'" :disabled="analyze.isPending.value" @click="run(p.days)">
              <component :is="p.icon" /> {{ p.label }}
            </Button>
          </div>

          <div v-if="analyze.isPending.value" class="py-8 text-center text-sm text-muted-foreground">
            <Loader2 class="mx-auto mb-2 size-8 animate-spin text-brand" />
            Analisando diários dos últimos {{ days }} dias…
            <p class="mt-1 text-xs">A IA está processando as informações emocionais</p>
          </div>

          <div v-else-if="result" class="space-y-4">
            <div class="rounded-xl border-2 border-brand-200 bg-card p-4 sm:p-5">
              <h4 class="mb-3 flex items-center gap-2 font-semibold">
                <Brain class="size-5 text-brand-600" /> Análise detalhada
                <Badge variant="outline" class="text-xs"><Sparkles v-if="result.analysis.ai_generated" class="size-3" /><BarChart3 v-else class="size-3" />{{ result.analysis.ai_generated ? 'IA' : 'Automática' }}</Badge>
              </h4>
              <p class="whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">{{ result.analysis.summary || 'Resumo não disponível' }}</p>
            </div>

            <div v-if="Object.keys(result.analysis.mood_distribution ?? {}).length" class="rounded-xl border bg-card p-4">
              <h4 class="mb-3 font-semibold">Distribuição de humor</h4>
              <div class="flex flex-wrap items-center gap-2">
                <span v-for="(count, mood) in result.analysis.mood_distribution" :key="mood" class="inline-flex items-center gap-1.5">
                  <MoodBadge :mood="mood" /> <span class="text-sm font-semibold">{{ count }}</span>
                </span>
              </div>
            </div>

            <div v-if="result.analysis.common_themes?.length" class="rounded-xl border bg-card p-4">
              <h4 class="mb-3 font-semibold">Temas recorrentes</h4>
              <div class="flex flex-wrap gap-2"><Badge v-for="t in result.analysis.common_themes" :key="t" variant="outline">{{ t }}</Badge></div>
            </div>

            <p v-if="result.period" class="rounded-lg bg-muted/50 p-2 text-center text-xs text-muted-foreground">
              <strong>Período analisado:</strong> {{ formatDate(result.period.start_date) }} até {{ formatDate(result.period.end_date) }}
            </p>
          </div>

          <div v-else class="py-6 text-center">
            <Brain class="mx-auto mb-3 size-12 text-brand-300" />
            <p class="text-sm text-muted-foreground">Clique em um período para analisar os diários</p>
            <p class="text-xs text-muted-foreground">A IA irá identificar padrões emocionais e temas recorrentes</p>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  </Card>
</template>
