<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NoteDetailContent from '@/features/notes/components/NoteDetailContent.vue'
import { getPatientNoteDisplayTitle } from '@/features/notes/helpers'
import { useMyPostTherapy } from '@/features/notes/queries'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const note = useMyPostTherapy(id)
</script>

<template>
  <div class="space-y-5">
    <PageHeader :title="note.data.value ? getPatientNoteDisplayTitle(note.data.value) : 'Pós-terapia'" description="Pós-terapia" back="/portal/post-therapy" />
    <LoadingState v-if="note.isPending.value" label="Abrindo…" />
    <ErrorState v-else-if="note.isError.value || !note.data.value" message="Este registro não está disponível ou foi removido." @retry="note.refetch()" />
    <div v-else class="rounded-2xl border border-brand-200 bg-card/60 p-4 shadow-xs">
      <NoteDetailContent :note="note.data.value" variant="portal" />
    </div>
  </div>
</template>
