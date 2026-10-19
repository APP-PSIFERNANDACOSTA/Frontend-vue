<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExerciseRunner from '@/features/exercises/components/ExerciseRunner.vue'
import { useMyExercises } from '@/features/exercises/queries'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const query = useMyExercises()
const exercise = computed(() => query.data.value?.find((e) => e.id === Number(route.params.id)))
</script>

<template>
  <LoadingState v-if="query.isPending.value" />
  <ErrorState v-else-if="query.isError.value || !exercise" message="Exercício não encontrado." @retry="router.push('/portal/exercises')" />
  <div v-else class="space-y-4">
    <PageHeader :title="exercise.title" back="/portal/exercises" />
    <ExerciseRunner :exercise="exercise" @done="router.push('/portal/exercises')" />
  </div>
</template>
