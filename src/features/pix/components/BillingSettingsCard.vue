<script setup lang="ts">
/**
 * Chave liga/desliga das cobranças automáticas. Ligar já analisa a agenda e gera o que for devido no mês
 * (de hoje em diante); desligar só para de gerar — as cobranças existentes continuam valendo.
 */
import { AlertTriangle, CalendarClock, Loader2 } from '@lucide/vue'
import { computed } from 'vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { formatDate, formatMoney } from '@/shared/lib/format'
import { Switch } from '@/shared/ui/switch'
import { useBillingSettings, useSaveBillingSettings } from '../queries'

const settings = useBillingSettings()
const save = useSaveBillingSettings()
const s = computed(() => settings.data.value)
const enabled = computed(() => !!s.value?.enabled)

function toggle(on: boolean) {
  if (save.isPending.value) return
  save.mutate({ enabled: on })
}
</script>

<template>
  <SectionCard>
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-50"><CalendarClock class="size-6 text-brand-600" /></span>
          <div>
            <h2 class="text-lg font-semibold">Cobranças automáticas</h2>
            <p class="text-sm text-muted-foreground">Gera as cobranças de cada paciente a partir da agenda e da forma de pagamento</p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2 pt-1">
          <Loader2 v-if="settings.isPending.value || save.isPending.value" class="size-4 animate-spin text-muted-foreground" />
          <span class="text-sm font-medium" :class="enabled ? 'text-success' : 'text-muted-foreground'">{{ enabled ? 'Ligadas' : 'Desligadas' }}</span>
          <Switch :model-value="enabled" :disabled="settings.isPending.value || save.isPending.value" aria-label="Ligar ou desligar as cobranças automáticas" @update:model-value="toggle" />
        </div>
      </div>

      <p v-if="save.isPending.value && !enabled" class="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">Analisando a agenda e gerando as cobranças…</p>
      <div v-else-if="s?.enabled" class="rounded-xl border bg-muted/30 p-4 text-sm">
        Valendo desde <strong>{{ formatDate(s.starts_on) }}</strong> · <strong>{{ s.open_count }}</strong> em aberto ({{ formatMoney(s.open_total) }})
      </div>
      <p v-else-if="s" class="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Ao ligar, a agenda é analisada na hora e as cobranças do mês são geradas de hoje em diante. Desligar só para de gerar novas.
      </p>

      <ul class="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <li class="rounded-lg border p-3"><strong class="block text-foreground">Por sessão</strong>Uma cobrança por sessão do mês, vencendo no dia do atendimento.</li>
        <li class="rounded-lg border p-3"><strong class="block text-foreground">Mensal</strong>Uma por mês (sessões do mês × valor), no dia escolhido pelo paciente.</li>
        <li class="rounded-lg border p-3"><strong class="block text-foreground">Quinzenal</strong>A cada 14 dias a partir da 1ª sessão, vencendo no dia da sessão.</li>
      </ul>
      <p class="text-xs text-muted-foreground">Cada mês é gerado quando chega. Sessões novas, remarcadas ou canceladas atualizam as cobranças em aberto; as pagas ou editadas à mão não mudam. Desligar e ligar de novo não altera o que já foi gerado.</p>

      <p v-if="s && (s.patients_without_price || s.monthly_without_day)" class="flex items-start gap-1.5 rounded-lg bg-warning/10 p-3 text-xs text-warning">
        <AlertTriangle class="mt-0.5 size-3.5 shrink-0" />
        <span>
          <template v-if="s.patients_without_price">{{ s.patients_without_price }} paciente(s) ativo(s) sem valor da sessão não terão cobrança. </template>
          <template v-if="s.monthly_without_day">{{ s.monthly_without_day }} paciente(s) mensal sem dia de pagamento: usaremos o dia 10.</template>
        </span>
      </p>
    </div>
  </SectionCard>
</template>
