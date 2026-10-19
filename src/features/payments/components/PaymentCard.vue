<script setup lang="ts">
import { FileText } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Card, CardContent } from '@/shared/ui/card'
import { PAYMENT_METHOD_MAP } from '../constants'
import { type Payment } from '../types'
import PaymentRowActions from './PaymentRowActions.vue'

const props = defineProps<{ payment: Payment; downloading?: boolean }>()
const emit = defineEmits<{ download: []; delete: [] }>()
const privacy = usePrivacyMode()
const pendingHealthReceipt = () => (props.payment.healthReceipt ?? props.payment.health_receipt)?.status === 'pending'
const healthReceiptId = () => props.payment.healthReceipt?.id ?? props.payment.health_receipt?.id
</script>

<template>
  <Card class="min-w-0 transition-shadow hover:shadow-md">
    <CardContent class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :status="payment.payment_method" :map="PAYMENT_METHOD_MAP" />
        <StatusBadge v-if="payment.pdf_path" tone="info"><FileText class="size-3" /> Recibo disponível</StatusBadge>
        <RouterLink v-if="pendingHealthReceipt()" :to="healthReceiptId() ? `/dashboard/receipts/${healthReceiptId()}` : '/dashboard/receipts'"><StatusBadge tone="warning" label="Recibo Saúde pendente" /></RouterLink>
      </div>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate font-semibold">{{ payment.patient?.name ? privacy.name(payment.patient.name) : 'N/A' }}</p>
          <p class="text-sm text-muted-foreground">{{ formatDate(payment.payment_date, "dd 'de' MMMM 'de' yyyy") }}</p>
        </div>
        <p class="shrink-0 text-lg font-bold text-success">{{ privacy.money(payment.amount) }}</p>
      </div>
      <div class="space-y-0.5 text-sm text-muted-foreground">
        <p>Recibo <span class="font-mono text-foreground">{{ payment.receipt_number }}</span></p>
        <p v-if="payment.description" class="truncate">{{ privacy.text(payment.description, 24) }}</p>
      </div>
      <div class="border-t pt-3"><PaymentRowActions :payment="payment" :downloading="downloading" @download="emit('download')" @delete="emit('delete')" /></div>
    </CardContent>
  </Card>
</template>
