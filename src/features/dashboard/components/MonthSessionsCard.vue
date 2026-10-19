<script setup lang="ts">
import { TrendingUp } from '@lucide/vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import type { MonthSessionStats } from '../metrics'

defineProps<{ stats?: MonthSessionStats; loading: boolean }>()
const privacy = usePrivacyMode()
const rows = [
  ['no_show', 'Faltas', 'text-warning'],
  ['cancelled', 'Canceladas', 'text-destructive'],
  ['rescheduled', 'Remarcadas', 'text-brand-700 dark:text-brand'],
  ['scheduled', 'Ainda agendadas', 'text-muted-foreground'],
] as const
</script>

<template>
  <Card class="h-full">
    <CardHeader><CardTitle class="flex items-center gap-2 text-base"><TrendingUp class="size-5 text-brand-600" /> Sessões do mês</CardTitle></CardHeader>
    <CardContent>
      <Skeleton v-if="loading" class="h-32 w-full" />
      <div v-else-if="stats" class="space-y-4">
        <div>
          <p class="text-3xl font-bold text-success">{{ privacy.enabled.value ? '•••' : stats.completed }}</p>
          <p class="text-xs text-muted-foreground">Sessões realizadas</p>
        </div>
        <dl v-if="!privacy.enabled.value" class="space-y-2 border-t pt-3 text-sm">
          <div v-for="[key, label, cls] in rows" :key="key" class="flex items-center justify-between">
            <dt class="text-muted-foreground">{{ label }}</dt><dd :class="['font-semibold', cls]">{{ stats[key] }}</dd>
          </div>
        </dl>
      </div>
    </CardContent>
  </Card>
</template>
