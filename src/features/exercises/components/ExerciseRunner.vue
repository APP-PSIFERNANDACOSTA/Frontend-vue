<script setup lang="ts">
import { CheckCircle2, Loader2, Pause, Play, RotateCcw, Target } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { cn } from '@/shared/lib/utils'
import { useCompleteExercise, useStartExercise } from '../queries'
import type { Exercise } from '../types'
import { exerciseIcon } from './ExerciseIcon'
import { useExerciseRunner } from '../useExerciseRunner'

const props = defineProps<{ exercise: Exercise }>()
const emit = defineEmits<{ done: [] }>()

const r = useExerciseRunner(toRef(props, 'exercise'))
const Icon = computed(() => exerciseIcon(props.exercise.category))
const sessionId = ref<number>()

const start = useStartExercise()
const complete = useCompleteExercise(() => emit('done'))
onMounted(() => start.mutate(props.exercise.id, { onSuccess: (s) => (sessionId.value = s.id) }))
onBeforeUnmount(() => r.stop())

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const howTo = computed(() =>
  (props.exercise.description ?? '').split(/\r?\n|\. /).map((s) => s.trim()).filter(Boolean),
)
const finish = () =>
  complete.mutate({
    id: props.exercise.id,
    sessionId: sessionId.value,
    durationSeconds: props.exercise.type === 'timer' ? r.elapsed.value : undefined,
    reps: props.exercise.type === 'counter' ? r.reps.value : undefined,
  })
</script>

<template>
  <div class="space-y-5">
    <section class="space-y-5 rounded-2xl border border-brand-200 bg-card p-5 shadow-xs">
      <div class="flex justify-center">
        <div class="flex size-60 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 p-6 text-center">
          <div>
            <component :is="Icon" class="mx-auto size-12 text-brand-600" />
            <template v-if="r.isGuided.value">
              <p class="mt-3 text-xs text-muted-foreground">Passo {{ r.stepIndex.value + 1 }} de {{ r.steps.value.length }}</p>
              <p class="text-4xl font-bold text-brand-700 dark:text-brand">{{ r.stepRemaining.value }}</p>
              <p class="text-xs text-muted-foreground">segundos restantes</p>
              <p v-if="r.currentStep.value" class="mx-auto mt-2 max-w-[170px] text-sm font-medium leading-snug">{{ r.currentStep.value.description }}</p>
            </template>
            <template v-else-if="exercise.type === 'timer'">
              <p class="mt-3 text-xs text-muted-foreground">Tempo decorrido</p>
              <p class="text-4xl font-bold tabular-nums text-brand-700 dark:text-brand">{{ mmss(r.elapsed.value) }}</p>
              <p v-if="exercise.duration_seconds" class="text-xs text-muted-foreground">Recomendado: {{ Math.floor(exercise.duration_seconds / 60) }} min</p>
            </template>
            <template v-else>
              <p class="mt-3 text-xs text-muted-foreground">Repetições</p>
              <p class="text-4xl font-bold text-brand-700 dark:text-brand">{{ r.reps.value }}</p>
              <p v-if="exercise.target_reps" class="text-xs text-muted-foreground">Recomendado: {{ exercise.target_reps }}</p>
            </template>
          </div>
        </div>
      </div>

      <div v-if="r.progress.value || r.isGuided.value" class="space-y-1.5">
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Progresso</span><span class="font-medium">{{ r.progress.value }}%</span></div>
        <Progress :model-value="r.progress.value" />
      </div>

      <ol v-if="r.isGuided.value" class="space-y-1.5 text-sm">
        <li
          v-for="(s, i) in r.steps.value"
          :key="i"
          :class="cn('rounded-lg px-3 py-2', i === r.stepIndex.value ? 'border border-brand-300 bg-brand-50 font-medium' : i < r.stepIndex.value ? 'text-muted-foreground line-through' : 'bg-muted/40')"
        >
          {{ i + 1 }}. {{ s.description }} ({{ s.duration_seconds }}s)
        </li>
      </ol>

      <div class="grid grid-cols-2 gap-3">
        <Button size="lg" class="col-span-2 h-14 text-base" @click="r.toggle()">
          <Pause v-if="r.playing.value" /><Play v-else /> {{ r.playing.value ? 'Pausar' : r.finished.value ? 'Refazer' : 'Iniciar' }}
        </Button>
        <Button v-if="exercise.type === 'counter'" variant="outline" size="lg" class="h-12" @click="r.addRep()"><Target /> + 1 repetição</Button>
        <Button variant="outline" size="lg" :class="['h-12', exercise.type !== 'counter' && 'col-span-2']" @click="r.reset()"><RotateCcw /> Reiniciar</Button>
      </div>
    </section>

    <section v-if="howTo.length" class="space-y-2 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
      <p class="text-sm font-medium">Como fazer:</p>
      <ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li v-for="(s, i) in howTo" :key="i">{{ s }}</li></ul>
    </section>

    <Button variant="secondary" size="lg" class="h-12 w-full" :disabled="complete.isPending.value" @click="finish">
      <Loader2 v-if="complete.isPending.value" class="animate-spin" /><CheckCircle2 v-else /> Concluir exercício
    </Button>
  </div>
</template>
