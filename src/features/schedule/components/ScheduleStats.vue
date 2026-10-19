<script setup lang="ts">
import { Skeleton } from '@/shared/ui/skeleton'
import type { MonthSessionStats } from '@/features/dashboard/metrics'

defineProps<{ stats?: MonthSessionStats; loading: boolean }>()
const items = [
  ['scheduled', 'Agendadas', 'Sessões confirmadas', 'text-brand-800 dark:text-brand'],
  ['completed', 'Realizadas', 'Sessões concluídas', 'text-success'],
  ['rescheduled', 'Remarcadas', 'Sessões reagendadas', 'text-brand-600'],
  ['no_show', 'Faltas', 'Pacientes que faltaram', 'text-warning'],
] as const
</script>

<template>
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <div v-for="[key, label, hint, cls] in items" :key="key" class="rounded-xl border bg-card p-4 shadow-xs">
      <Skeleton v-if="loading" class="h-10 w-16" />
      <p v-else :class="['text-3xl font-bold', cls]">{{ stats?.[key] ?? 0 }}</p>
      <p :class="['mt-1 text-sm font-medium', cls]">{{ label }}</p>
      <p class="text-xs text-muted-foreground">{{ hint }}</p>
    </div>
  </div>
</template>
