<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuizRunner from '@/features/quizzes/components/QuizRunner.vue'
import { useAvailableQuizzes } from '@/features/quizzes/queries'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const query = useAvailableQuizzes()
const quiz = computed(() => query.data.value?.find((q) => q.id === Number(route.params.id)))
</script>

<template>
  <LoadingState v-if="query.isPending.value" />
  <ErrorState v-else-if="query.isError.value" message="Erro ao carregar quizzes." @retry="query.refetch()" />
  <ErrorState v-else-if="!quiz || !quiz.questions?.length" message="Este quiz não está disponível." @retry="router.push('/portal/quiz')" />
  <div v-else class="space-y-4">
    <PageHeader :title="quiz.title" back="/portal/quiz" />
    <QuizRunner :quiz="quiz" @finished="router.push('/portal/quiz')" />
  </div>
</template>
