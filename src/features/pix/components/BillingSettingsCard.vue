<script setup lang="ts">
/** Liga/desliga as cobranças automáticas a partir da agenda (por sessão / mensal / quinzenal). */
import { AlertTriangle, CalendarClock, Loader2 } from '@lucide/vue'
import { ref } from 'vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { formatDate, formatMoney } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useBillingSettings, useSaveBillingSettings } from '../queries'

const settings = useBillingSettings()
const save = useSaveBillingSettings()
const confirm = useConfirm()
const start = ref<'today' | 'next_month'>('today')

async function disable() {
  if (await confirm({ title: 'Desligar cobranças automáticas?', description: 'Nenhuma cobrança nova será gerada. As que já existem continuam em aberto até serem pagas ou canceladas.', confirmText: 'Desligar', destructive: true })) save.mutate({ enabled: false })
}
</script>

<template>
  <SectionCard>
    <div class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex size-12 items-center justify-center rounded-xl bg-brand-50"><CalendarClock class="size-6 text-brand-600" /></span>
          <div><h2 class="text-lg font-semibold">Cobranças automáticas</h2><p class="text-sm text-muted-foreground">Gera as cobranças de cada paciente a partir da agenda e da forma de pagamento</p></div>
        </div>
        <Loader2 v-if="settings.isPending.value" class="size-5 animate-spin text-muted-foreground" />
        <Badge v-else-if="settings.data.value?.enabled" class="bg-success text-white">Ligadas</Badge>
        <Badge v-else variant="secondary">Desligadas</Badge>
      </div>

      <ul class="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <li class="rounded-lg border p-3"><strong class="block text-foreground">Por sessão</strong>Uma cobrança por sessão do mês, vencendo no dia do atendimento.</li>
        <li class="rounded-lg border p-3"><strong class="block text-foreground">Mensal</strong>Uma por mês (sessões do mês × valor), no dia escolhido pelo paciente.</li>
        <li class="rounded-lg border p-3"><strong class="block text-foreground">Quinzenal</strong>A cada 14 dias a partir da 1ª sessão, vencendo no dia da sessão.</li>
      </ul>
      <p class="text-xs text-muted-foreground">Cada mês é gerado quando chega. Sessões novas, remarcadas ou canceladas atualizam as cobranças em aberto; as pagas ou editadas à mão não mudam.</p>

      <template v-if="settings.data.value">
        <div v-if="settings.data.value.enabled" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <p>Ligadas desde <strong>{{ formatDate(settings.data.value.starts_on) }}</strong> · {{ settings.data.value.open_count }} em aberto ({{ formatMoney(settings.data.value.open_total) }})</p>
          <Button variant="ghost" class="text-destructive" :disabled="save.isPending.value" @click="disable">Desligar</Button>
        </div>
        <div v-else class="space-y-3 rounded-xl border bg-muted/30 p-4">
          <p class="text-sm font-medium">Começar a gerar:</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <label :class="['flex cursor-pointer gap-3 rounded-lg border bg-background p-3 text-sm', start === 'today' && 'border-brand-500 ring-1 ring-brand-500']">
              <input v-model="start" type="radio" value="today" class="mt-1 accent-brand-600" />
              <span><strong class="block">A partir de hoje</strong><span class="text-muted-foreground">Cobra as sessões de hoje em diante (o restante deste mês).</span></span>
            </label>
            <label :class="['flex cursor-pointer gap-3 rounded-lg border bg-background p-3 text-sm', start === 'next_month' && 'border-brand-500 ring-1 ring-brand-500']">
              <input v-model="start" type="radio" value="next_month" class="mt-1 accent-brand-600" />
              <span><strong class="block">A partir do próximo mês</strong><span class="text-muted-foreground">Bom se você já cobrou este mês por fora.</span></span>
            </label>
          </div>
          <Button :disabled="save.isPending.value" @click="save.mutate({ enabled: true, start })"><Loader2 v-if="save.isPending.value" class="animate-spin" /> Ligar cobranças automáticas</Button>
        </div>

        <p v-if="settings.data.value.patients_without_price || settings.data.value.monthly_without_day" class="flex items-start gap-1.5 rounded-lg bg-warning/10 p-3 text-xs text-warning">
          <AlertTriangle class="mt-0.5 size-3.5 shrink-0" />
          <span>
            <template v-if="settings.data.value.patients_without_price">{{ settings.data.value.patients_without_price }} paciente(s) ativo(s) sem valor da sessão não terão cobrança. </template>
            <template v-if="settings.data.value.monthly_without_day">{{ settings.data.value.monthly_without_day }} paciente(s) mensal sem dia de pagamento: usaremos o dia 10.</template>
          </span>
        </p>
      </template>
    </div>
  </SectionCard>
</template>
