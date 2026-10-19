<script setup lang="ts">
import { Brain, CheckCircle2, Clock, Info } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAvailableQuizzes } from '@/features/quizzes/queries'
import type { Quiz } from '@/features/quizzes/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import InfoRow from '@/shared/components/InfoRow.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'

const query = useAvailableQuizzes()
const quizzes = computed(() => query.data.value ?? [])
const pending = computed(() => quizzes.value.filter((q) => !q.is_completed))
const completed = computed(() => quizzes.value.filter((q) => q.is_completed))
const doneLabel = (q: Quiz) => (q.latest_attempt?.completed_at ? `Concluído em ${formatDate(q.latest_attempt.completed_at)}` : 'Concluído')
</script>

<template>
  <div class="space-y-5">
    <p class="text-sm text-muted-foreground">Complete os questionários para acompanhar seu progresso terapêutico</p>

    <QueryState :query="query" :empty="quizzes.length === 0">
      <template #empty><EmptyState :icon="Brain" title="Nenhum quiz disponível" description="Não há questionários disponíveis no momento." /></template>

      <section v-if="pending.length" class="space-y-3">
        <h2 class="font-semibold">Pendentes</h2>
        <article v-for="q in pending" :key="q.id" class="space-y-3 rounded-2xl border border-brand-200 bg-card p-4 shadow-xs">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold leading-snug">{{ q.title }}</h3>
              <p v-if="q.description" class="mt-1 text-sm text-muted-foreground">{{ q.description }}</p>
            </div>
            <StatusBadge tone="brand" label="Novo" />
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1">
            <InfoRow :icon="Clock" :text="`${q.duration_minutes} min`" />
            <InfoRow :icon="Brain" :text="`${q.questions?.length ?? 0} questões`" />
          </div>
          <Button class="h-11 w-full" as-child><RouterLink :to="`/portal/quiz/${q.id}`">Iniciar</RouterLink></Button>
        </article>
      </section>

      <section v-if="completed.length" class="space-y-3">
        <h2 class="font-semibold">Concluídos</h2>
        <article v-for="q in completed" :key="q.id" class="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-xs">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10"><CheckCircle2 class="size-5 text-success" /></span>
          <div class="min-w-0">
            <h3 class="font-medium leading-snug">{{ q.title }}</h3>
            <p class="text-sm text-muted-foreground">{{ doneLabel(q) }}</p>
          </div>
        </article>
      </section>
    </QueryState>

    <SectionCard title="Sobre os quizzes" :icon="Info" class="border-brand-200 bg-brand-50">
      <p class="text-sm text-muted-foreground">Estes questionários ajudam você e sua psicóloga a acompanhar seu progresso. Responda com honestidade e regularidade para melhores resultados.</p>
    </SectionCard>
  </div>
</template>
