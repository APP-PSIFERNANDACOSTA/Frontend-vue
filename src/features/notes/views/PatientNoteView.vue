<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePatient } from '@/features/patients/queries'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { Button } from '@/shared/ui/button'
import NoteDetailContent from '../components/NoteDetailContent.vue'
import { getPatientNoteDisplayTitle } from '../helpers'
import { usePatientNote } from '../queries'

const route = useRoute()
const privacy = usePrivacyMode()
const patientId = computed(() => Number(route.params.id))
const noteId = computed(() => Number(route.params.noteId))
const note = usePatientNote(patientId, noteId)
const patient = usePatient(patientId)
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="note.data.value ? getPatientNoteDisplayTitle(note.data.value) : 'Anotação'" :back="`/dashboard/patients/${patientId}?tab=notes`">
      <template #description>
        <template v-if="patient.data.value">Paciente: <span class="font-medium text-foreground">{{ privacy.name(patient.data.value.name) }}</span></template>
      </template>
      <template #actions>
        <Button v-if="note.data.value" as-child><RouterLink :to="`/dashboard/patients/${patientId}/notes/${noteId}/edit`"><Pencil /> Editar</RouterLink></Button>
      </template>
    </PageHeader>
    <LoadingState v-if="note.isPending.value" />
    <ErrorState v-else-if="note.isError.value || !note.data.value" message="Anotação não encontrada." @retry="note.refetch()" />
    <NoteDetailContent v-else :note="note.data.value" />
  </div>
</template>
