<script setup lang="ts">
import { BookOpen, Calendar, CircleDollarSign, Edit, File, FileText, Loader2, NotebookPen, RotateCcw, UserX } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import PatientNotesTab from '@/features/notes/components/PatientNotesTab.vue'
import PatientDiaryTab from '@/features/diary/components/PatientDiaryTab.vue'
import PatientSessionsTab from '@/features/sessions/components/PatientSessionsTab.vue'
import PatientContractsTab from '@/features/contracts/components/PatientContractsTab.vue'
import PatientPaymentsTab from '@/features/pix/components/PatientPaymentsTab.vue'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { Button } from '@/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import PatientInfoTab from '../components/PatientInfoTab.vue'
import { PATIENT_STATUS_MAP } from '../constants'
import { usePatient, useReactivatePatient } from '../queries'

const TABS = [
  { value: 'info', label: 'Informações', short: 'Info', icon: FileText },
  { value: 'diary', label: 'Diário', icon: BookOpen },
  { value: 'sessions', label: 'Sessões', icon: Calendar },
  { value: 'notes', label: 'Anotações', short: 'Notas', icon: NotebookPen },
  { value: 'contracts', label: 'Contratos', icon: File },
  { value: 'payments', label: 'Pagamentos', icon: CircleDollarSign },
] as const

const route = useRoute()
const router = useRouter()
const privacy = usePrivacyMode()
const id = computed(() => Number(route.params.id))
const patient = usePatient(id)
const reactivate = useReactivatePatient()

// Aba ativa vive na URL (?tab=) — links de notificação continuam funcionando
const tab = computed({
  get: () => (route.query.tab === 'charges' ? 'payments' : TABS.some((t) => t.value === route.query.tab) ? (route.query.tab as string) : 'info'),
  set: (v) => router.replace({ query: { ...route.query, tab: v === 'info' ? undefined : v } }),
})
</script>

<template>
  <LoadingState v-if="patient.isPending.value" />
  <ErrorState v-else-if="patient.isError.value || !patient.data.value" message="Paciente não encontrado." @retry="patient.refetch()" />

  <div v-else class="space-y-6">
    <PageHeader :title="privacy.name(patient.data.value.name)" back="/dashboard/patients">
      <template #description>
        <span class="flex flex-wrap items-center gap-2">
          <StatusBadge :status="patient.data.value.status" :map="PATIENT_STATUS_MAP" />
          <span class="text-xs">ID: {{ patient.data.value.id }}</span>
        </span>
      </template>
      <template #actions>
        <Button variant="outline" as-child><RouterLink :to="`/dashboard/patients/${id}/edit`"><Edit /> Editar</RouterLink></Button>
      </template>
    </PageHeader>

    <div v-if="patient.data.value.status === 'inactive'" class="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
      <UserX class="size-5 shrink-0 text-warning" />
      <div class="min-w-0 flex-1">
        <p class="font-medium">Paciente inativo</p>
        <p class="text-sm text-muted-foreground">Não aparece na agenda nem nas listas de pacientes ativos e não recebe cobranças automáticas.</p>
      </div>
      <Button :disabled="reactivate.isPending.value" @click="reactivate.mutate(id)"><Loader2 v-if="reactivate.isPending.value" class="animate-spin" /><RotateCcw v-else /> Reativar paciente</Button>
    </div>

    <Tabs v-model="tab" class="space-y-4">
      <div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList class="h-auto min-w-max gap-1">
          <TabsTrigger v-for="t in TABS" :key="t.value" :value="t.value" class="gap-2 whitespace-nowrap px-3 py-1.5">
            <component :is="t.icon" class="size-4" />
            <template v-if="'short' in t"><span class="hidden sm:inline">{{ t.label }}</span><span class="sm:hidden">{{ t.short }}</span></template>
            <template v-else>{{ t.label }}</template>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="info"><PatientInfoTab :patient="patient.data.value" /></TabsContent>
      <TabsContent value="diary">
        <PatientDiaryTab :patient-id="id" :patient-name="patient.data.value.name" />
      </TabsContent>
      <TabsContent value="sessions">
        <PatientSessionsTab :patient-id="id" :price-session="patient.data.value.price_session" />
      </TabsContent>
      <TabsContent value="notes"><PatientNotesTab :patient-id="id" /></TabsContent>
      <TabsContent value="contracts">
        <PatientContractsTab :patient-id="id" :patient-name="patient.data.value.name" :active="tab === 'contracts'" />
      </TabsContent>
      <TabsContent value="payments"><PatientPaymentsTab :patient="patient.data.value" /></TabsContent>
    </Tabs>
  </div>
</template>
