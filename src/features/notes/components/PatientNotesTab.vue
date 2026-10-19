<script setup lang="ts">
import { Eye, NotebookPen, Pencil, Plus, Trash2 } from '@lucide/vue'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import DataView from '@/shared/components/data/DataView.vue'
import ViewToggle from '@/shared/components/data/ViewToggle.vue'
import type { Column, ViewMode } from '@/shared/components/data/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import type { Session } from '@/features/sessions/types'
import { formatSessionLine, getPatientNoteDisplayTitle } from '../helpers'
import { NOTES_PER_PAGE, useDeleteNote, usePatientNotes } from '../queries'
import type { PatientNote } from '../types'
import NoteTypeBadge from './NoteTypeBadge.vue'

const props = defineProps<{ patientId: number }>()
const router = useRouter()
const confirm = useConfirm()
const page = ref(1)
const view = useStorage<ViewMode>('patient-notes-view', 'list')
const perPage = ref(NOTES_PER_PAGE)
watch(() => props.patientId, () => (page.value = 1))

const query = usePatientNotes(() => props.patientId, page)
const notes = computed(() => query.data.value?.data ?? [])
const total = computed(() => query.data.value?.meta.total ?? 0)
const del = useDeleteNote(() => props.patientId)

const columns: Column[] = [
  { key: 'title', label: 'Título' },
  { key: 'kind', label: 'Tipo', class: 'w-32' },
  { key: 'session', label: 'Sessão', hideBelow: 'md' },
  { key: 'updated_at', label: 'Atualizado', hideBelow: 'lg', class: 'whitespace-nowrap' },
]
const base = `/dashboard/patients/${props.patientId}/notes`
const updated = (n: PatientNote) => format(parseISO(n.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
const sessionLine = (n: PatientNote) => (n.session_id && n.session ? formatSessionLine(n.session as Session) : null)

async function remove(n: PatientNote) {
  const ok = await confirm({ title: 'Excluir anotação?', description: 'Esta ação não pode ser desfeita. A anotação será removida permanentemente.', confirmText: 'Excluir', destructive: true })
  if (!ok) return
  await del.mutateAsync(n.id)
  // se esvaziou a última página, volta uma
  if (notes.value.length === 1 && page.value > 1) page.value--
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-semibold"><NotebookPen class="size-5 text-brand-600" /> Anotações</h2>
        <p class="mt-0.5 text-sm text-muted-foreground">Lista resumida. <strong class="font-medium text-foreground">Ver</strong> para leitura, <strong class="font-medium text-foreground">Editar</strong> para alterar.</p>
      </div>
      <div class="flex items-center gap-2">
        <ViewToggle v-model="view" class="hidden lg:inline-flex" />
        <Button as-child class="shrink-0"><RouterLink :to="`${base}/new`"><Plus /> Nova anotação</RouterLink></Button>
      </div>
    </div>

    <DataView
      v-model:view="view" v-model:page="page" v-model:per-page="perPage"
      :query="query" :items="notes" :columns="columns" item-key="id" :total="total" :sizes="[NOTES_PER_PAGE]" clickable
      @row-click="(n: PatientNote) => router.push(`${base}/${n.id}`)"
    >
      <template #card="{ item }">
        <Card class="transition-shadow hover:shadow-md">
          <CardContent class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <p class="min-w-0 font-medium break-words">{{ getPatientNoteDisplayTitle(item) }}</p>
              <NoteTypeBadge :kind="item.kind" class="shrink-0" />
            </div>
            <p v-if="sessionLine(item)" class="text-xs text-muted-foreground">{{ sessionLine(item) }}</p>
            <p class="text-xs text-muted-foreground">Atualizado {{ updated(item) }}</p>
            <div class="flex gap-2 border-t pt-3">
              <Button size="sm" variant="outline" as-child class="flex-1"><RouterLink :to="`${base}/${item.id}`"><Eye /> Ver</RouterLink></Button>
              <Button size="sm" variant="outline" as-child class="flex-1"><RouterLink :to="`${base}/${item.id}/edit`"><Pencil /> Editar</RouterLink></Button>
              <Button size="icon" variant="ghost" class="size-8 text-destructive hover:text-destructive" aria-label="Excluir" @click="remove(item)"><Trash2 /></Button>
            </div>
          </CardContent>
        </Card>
      </template>

      <template #cell-title="{ row }"><span class="block max-w-[260px] truncate font-medium">{{ getPatientNoteDisplayTitle(row) }}</span></template>
      <template #cell-kind="{ row }"><NoteTypeBadge :kind="row.kind" /></template>
      <template #cell-session="{ row }"><span class="line-clamp-2 text-sm text-muted-foreground">{{ sessionLine(row) ?? '—' }}</span></template>
      <template #cell-updated_at="{ row }"><span class="text-xs text-muted-foreground">{{ updated(row) }}</span></template>
      <template #actions="{ row }">
        <div class="flex justify-end gap-1">
          <Button size="sm" variant="outline" as-child class="h-8"><RouterLink :to="`${base}/${row.id}`"><Eye /> Ver</RouterLink></Button>
          <Button size="sm" variant="outline" as-child class="h-8"><RouterLink :to="`${base}/${row.id}/edit`"><Pencil /> Editar</RouterLink></Button>
          <Button size="icon" variant="ghost" class="size-8 text-destructive hover:text-destructive" aria-label="Excluir" @click="remove(row)"><Trash2 /></Button>
        </div>
      </template>

      <template #empty>
        <EmptyState :icon="NotebookPen" title="Nenhuma anotação ainda" description="Crie uma anotação em texto livre ou use o modelo com campos (síntese, frase, recursos, etc.).">
          <Button variant="outline" as-child><RouterLink :to="`${base}/new`"><Plus /> Criar primeira anotação</RouterLink></Button>
        </EmptyState>
      </template>
    </DataView>
  </div>
</template>
