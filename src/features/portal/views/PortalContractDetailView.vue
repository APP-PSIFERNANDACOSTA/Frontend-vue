<script setup lang="ts">
import { FileText } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ContractText from '@/features/contracts/components/ContractText.vue'
import contractService from '@/features/contracts/api'
import { useMyContracts } from '@/features/contracts/queries'
import { CONTRACT_STATUS_MAP } from '@/features/contracts/status'
import { paymentTypeLabel } from '@/features/patients/constants'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { formatDate, formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'

const route = useRoute()
const id = computed(() => Number(route.params.id))
// O backend não tem "contrato por id" para o paciente: a lista (/patient/contracts/my) já traz o texto completo.
const query = useMyContracts()
const c = computed(() => query.data.value?.find((x) => x.id === id.value))
const pdf = useApiMutation(() => contractService.downloadMyContractPdf(id.value), { error: 'Erro ao baixar PDF' })

const NOTICE = {
  pending: 'Este contrato ainda não foi assinado.',
  expired: 'Este contrato expirou e não pode mais ser assinado.',
  inactive: 'Este contrato foi desativado pela psicóloga.',
} as const
const rows = computed(() =>
  c.value
    ? [
        ['Tipo de pagamento', paymentTypeLabel(c.value.payment_type)],
        ['Valor da sessão', formatMoney(c.value.price_session)],
        ...(c.value.payment_day ? [['Dia de pagamento', `Dia ${c.value.payment_day}`]] : []),
        ['Criado em', formatDate(c.value.created_at)],
        ['Assinado em', c.value.signed_at ? formatDate(c.value.signed_at) : 'Não assinado'],
      ]
    : [],
)
</script>

<template>
  <LoadingState v-if="query.isPending.value" />
  <ErrorState v-else-if="query.isError.value || !c" :message="query.isError.value ? 'Não foi possível carregar o contrato.' : 'Contrato não encontrado.'" @retry="query.refetch()" />

  <div v-else class="space-y-4">
    <PageHeader :title="`Contrato #${c.id}`" back="/portal/contracts">
      <template #description><StatusBadge :status="c.status" :map="CONTRACT_STATUS_MAP" /></template>
    </PageHeader>

    <p v-if="c.status !== 'signed' && NOTICE[c.status as keyof typeof NOTICE]" class="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
      <strong>Contrato {{ CONTRACT_STATUS_MAP[c.status]?.label.toLowerCase() }}:</strong> {{ NOTICE[c.status as keyof typeof NOTICE] }}
    </p>

    <SectionCard title="Informações">
      <dl class="space-y-3 text-sm">
        <div v-for="[k, v] in rows" :key="k" class="flex items-center justify-between gap-4"><dt class="text-muted-foreground">{{ k }}</dt><dd class="text-right font-medium">{{ v }}</dd></div>
      </dl>
      <Button v-if="c.status === 'signed' && c.pdf_path" variant="outline" class="mt-4 h-11 w-full" :disabled="pdf.isPending.value" @click="pdf.mutate(undefined)">
        <FileText /> {{ pdf.isPending.value ? 'Baixando...' : 'Baixar PDF' }}
      </Button>
    </SectionCard>

    <SectionCard title="Texto do contrato"><ContractText :text="c.contract_text" /></SectionCard>
  </div>
</template>
