<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageHeader from '@/shared/components/PageHeader.vue'
import PatientForm from '../components/PatientForm.vue'
import { useCreatePatient } from '../queries'

const router = useRouter()
const create = useCreatePatient(() => router.push('/dashboard/patients'))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Cadastrar novo paciente" description="Preencha os dados do paciente para criar o cadastro" back="/dashboard/patients" />
    <PatientForm
      submit-label="Cadastrar paciente"
      loading-label="Cadastrando..."
      :saving="create.isPending.value"
      @submit="create.mutate($event)"
      @cancel="router.push('/dashboard/patients')"
    />
  </div>
</template>
