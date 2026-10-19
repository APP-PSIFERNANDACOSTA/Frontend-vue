<script setup lang="ts">
import { Download, Loader2, Pencil, Trash2, User } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { LOCKED_MESSAGE, PAYMENT_METHOD_MAP } from '../constants'
import { useDeletePayment, useDownloadReceipt, usePayment } from '../queries'
import { isPaymentLockedByHealthReceipt } from '../types'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const privacy = usePrivacyMode()
const id = computed(() => Number(route.params.id))
const query = usePayment(id)
const p = computed(() => query.data.value)
const locked = computed(() => !!p.value && isPaymentLockedByHealthReceipt(p.value))
const healthStatus = computed(() => (p.value?.healthReceipt ?? p.value?.health_receipt)?.status)

const download = useDownloadReceipt()
const del = useDeletePayment(() => router.replace('/dashboard/payments'))
async function askDelete() {
  const ok = await confirm({ title: 'Excluir pagamento?', description: `O pagamento ${p.value?.receipt_number} e o recibo gerado serão removidos. Esta ação não pode ser desfeita.`, confirmText: 'Excluir', destructive: true })
  if (ok) del.mutate(id.value)
}
</script>

<template>
  <LoadingState v-if="query.isPending.value" />
  <ErrorState v-else-if="query.isError.value || !p" message="Pagamento não encontrado." @retry="query.refetch()" />

  <div v-else class="space-y-6">
    <PageHeader title="Detalhes do pagamento" :description="`Nº ${p.receipt_number}`" back="/dashboard/payments">
      <template #actions>
        <template v-if="!locked">
          <Button variant="outline" as-child><RouterLink :to="`/dashboard/payments/${p.id}/edit`"><Pencil /> Editar</RouterLink></Button>
          <Button variant="outline" class="text-destructive hover:text-destructive" :disabled="del.isPending.value" @click="askDelete"><Trash2 /> Excluir</Button>
        </template>
        <Button v-if="p.pdf_path" :disabled="download.isPending.value" @click="download.mutate(p.id)"><Loader2 v-if="download.isPending.value" class="animate-spin" /><Download v-else /> Baixar recibo (PDF)</Button>
      </template>
    </PageHeader>

    <p v-if="locked" class="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">{{ LOCKED_MESSAGE }}</p>

    <div class="grid gap-6 lg:grid-cols-3">
      <SectionCard title="Informações do pagamento" class="lg:col-span-2">
        <dl class="grid gap-5 sm:grid-cols-2">
          <div><dt class="mb-1 text-sm text-muted-foreground">Valor</dt><dd class="text-2xl font-bold text-success">{{ privacy.money(p.amount) }}</dd></div>
          <div><dt class="mb-1 text-sm text-muted-foreground">Método</dt><dd><StatusBadge :status="p.payment_method" :map="PAYMENT_METHOD_MAP" /></dd></div>
          <div><dt class="mb-1 text-sm text-muted-foreground">Data do pagamento</dt><dd>{{ formatDate(p.payment_date, "dd 'de' MMMM 'de' yyyy") }}</dd></div>
          <div><dt class="mb-1 text-sm text-muted-foreground">Número do recibo</dt><dd class="font-mono">{{ p.receipt_number }}</dd></div>
          <div v-if="p.description" class="sm:col-span-2"><dt class="mb-1 text-sm text-muted-foreground">Descrição / observações</dt><dd class="rounded-lg bg-muted/50 p-3 text-sm">{{ privacy.text(p.description, 24) }}</dd></div>
          <div class="sm:col-span-2">
            <dt class="mb-1 text-sm text-muted-foreground">Recibo de saúde</dt>
            <dd class="flex flex-wrap gap-2">
              <StatusBadge v-if="healthStatus === 'issued'" tone="success" label="Emitido" />
              <StatusBadge v-else-if="healthStatus === 'pending'" tone="warning" label="Pendente" />
              <StatusBadge v-else tone="neutral" label="Não gerado" />
              <StatusBadge v-if="p.pdf_path" tone="info" label="PDF do recibo disponível" />
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Paciente" :icon="User">
        <template v-if="p.patient">
          <p class="font-semibold">{{ privacy.name(p.patient.name) }}</p>
          <p v-if="p.patient.email" class="break-all text-sm text-muted-foreground">{{ privacy.email(p.patient.email) }}</p>
          <Button variant="outline" size="sm" class="mt-3" as-child><RouterLink :to="`/dashboard/patients/${p.patient_id}`">Ver paciente</RouterLink></Button>
        </template>
        <p v-else class="text-sm text-muted-foreground">Paciente não encontrado</p>
      </SectionCard>
    </div>
  </div>
</template>
