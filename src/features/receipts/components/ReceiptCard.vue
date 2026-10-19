<script setup lang="ts">
import { AlertCircle, Eye } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { RECEIPT_STATUS_MAP } from '../constants'
import type { HealthReceipt } from '../types'

defineProps<{ receipt: HealthReceipt }>()
const privacy = usePrivacyMode()
</script>

<template>
  <Card class="min-w-0 transition-shadow hover:shadow-md">
    <CardContent class="flex items-start justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="truncate font-medium">{{ privacy.name(receipt.payment?.patient?.name || 'Paciente') }}</p>
          <StatusBadge :status="receipt.status" :map="RECEIPT_STATUS_MAP" />
          <StatusBadge v-if="receipt.missing_cpf" tone="danger"><AlertCircle class="size-3" /> CPF ausente</StatusBadge>
        </div>
        <p class="text-sm text-muted-foreground">Pagamento: {{ formatDate(receipt.payment_date) }} • Atendimento: {{ formatDate(receipt.service_date) }}</p>
        <p v-if="receipt.payment?.description || receipt.description" class="line-clamp-2 text-sm text-muted-foreground">{{ privacy.text(receipt.payment?.description || receipt.description, 24) }}</p>
        <p v-if="receipt.payment?.receipt_number" class="text-xs text-muted-foreground">Recibo: {{ receipt.payment.receipt_number }}</p>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-2">
        <p class="font-semibold">{{ privacy.money(receipt.amount) }}</p>
        <Button size="sm" variant="outline" as-child><RouterLink :to="`/dashboard/receipts/${receipt.id}`"><Eye /> {{ receipt.status === 'pending' ? 'Emitir' : 'Ver' }}</RouterLink></Button>
      </div>
    </CardContent>
  </Card>
</template>
