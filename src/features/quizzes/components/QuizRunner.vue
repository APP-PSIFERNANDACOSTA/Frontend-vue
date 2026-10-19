<script setup lang="ts">
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { useSubmitQuiz } from '../queries'
import type { Quiz } from '../types'
import QuizQuestionInput from './QuizQuestionInput.vue'

const props = defineProps<{ quiz: Quiz }>()
const emit = defineEmits<{ finished: [] }>()

const questions = computed(() => [...(props.quiz.questions ?? [])].sort((a, b) => a.order - b.order))
const index = ref(0)
const answers = reactive<Record<number, string>>({})
const startedAt = Date.now()
const done = ref(false)

const question = computed(() => questions.value[index.value])
const isLast = computed(() => index.value === questions.value.length - 1)
const progress = computed(() => Math.round(((index.value + 1) / questions.value.length) * 100))
const answered = computed(() => (answers[question.value.id] ?? '').trim() !== '')
const canAdvance = computed(() => !question.value.required || answered.value)

const submit = useSubmitQuiz(props.quiz.id, () => (done.value = true))

function next() {
  if (!isLast.value) return void index.value++
  submit.mutate({
    time_spent_seconds: Math.floor((Date.now() - startedAt) / 1000),
    responses: questions.value
      .filter((q) => (answers[q.id] ?? '').trim() !== '')
      .map((q) => ({ question_id: q.id, answer_value: answers[q.id], answer_text: answers[q.id] })),
  })
}
</script>

<template>
  <div v-if="done" class="space-y-6 rounded-2xl border border-brand-200 bg-card p-6 text-center">
    <span class="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-50"><CheckCircle2 class="size-9 text-brand-600" /></span>
    <div>
      <h2 class="text-xl font-semibold">Quiz concluído!</h2>
      <p class="mt-1 text-sm text-muted-foreground">Obrigado por responder. Suas respostas foram salvas e sua psicóloga terá acesso a elas para acompanhar seu progresso.</p>
    </div>
    <Button class="h-11 w-full" @click="emit('finished')">Voltar aos quizzes</Button>
  </div>

  <div v-else-if="question" class="space-y-5">
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium">Pergunta</span>
        <span class="text-muted-foreground">{{ index + 1 }} de {{ questions.length }}</span>
      </div>
      <Progress :model-value="progress" />
    </div>

    <section class="space-y-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
      <h3 class="text-lg font-medium leading-snug">{{ question.question_text }}<span v-if="question.required" class="text-destructive"> *</span></h3>
      <QuizQuestionInput :key="question.id" v-model="answers[question.id]" :question="question" />
    </section>

    <div class="flex gap-3">
      <Button variant="outline" class="h-12 flex-1" :disabled="index === 0 || submit.isPending.value" @click="index--"><ChevronLeft /> Anterior</Button>
      <Button class="h-12 flex-1" :disabled="!canAdvance || submit.isPending.value" @click="next">
        <Loader2 v-if="submit.isPending.value" class="animate-spin" />
        <template v-else>{{ isLast ? 'Finalizar' : 'Próxima' }} <ChevronRight /></template>
      </Button>
    </div>
  </div>
</template>
