<script setup lang="ts">
import { AlertCircle, CheckCircle2, Clock, PlayCircle, Plus } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useDeleteTask, useMoveTask, useTasks } from '@/features/tasks/queries'
import type { Task, TaskStatus } from '@/features/tasks/types'
import QueryState from '@/shared/components/QueryState.vue'
import SearchInput from '@/shared/components/SearchInput.vue'
import StatCard from '@/shared/components/StatCard.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import TaskCard from './TaskCard.vue'
import TaskFormDialog from './TaskFormDialog.vue'

const search = ref('')
const filter = ref<TaskStatus | 'all'>('all')

const query = useTasks(search)
const stats = computed(() => query.data.value?.stats ?? { total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0 })

const COLUMNS: { status: TaskStatus; label: string; badge: string }[] = [
  { status: 'todo', label: 'A fazer', badge: 'bg-brand-100 text-brand-700' },
  { status: 'in-progress', label: 'Em progresso', badge: 'bg-warning/10 text-warning' },
  { status: 'done', label: 'Concluídas', badge: 'bg-success/10 text-success' },
]
// listas locais por coluna (o arrastar as modifica; a query as reinicia depois de cada mudança)
const lists = ref<Record<TaskStatus, Task[]>>({ todo: [], 'in-progress': [], done: [] })
watch(() => query.data.value?.tasks, (tasks) => {
  const by = (s: TaskStatus) => (tasks ?? []).filter((t) => t.status === s)
  lists.value = { todo: by('todo'), 'in-progress': by('in-progress'), done: by('done') }
}, { immediate: true })
const visible = (s: TaskStatus) => filter.value === 'all' || filter.value === s

const move = useMoveTask()
/** Soltou o cartão numa coluna: muda o status no servidor. */
function onAdd(status: TaskStatus, e: { newIndex?: number }) {
  const task = lists.value[status][e.newIndex ?? 0]
  if (task && task.status !== status) move.mutate({ id: task.id, status })
}

const dialogOpen = ref(false)
const editing = ref<Task | null>(null)
const openCreate = () => ((editing.value = null), (dialogOpen.value = true))
const openEdit = (t: Task) => ((editing.value = t), (dialogOpen.value = true))
const confirm = useConfirm()
const del = useDeleteTask()
async function remove(t: Task) {
  if (await confirm({ title: 'Excluir tarefa?', description: t.title ?? t.task, confirmText: 'Excluir', destructive: true })) del.mutate(t.id)
}
const FILTERS = computed(() => [
  { value: 'all' as const, label: `Todas (${stats.value.total})` },
  { value: 'todo' as const, label: `A fazer (${stats.value.todo})` },
  { value: 'in-progress' as const, label: `Em progresso (${stats.value.in_progress})` },
  { value: 'done' as const, label: `Concluídas (${stats.value.done})` },
])
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total" :value="stats.total" :icon="CheckCircle2" :loading="query.isPending.value" />
      <StatCard label="A fazer" :value="stats.todo" :icon="Clock" :loading="query.isPending.value" />
      <StatCard label="Em progresso" :value="stats.in_progress" :icon="PlayCircle" :loading="query.isPending.value" />
      <StatCard label="Vencidas" :value="stats.overdue" :icon="AlertCircle" :loading="query.isPending.value" />
    </div>

    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-wrap gap-2">
        <Button v-for="f in FILTERS" :key="f.value" size="sm" :variant="filter === f.value ? 'default' : 'outline'" @click="filter = f.value">{{ f.label }}</Button>
      </div>
      <div class="flex gap-2">
        <SearchInput v-model="search" placeholder="Buscar tarefas..." class="flex-1 sm:w-64 sm:flex-none" />
        <Button @click="openCreate"><Plus /> Nova tarefa</Button>
      </div>
    </div>

    <QueryState :query="query" loading-label="Carregando tarefas...">
      <div :class="cn('grid gap-4', filter === 'all' ? 'lg:grid-cols-3' : 'lg:grid-cols-1')">
        <template v-for="col in COLUMNS" :key="col.status">
          <section v-if="visible(col.status)" class="rounded-2xl border bg-card p-4">
            <h3 class="mb-3 flex items-center justify-between text-base font-semibold">{{ col.label }}<span :class="cn('flex size-6 items-center justify-center rounded-full text-xs font-semibold', col.badge)">{{ lists[col.status].length }}</span></h3>
            <div class="relative">
              <p v-if="!lists[col.status].length" class="pointer-events-none absolute inset-x-0 top-0 flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">Arraste tarefas aqui</p>
              <VueDraggable v-model="lists[col.status]" group="tasks" handle=".task-handle" :animation="150" ghost-class="opacity-40" class="relative min-h-40 space-y-3" @add="(e: any) => onAdd(col.status, e)">
                <TaskCard v-for="t in lists[col.status]" :key="t.id" :task="t" @edit="openEdit(t)" @delete="remove(t)" @move="(s) => move.mutate({ id: t.id, status: s })" />
              </VueDraggable>
            </div>
          </section>
        </template>
      </div>
    </QueryState>

    <TaskFormDialog v-model:open="dialogOpen" :task="editing" />
  </div>
</template>
