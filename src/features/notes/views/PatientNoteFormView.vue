<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePatient } from '@/features/patients/queries'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import NoteForm from '../components/NoteForm.vue'
import { usePatientNote, useSaveNote } from '../queries'

/** Serve /notes/new e /notes/:noteId/edit (a presença de :noteId define o modo). */
const route = useRoute()
const router = useRouter()
const privacy = usePrivacyMode()
const patientId = computed(() => Number(route.params.id))
const noteId = computed(() => (route.params.noteId ? Number(route.params.noteId) : undefined))
const isEdit = computed(() => !!noteId.value)
const back = computed(() => `/dashboard/patients/${patientId.value}?tab=notes`)

const note = usePatientNote(patientId, noteId)
const patient = usePatient(patientId)
const save = useSaveNote(patientId, noteId, () => router.push(back.value))
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="isEdit ? 'Editar anotação' : 'Nova anotação'" :back="back">
      <template #description>
        <template v-if="patient.data.value">Paciente: <span class="font-medium text-foreground">{{ privacy.name(patient.data.value.name) }}</span> · </template>
        {{ isEdit ? 'Altere o conteúdo, o tipo ou o vínculo com a sessão.' : 'Texto livre ou modelo pós-terapia. Opcionalmente vincule a uma sessão.' }}
      </template>
    </PageHeader>
    <LoadingState v-if="isEdit && note.isPending.value" />
    <ErrorState v-else-if="isEdit && note.isError.value" message="Anotação não encontrada." @retry="note.refetch()" />
    <NoteForm v-else :patient-id="patientId" :note="note.data.value" :saving="save.isPending.value" @submit="save.mutate($event)" @cancel="router.push(back)" />
  </div>
</template>
