<script setup lang="ts">
import { AlertCircle, Calendar, CheckCircle2, GripVertical, Pencil, PlayCircle, RotateCcw, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import type { Task, TaskStatus } from '@/features/tasks/types'
import { CATEGORY_LABELS, PRIORITY_LABELS, PRIORITY_TONE, isTaskOverdue } from '../tasks-ui'

const props = defineProps<{ task: Task }>()
defineEmits<{ edit: []; delete: []; move: [status: TaskStatus] }>()
const privacy = usePrivacyMode()
const done = computed(() => props.task.status === 'done')
const overdue = computed(() => isTaskOverdue(props.task))
const title = computed(() => props.task.title ?? props.task.task)
</script>

<template>
  <div :class="cn('group rounded-lg border bg-card p-3 transition-shadow hover:shadow-md', done && 'opacity-60', overdue && 'border-destructive/40')">
    <div class="flex items-start gap-2">
      <span class="task-handle mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing" aria-label="Arrastar"><GripVertical class="size-4" /></span>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p :class="cn('break-words text-sm font-medium', done && 'line-through')">{{ title }}</p>
          <div class="-mr-1 -mt-1 flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <Button v-if="!done" variant="ghost" size="icon" class="size-7" aria-label="Editar" @click="$emit('edit')"><Pencil class="size-3.5" /></Button>
            <Button v-if="task.status === 'todo'" variant="ghost" size="icon" class="size-7" title="Marcar como em progresso" aria-label="Iniciar" @click="$emit('move', 'in-progress')"><PlayCircle class="size-3.5" /></Button>
            <Button v-if="task.status === 'in-progress'" variant="ghost" size="icon" class="size-7" title="Marcar como concluída" aria-label="Concluir" @click="$emit('move', 'done')"><CheckCircle2 class="size-3.5" /></Button>
            <Button v-if="done" variant="ghost" size="icon" class="size-7" title="Reabrir tarefa" aria-label="Reabrir" @click="$emit('move', 'todo')"><RotateCcw class="size-3.5" /></Button>
            <Button variant="ghost" size="icon" class="size-7" aria-label="Excluir" @click="$emit('delete')"><Trash2 class="size-3.5" /></Button>
          </div>
        </div>
        <p v-if="task.description" :class="cn('mt-1 line-clamp-2 text-xs text-muted-foreground', done && 'line-through')">{{ task.description }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-1.5">
          <span :class="cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_TONE[task.priority])">{{ PRIORITY_LABELS[task.priority] }}</span>
          <span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{{ CATEGORY_LABELS[task.category] ?? task.category }}</span>
          <span v-if="task.patient" class="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{{ privacy.name(task.patient.name) }}</span>
          <span v-if="overdue" class="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"><AlertCircle class="size-3" />Vencida</span>
          <span v-else-if="task.due_date" class="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar class="size-3" />{{ formatDate(task.due_date) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
