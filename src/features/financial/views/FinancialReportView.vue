<script setup lang="ts">
import { CalendarDays, CalendarRange, DollarSign, Download, Eye, FileText, Loader2, Receipt, TrendingDown, TrendingUp, Wallet } from '@lucide/vue'
import { computed, ref } from 'vue'
import { PAYMENT_METHOD_MAP } from '@/features/payments/constants'
import { useDownloadReceipt } from '@/features/payments/queries'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/types'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatCard from '@/shared/components/StatCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate, formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import { useFinancialReport, useProjections, type Period } from '../queries'

const privacy = usePrivacyMode()
const search = ref('')
const period = ref<Period>('current_month')
const method = ref('all')

const report = useFinancialReport(period, method)
const proj = useProjections()
const download = useDownloadReceipt()

const payments = computed(() => report.data.value?.payments ?? [])
const expenses = computed(() => report.data.value?.expenses ?? [])
const received = computed(() => payments.value.reduce((s, p) => s + Number(p.amount), 0))
const paidExpenses = computed(() => Number(report.data.value?.summary?.cash.total_paid_expenses ?? 0))
const netProfit = computed(() => (report.data.value?.summary ? Number(report.data.value.summary.cash.net_profit) : received.value))

const money = (v: number) => (privacy.enabled.value ? 'R$ •••' : formatMoney(v))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? payments.value.filter((p) => p.patient?.name.toLowerCase().includes(q) || p.receipt_number.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) : payments.value
})
const byMethod = computed(() => {
  const acc: Record<string, { count: number; total: number }> = {}
  for (const p of payments.value) (acc[p.payment_method] ??= { count: 0, total: 0 }), (acc[p.payment_method].count++, (acc[p.payment_method].total += Number(p.amount)))
  return Object.entries(acc)
})
const activeCount = computed(() => [period.value !== 'current_month', method.value !== 'all'].filter(Boolean).length)
const clear = () => ((search.value = ''), (period.value = 'current_month'), (method.value = 'all'))
const projectionCards = computed(() => [
  { label: 'Média semanal (estimada)', value: proj.data.value?.weekly, icon: CalendarDays },
  { label: 'Projeção quinzenal (15 dias)', value: proj.data.value?.fortnight, icon: CalendarRange },
  { label: 'Projeção mensal (30 dias)', value: proj.data.value?.monthly, icon: TrendingUp },
  { label: 'Potencial do mês (dia 1 ao fim)', value: proj.data.value?.currentMonth, icon: Wallet },
])
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Relatório financeiro" description="Acompanhe seus recebimentos e análise financeira" />

    <FilterBar v-model:search="search" search-placeholder="Buscar por paciente, recibo ou descrição..." :active-count="activeCount" storage-key="financial-filters-open" @clear="clear">
      <FormField label="Período">
        <Select v-model="period">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Este mês</SelectItem><SelectItem value="last_month">Mês anterior</SelectItem>
            <SelectItem value="current_year">Este ano</SelectItem><SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Método de pagamento">
        <Select v-model="method">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem v-for="(label, value) in PAYMENT_METHOD_LABELS" :key="value" :value="value">{{ label }}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </FilterBar>

    <section class="space-y-3">
      <h2 class="font-semibold">Projeção por contratos assinados</h2>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard v-for="c in projectionCards" :key="c.label" :label="c.label" :icon="c.icon" :loading="proj.isPending.value" :value="proj.isError.value ? '—' : money(c.value ?? 0)" :hint="proj.isError.value ? 'Indisponível' : undefined" />
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="font-semibold">Caixa do período</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <StatCard label="Entradas recebidas" :icon="TrendingUp" :loading="report.isPending.value" :value="money(received)" />
        <StatCard label="Saídas pagas" :icon="TrendingDown" :loading="report.isPending.value" :value="money(paidExpenses)" />
        <StatCard label="Lucro líquido real" :icon="DollarSign" :loading="report.isPending.value" :value="money(netProfit)" hint="Entradas recebidas − saídas pagas" />
      </div>
    </section>

    <SectionCard v-if="byMethod.length" title="Recebimentos por método de pagamento">
      <div class="grid gap-3 sm:grid-cols-3">
        <div v-for="[m, d] in byMethod" :key="m" class="rounded-xl border p-4">
          <StatusBadge :status="m" :map="PAYMENT_METHOD_MAP" />
          <p class="mt-2 text-2xl font-bold">{{ money(d.total) }}</p>
          <p class="text-sm text-muted-foreground">{{ d.count }} pagamento{{ d.count !== 1 ? 's' : '' }}</p>
        </div>
      </div>
    </SectionCard>

    <div class="grid gap-6 xl:grid-cols-5">
      <SectionCard title="Histórico de pagamentos" class="xl:col-span-3">
        <div v-if="report.isPending.value" class="space-y-3"><Skeleton v-for="n in 4" :key="n" class="h-16 w-full" /></div>
        <EmptyState v-else-if="!filtered.length" :icon="FileText" title="Nenhum pagamento encontrado" :description="search || activeCount ? 'Nenhum pagamento corresponde aos filtros.' : 'Não há pagamentos neste período.'" />
        <ul v-else class="divide-y">
          <li v-for="p in filtered" :key="p.id" class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2"><p class="truncate font-medium">{{ p.patient?.name ? privacy.name(p.patient.name) : 'N/A' }}</p><StatusBadge :status="p.payment_method" :map="PAYMENT_METHOD_MAP" /></div>
              <p class="text-sm text-muted-foreground">{{ formatDate(p.payment_date, "dd 'de' MMMM 'de' yyyy") }} · <span class="font-mono text-xs">{{ p.receipt_number }}</span></p>
              <p v-if="p.description" class="truncate text-sm text-muted-foreground">{{ privacy.text(p.description, 20) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <p class="font-bold text-success">{{ privacy.money(p.amount) }}</p>
              <Button v-if="p.pdf_path" variant="outline" size="icon" class="size-8" aria-label="Baixar recibo" :disabled="download.isPending.value && download.variables.value === p.id" @click="download.mutate(p.id)">
                <Loader2 v-if="download.isPending.value && download.variables.value === p.id" class="animate-spin" /><Download v-else />
              </Button>
              <Button variant="outline" size="icon" class="size-8" aria-label="Ver pagamento" as-child><RouterLink :to="`/dashboard/payments/${p.id}`"><Eye /></RouterLink></Button>
            </div>
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="Custos de saída" :icon="Receipt" class="xl:col-span-2">
        <Skeleton v-if="report.isPending.value" class="h-24 w-full" />
        <p v-else-if="!expenses.length" class="text-sm text-muted-foreground">Nenhum custo lançado para este período.</p>
        <ul v-else class="divide-y">
          <li v-for="e in expenses" :key="e.id" class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div class="min-w-0"><p class="truncate font-medium">{{ e.title }}</p><p class="truncate text-sm text-muted-foreground">{{ e.description }}</p><p v-if="e.payment_date" class="text-xs text-muted-foreground">Pago em {{ formatDate(e.payment_date) }}</p></div>
            <div class="shrink-0 text-right"><StatusBadge tone="success" label="Pago" /><p class="mt-1 font-semibold text-destructive">{{ privacy.money(e.amount) }}</p></div>
          </li>
        </ul>
      </SectionCard>
    </div>
  </div>
</template>
