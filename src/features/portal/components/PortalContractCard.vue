<script setup lang="ts">
import { Calendar, ChevronRight, DollarSign, File } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { CONTRACT_STATUS_MAP } from '@/features/contracts/status'
import type { Contract } from '@/features/contracts/types'
import { paymentTypeLabel } from '@/features/patients/constants'
import InfoRow from '@/shared/components/InfoRow.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatDate, formatMoney } from '@/shared/lib/format'

defineProps<{ contract: Contract }>()
</script>

<template>
  <RouterLink :to="`/portal/contracts/${contract.id}`" class="block rounded-2xl border bg-card p-4 shadow-xs transition active:scale-[0.99] active:bg-muted/50">
    <div class="flex items-start justify-between gap-3">
      <h3 class="flex items-center gap-2 font-semibold"><File class="size-5 text-brand-600" /> Contrato #{{ contract.id }}</h3>
      <StatusBadge :status="contract.status" :map="CONTRACT_STATUS_MAP" />
    </div>
    <div class="mt-3 space-y-1.5">
      <InfoRow :icon="DollarSign" :text="`${paymentTypeLabel(contract.payment_type)} · ${formatMoney(contract.price_session)} por sessão`" />
      <InfoRow v-if="contract.payment_day" :icon="Calendar" :text="`Pagamento todo dia ${contract.payment_day}`" />
      <InfoRow :icon="Calendar" :text="contract.signed_at ? `Assinado em ${formatDate(contract.signed_at)}` : `Criado em ${formatDate(contract.created_at)}`" />
    </div>
    <p class="mt-3 flex items-center justify-end gap-1 text-sm font-medium text-brand-700 dark:text-brand">Ver contrato <ChevronRight class="size-4" /></p>
  </RouterLink>
</template>
