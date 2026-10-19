<script setup lang="ts">
import { Copy, Download, FileText, Loader2, Mail, User } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { paymentTypeLabel } from '@/features/patients/constants'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import ContractText from '../components/ContractText.vue'
import { useContract, useDownloadContractPdf, useResendContract } from '../queries'
import { CONTRACT_STATUS_MAP } from '../status'
import { contractLink, isPendingExpired } from '../template'

const route = useRoute()
const privacy = usePrivacyMode()
const { copy } = useClipboardToast()
const id = computed(() => Number(route.params.id))
const query = useContract(id)
const c = computed(() => query.data.value)
const expired = computed(() => !!c.value && isPendingExpired(c.value))
const status = computed(() => (expired.value ? 'expired' : c.value?.status ?? 'pending'))
const pdf = useDownloadContractPdf()
const resend = useResendContract()

const rows = computed(() =>
  c.value
    ? [
        ['Tipo de pagamento', paymentTypeLabel(c.value.payment_type)],
        ['Valor da sessão', privacy.money(c.value.price_session)],
        ...(c.value.payment_day ? [['Dia de pagamento', `Dia ${c.value.payment_day} de cada mês`]] : []),
        ...(c.value.internal_description ? [['Descrição interna', c.value.internal_description]] : []),
        ['Criado em', formatDate(c.value.created_at)],
        ['Expira em', formatDate(c.value.expires_at)],
        ...(c.value.signed_at ? [['Assinado em', formatDate(c.value.signed_at, 'dd/MM/yyyy HH:mm')]] : []),
      ]
    : [],
)
</script>

<template>
  <LoadingState v-if="query.isPending.value" />
  <ErrorState v-else-if="query.isError.value || !c" message="Contrato não encontrado." @retry="query.refetch()" />

  <div v-else class="space-y-6">
    <PageHeader :title="`Contrato #${c.id}`" description="Visualizar detalhes do contrato" back="/dashboard/contracts">
      <template #actions><StatusBadge :status="status" :map="CONTRACT_STATUS_MAP" /></template>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <SectionCard title="Informações do contrato" :icon="FileText">
          <dl class="grid gap-4 sm:grid-cols-2">
            <div v-for="[k, v] in rows" :key="k"><dt class="text-xs text-muted-foreground">{{ k }}</dt><dd class="font-medium">{{ v }}</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Texto do contrato"><div class="max-h-[60vh] overflow-y-auto rounded-lg border bg-muted/30 p-4"><ContractText :text="c.contract_text" /></div></SectionCard>
      </div>

      <div class="space-y-6">
        <SectionCard title="Ações">
          <div class="flex flex-col gap-2">
            <Button v-if="c.status === 'pending' && !expired" variant="outline" @click="copy(contractLink(c.token), 'Link copiado!', 'O link do contrato foi copiado para a área de transferência')"><Copy /> Copiar link de assinatura</Button>
            <Button v-if="c.status === 'pending' && !expired" variant="outline" :disabled="resend.isPending.value" @click="resend.mutate(c.id)"><Loader2 v-if="resend.isPending.value" class="animate-spin" /><Mail v-else /> Reenviar por e-mail</Button>
            <Button v-if="c.status === 'signed' && c.pdf_path" :disabled="pdf.isPending.value" @click="pdf.mutate(c.id)"><Loader2 v-if="pdf.isPending.value" class="animate-spin" /><Download v-else /> Baixar PDF assinado</Button>
            <p v-if="c.status === 'inactive'" class="text-sm text-muted-foreground">Este contrato foi inativado.</p>
            <p v-else-if="expired || c.status === 'expired'" class="text-sm text-muted-foreground">Este contrato expirou e não pode mais ser assinado.</p>
          </div>
        </SectionCard>
        <SectionCard v-if="c.patient" title="Paciente" :icon="User">
          <p class="font-semibold">{{ privacy.name(c.patient.name) }}</p>
          <p v-if="c.patient.email" class="break-all text-sm text-muted-foreground">{{ privacy.email(c.patient.email) }}</p>
          <Button variant="outline" size="sm" class="mt-3" as-child><RouterLink :to="`/dashboard/patients/${c.patient_id}`">Ver paciente</RouterLink></Button>
        </SectionCard>
      </div>
    </div>
  </div>
</template>
