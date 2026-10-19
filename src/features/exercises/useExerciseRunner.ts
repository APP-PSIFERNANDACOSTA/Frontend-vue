import { useIntervalFn } from '@vueuse/core'
import { computed, ref, type Ref } from 'vue'
import type { Exercise } from './types'

/**
 * Máquina de estados de um exercício: cronômetro (`timer`), contador (`counter`) ou passos guiados (`guided`).
 * Um único relógio de 1s — no app antigo dois timers somavam e o tempo guiado contava em dobro.
 */
export function useExerciseRunner(exercise: Ref<Exercise>) {
  const playing = ref(false)
  const elapsed = ref(0)
  const reps = ref(0)
  const stepIndex = ref(0)
  const stepRemaining = ref(0)
  const finished = ref(false)

  const steps = computed(() => exercise.value.steps ?? [])
  const isGuided = computed(() => exercise.value.type === 'guided' && steps.value.length > 0)
  const currentStep = computed(() => steps.value[stepIndex.value])

  const resetStep = () => (stepRemaining.value = isGuided.value ? (steps.value[0]?.duration_seconds ?? 0) : 0)
  resetStep()

  const { pause, resume } = useIntervalFn(
    () => {
      elapsed.value++
      if (!isGuided.value) return
      if (stepRemaining.value > 1) return void stepRemaining.value--
      if (stepIndex.value < steps.value.length - 1) {
        stepIndex.value++
        stepRemaining.value = steps.value[stepIndex.value].duration_seconds
      } else {
        stepRemaining.value = 0
        finished.value = true
        playing.value = false
        pause()
      }
    },
    1000,
    { immediate: false },
  )

  function toggle() {
    if (finished.value) reset()
    playing.value = !playing.value
    playing.value ? resume() : pause()
  }
  function reset() {
    pause()
    playing.value = false
    finished.value = false
    elapsed.value = 0
    reps.value = 0
    stepIndex.value = 0
    resetStep()
  }
  const addRep = () => reps.value++

  /** 0–100: guiado = passos concluídos; timer = tempo recomendado; contador = repetições-alvo. */
  const progress = computed(() => {
    const ex = exercise.value
    if (isGuided.value) return Math.round(((stepIndex.value + (finished.value ? 1 : 0)) / steps.value.length) * 100)
    if (ex.type === 'timer' && ex.duration_seconds) return Math.min(100, Math.round((elapsed.value / ex.duration_seconds) * 100))
    if (ex.type === 'counter' && ex.target_reps) return Math.min(100, Math.round((reps.value / ex.target_reps) * 100))
    return 0
  })

  return { playing, elapsed, reps, stepIndex, stepRemaining, finished, isGuided, currentStep, steps, progress, toggle, reset, addRep, stop: pause }
}
