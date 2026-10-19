<script setup lang="ts">
import { File, FileText } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { paymentTypeLabel } from '@/features/patients/constants'
import contractService from '../api'
import { usePatientContracts } from '../queries'
import { CONTRACT_STATUS_MAP } from '../status'

const props = defineProps<{ patientId: number; patientName: string; active: boolean }>()
const privacy = usePrivacyMode()
const query = usePatientContracts(() => props.patientId, () => props.active)

async function downloadPdf(id: number) {
  try {
    await contractService.downloadPdf(id)
  } catch (e: any) {
    notify.error('Erro ao baixar PDF', e?.message || e?.response?.data?.message || 'Tente novamente')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold">Contratos do paciente</h3>
        <p class="text-sm text-muted-foreground">Histórico de contratos de {{ privacy.name(patientName) }}</p>
      </div>
      <Button as-child class="w-full sm:w-auto">
        <RouterLink :to="{ path: '/dashboard/contracts/create', query: { patientId: patientId } }"><FileText /> Novo contrato para este paciente</RouterLink>
      </Button>
    </div>

    <QueryState :query="query" :empty="!query.data.value?.length">
      <template #empty>
        <EmptyState :icon="File" title="Nenhum contrato encontrado" description="Este paciente ainda não possui contratos" />
      </template>
      <Card v-for="c in query.data.value" :key="c.id">
        <CardContent class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="font-semibold">Contrato #{{ c.id }}</h4>
              <StatusBadge :status="c.status" :map="CONTRACT_STATUS_MAP" />
            </div>
            <div class="space-y-0.5 text-sm text-muted-foreground">
              <p>Tipo: {{ paymentTypeLabel(c.payment_type) }}</p>
              <p>Valor: {{ privacy.money(c.price_session) }}</p>
              <p v-if="c.signed_at">Assinado em: {{ formatDate(c.signed_at) }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Button v-if="c.status === 'signed' && c.pdf_path" size="sm" variant="outline" @click="downloadPdf(c.id)"><FileText /> Ver PDF</Button>
            <Button size="sm" variant="outline" as-child><RouterLink :to="`/dashboard/contracts/${c.id}`"><File /> Ver detalhes</RouterLink></Button>
          </div>
        </CardContent>
      </Card>
    </QueryState>
  </div>
</template>
