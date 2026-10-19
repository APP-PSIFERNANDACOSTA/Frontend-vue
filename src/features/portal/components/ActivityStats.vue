<script setup lang="ts">
import { BookOpen, Brain, Heart, TrendingUp } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import diaryService from '@/features/diary/api'
import exerciseService from '@/features/exercises/api'
import quizService from '@/features/quizzes/api'
import SectionCard from '@/shared/components/SectionCard.vue'

// Contagens independentes: uma falha não derruba as outras (como no app antigo)
const diaries = useQuery({
  queryKey: ['diary', 'mine', 'count'],
  queryFn: async () => (await diaryService.getMyEntries()).entries?.data?.length ?? 0,
})
const exercises = useQuery({ queryKey: ['exercises', 'mine', 'count'], queryFn: async () => (await exerciseService.getMyExercises()).length })
const quizzes = useQuery({ queryKey: ['quizzes', 'history', 'count'], queryFn: async () => (await quizService.getPatientHistory()).data?.length ?? 0 })

const stats = [
  { label: 'Diários', icon: Heart, q: diaries },
  { label: 'Exercícios', icon: BookOpen, q: exercises },
  { label: 'Quizzes', icon: Brain, q: quizzes },
]
</script>

<template>
  <SectionCard title="Suas atividades" description="Resumo do seu engajamento" :icon="TrendingUp">
    <div class="grid grid-cols-3 gap-2">
      <div v-for="s in stats" :key="s.label" class="flex flex-col items-center gap-1 rounded-xl border p-3 text-center">
        <component :is="s.icon" class="size-5 text-brand-600" />
        <span v-if="s.q.isPending.value" class="h-7 w-8 animate-pulse rounded bg-muted" />
        <span v-else class="text-2xl font-bold">{{ s.q.data.value ?? 0 }}</span>
        <span class="text-xs text-muted-foreground">{{ s.label }}</span>
      </div>
    </div>
  </SectionCard>
</template>
