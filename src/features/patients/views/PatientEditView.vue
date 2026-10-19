<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import PatientForm, { type PatientFormValues } from '../components/PatientForm.vue'
import { usePatient, useUpdatePatient } from '../queries'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const id = computed(() => Number(route.params.id))
const patient = usePatient(id)
const update = useUpdatePatient(id, () => router.push('/dashboard/patients'))

async function save(values: PatientFormValues) {
  const p = patient.data.value
  // Inativar remove as sessões futuras da agenda (e eventos do Google) — confirma antes
  if (p?.status === 'active' && values.status === 'inactive') {
    const ok = await confirm({
      title: 'Inativar paciente?',
      description: `Ao inativar ${p.name}, todas as sessões futuras agendadas serão removidas da agenda. Se alguma estiver sincronizada com o Google Calendar, o evento e o link do Meet também serão cancelados. O histórico de sessões já realizadas é mantido.`,
      confirmText: 'Sim, inativar paciente',
      destructive: true,
    })
    if (!ok) return
  }
  update.mutate(values)
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Editar paciente" description="Atualize os dados do paciente" :back="`/dashboard/patients/${id}`" />
    <LoadingState v-if="patient.isPending.value" />
    <ErrorState v-else-if="patient.isError.value" message="Paciente não encontrado." @retry="patient.refetch()" />
    <PatientForm
      v-else
      :patient="patient.data.value"
      submit-label="Salvar alterações"
      loading-label="Salvando..."
      :saving="update.isPending.value"
      @submit="save"
      @cancel="router.push(`/dashboard/patients/${id}`)"
    />
  </div>
</template>
