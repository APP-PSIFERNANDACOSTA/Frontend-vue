<script setup lang="ts">
import { Clock, Dumbbell } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { exerciseIcon } from '@/features/exercises/components/ExerciseIcon'
import { useMyExercises } from '@/features/exercises/queries'
import type { Exercise } from '@/features/exercises/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import InfoRow from '@/shared/components/InfoRow.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { Button } from '@/shared/ui/button'

const query = useMyExercises()
const exercises = computed(() => query.data.value ?? [])
const summary = (d: string | null) => {
  const first = (d ?? '').split(/\r?\n/)[0].trim()
  return first.length <= 120 ? first : `${first.slice(0, 117)}...`
}
const meta = (e: Exercise) =>
  e.type === 'counter' ? (e.target_reps ? `${e.target_reps} repetições` : 'Contador') : e.duration_seconds ? `${Math.max(1, Math.round(e.duration_seconds / 60))} min` : 'Guiado'
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">Práticas recomendadas pela sua psicóloga, como respiração, mindfulness e relaxamento.</p>
    <QueryState :query="query" :empty="exercises.length === 0">
      <template #empty><EmptyState :icon="Dumbbell" title="Nenhum exercício disponível" description="Sua psicóloga ainda não liberou exercícios para você." /></template>
      <article v-for="e in exercises" :key="e.id" class="space-y-3 rounded-2xl border bg-card p-4 shadow-xs">
        <div class="flex items-start gap-3">
          <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50"><component :is="exerciseIcon(e.category)" class="size-6 text-brand-600" /></span>
          <div class="min-w-0">
            <h3 class="font-semibold leading-snug">{{ e.title }}</h3>
            <p v-if="e.description" class="mt-1 text-sm text-muted-foreground">{{ summary(e.description) }}</p>
          </div>
        </div>
        <InfoRow :icon="Clock" :text="meta(e)" />
        <Button class="h-11 w-full" as-child><RouterLink :to="`/portal/exercises/${e.id}`">Começar</RouterLink></Button>
      </article>
    </QueryState>
  </div>
</template>
