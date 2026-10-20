<script setup lang="ts">
import { Calendar, CheckCircle2, DollarSign, Download, Eye, FileText, Loader2 } from '@lucide/vue'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed, ref } from 'vue'
import { useDownloadMyHealthReceipt, useDownloadMyReceipt, useMyPayments } from '@/features/payments/queries'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/types'
import { useMySessions } from '@/features/sessions/queries'
import MyPixCharges from '@/features/pix/components/MyPixCharges.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatCard from '@/shared/components/StatCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatCpf, formatDate, formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const payments = useMyPayments()
const sessions = useMySessions()
const receipt = useDownloadMyReceipt()
const healthReceipt = useDownloadMyHealthReceipt()

const month = ref('all')
const all = computed(() => payments.data.value ?? [])
const monthKey = (iso: string) => iso.slice(0, 7)
const months = computed(() => [...new Set(all.value.map((p) => monthKey(p.payment_date)))].sort().reverse())
const monthLabel = (m: string) => {
  const l = format(new Date(`${m}-01T00:00:00`), 'MMMM yyyy', { locale: ptBR })
  return l.charAt(0).toUpperCase() + l.slice(1)
}
const visible = computed(() =>
  all.value.filter((p) => month.value === 'all' || monthKey(p.payment_date) === month.value).sort((a, b) => +new Date(b.payment_date) - +new Date(a.payment_date)),
)
const doneSessions = computed(() => (sessions.data.value ?? []).filter((s) => s.status === 'completed').length)
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">Acompanhe seus pagamentos e recibos</p>

    <MyPixCharges />

    <div class="grid grid-cols-2 gap-3">
      <StatCard label="Sessões feitas" :value="doneSessions" :icon="Calendar" :loading="sessions.isPending.value" />
      <StatCard label="Pagamentos" :value="all.length" :icon="CheckCircle2" :loading="payments.isPending.value" />
    </div>

    <div class="flex items-center justify-between gap-3">
      <h2 class="font-semibold">Histórico</h2>
      <Select v-model="month">
        <SelectTrigger class="h-10 w-48" aria-label="Filtrar por mês"><SelectValue placeholder="Todos os meses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os meses</SelectItem>
          <SelectItem v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <QueryState :query="payments" :empty="visible.length === 0">
      <template #empty><EmptyState :icon="FileText" title="Nenhum pagamento encontrado" description="Você ainda não possui pagamentos registrados." /></template>

      <article v-for="p in visible" :key="p.id" class="space-y-3 rounded-2xl border bg-card p-4 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium leading-snug">{{ p.description || 'Pagamento de sessão' }}</p>
            <p class="mt-0.5 text-sm text-muted-foreground">{{ formatDate(p.payment_date, "dd 'de' MMMM 'de' yyyy") }} · {{ PAYMENT_METHOD_LABELS[p.payment_method] }}</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="font-semibold">{{ formatMoney(p.amount) }}</p>
            <StatusBadge class="mt-1" tone="success" label="Pago" />
          </div>
        </div>
        <p v-if="p.receipt_number || p.patient?.cpf" class="space-x-3 text-xs text-muted-foreground">
          <span v-if="p.receipt_number">Recibo: {{ p.receipt_number }}</span>
          <span v-if="p.patient?.cpf">CPF: {{ formatCpf(p.patient.cpf) }}</span>
        </p>
        <div v-if="p.pdf_path || p.health_receipt?.available || p.health_receipt?.status === 'pending'" class="flex flex-wrap gap-2 border-t pt-3">
          <Button v-if="p.pdf_path" variant="outline" class="h-10 flex-1" :disabled="receipt.isPending.value && receipt.variables.value === p.id" @click="receipt.mutate(p.id)">
            <Loader2 v-if="receipt.isPending.value && receipt.variables.value === p.id" class="animate-spin" /><Eye v-else /> Recibo
          </Button>
          <Button v-if="p.health_receipt?.available" variant="outline" class="h-10 flex-1" :disabled="healthReceipt.isPending.value && healthReceipt.variables.value === p.id" @click="healthReceipt.mutate(p.id)">
            <Loader2 v-if="healthReceipt.isPending.value && healthReceipt.variables.value === p.id" class="animate-spin" /><Download v-else /> Recibo de saúde
          </Button>
          <StatusBadge v-else-if="p.health_receipt?.status === 'pending'" tone="warning" label="Recibo de saúde em emissão" class="h-10" />
        </div>
      </article>
    </QueryState>

    <SectionCard title="Formas de pagamento" :icon="DollarSign" class="border-brand-200 bg-brand-50">
      <p class="text-sm text-muted-foreground">O pagamento semanal deve ser realizado em até 30 minutos antes da sessão e pagamentos mensais, no dia acordado. Pode ser feito via PIX ou transferência bancária.</p>
    </SectionCard>
  </div>
</template>
