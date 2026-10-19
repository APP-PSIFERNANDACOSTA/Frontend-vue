<script setup lang="ts">
import { CheckCircle2, ChevronRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { useCompleteTask, usePendingTasks } from '@/features/tasks/queries'
import type { TaskPriority } from '@/features/tasks/types'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import type { Tone } from '@/shared/components/status'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Skeleton } from '@/shared/ui/skeleton'

const privacy = usePrivacyMode()
const tasks = usePendingTasks(5) // só as 5 mais urgentes: o resto fica em "Ver todas"
const complete = useCompleteTask()
const PRIORITY: Record<TaskPriority, { label: string; tone: Tone }> = {
  high: { label: 'Alta', tone: 'danger' },
  medium: { label: 'Média', tone: 'warning' },
  low: { label: 'Baixa', tone: 'neutral' },
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base"><CheckCircle2 class="size-5 text-brand-600" /> Tarefas e lembretes</CardTitle>
      <CardAction><Button variant="ghost" size="sm" as-child><RouterLink to="/communications?tab=tasks">Ver todas <ChevronRight /></RouterLink></Button></CardAction>
    </CardHeader>
    <CardContent>
      <div v-if="tasks.isPending.value" class="space-y-3"><Skeleton v-for="n in 3" :key="n" class="h-10 w-full" /></div>
      <p v-else-if="tasks.isError.value" class="py-4 text-sm text-destructive">Não foi possível carregar as tarefas.</p>
      <p v-else-if="!tasks.data.value?.length" class="py-6 text-center text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
      <ul v-else class="space-y-2">
        <li v-for="t in tasks.data.value" :key="t.id" class="flex items-start gap-3 rounded-lg border p-3">
          <Checkbox class="mt-0.5" :disabled="complete.isPending.value" :aria-label="`Concluir: ${t.title ?? t.task}`" @update:model-value="complete.mutate(t.id)" />
          <div class="min-w-0 flex-1">
            <p class="text-sm">{{ t.title ?? t.task }}<template v-if="t.patient?.name"> — {{ privacy.name(t.patient.name) }}</template></p>
            <StatusBadge class="mt-1" :tone="PRIORITY[t.priority]?.tone ?? 'neutral'" :label="PRIORITY[t.priority]?.label ?? 'Baixa'" />
          </div>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
