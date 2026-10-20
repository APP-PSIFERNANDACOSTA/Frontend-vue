<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Copy, Loader2, QrCode, ShieldCheck, XCircle } from '@lucide/vue'
import { ref } from 'vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useMercadoPagoStatus } from '../queries'
import PixChargeDialog from './PixChargeDialog.vue'

const status = useMercadoPagoStatus()
const { copy } = useClipboardToast()
const testing = ref(false)
</script>

<template>
  <SectionCard>
    <div class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex size-12 items-center justify-center rounded-xl bg-info/10"><QrCode class="size-6 text-info" /></span>
          <div><h2 class="text-lg font-semibold">Mercado Pago · Pix</h2><p class="text-sm text-muted-foreground">Receba por Pix com confirmação automática do pagamento</p></div>
        </div>
        <Loader2 v-if="status.isPending.value" class="size-5 animate-spin text-muted-foreground" />
        <div v-else class="flex flex-wrap gap-1.5">
          <Badge v-if="status.data.value?.configured && !status.data.value.error" class="bg-success text-white"><CheckCircle2 class="size-3" />Conectado</Badge>
          <Badge v-else-if="status.data.value?.error" variant="destructive"><XCircle class="size-3" />Erro na conexão</Badge>
          <Badge v-else variant="secondary"><XCircle class="size-3" />Não configurado</Badge>
          <Badge v-if="status.data.value?.configured" variant="outline">{{ status.data.value.sandbox ? 'Modo teste' : 'Produção' }}</Badge>
        </div>
      </div>

      <template v-if="status.data.value">
        <dl v-if="status.data.value.account" class="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt class="text-xs text-muted-foreground">Conta</dt><dd class="font-medium">{{ status.data.value.account.name || status.data.value.account.nickname }}</dd></div>
          <div><dt class="text-xs text-muted-foreground">E-mail</dt><dd class="font-medium">{{ status.data.value.account.email || '—' }}</dd></div>
        </dl>

        <p v-if="status.data.value.error" class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{{ status.data.value.error }}</p>

        <div v-if="!status.data.value.configured" class="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
          <p class="font-medium">Como conectar</p>
          <ol class="list-inside list-decimal space-y-1 text-muted-foreground">
            <li>No <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener" class="font-medium text-brand-700 underline">painel de desenvolvedor</a>, crie uma aplicação (pagamentos online).</li>
            <li>Copie o <strong>Access Token</strong> (de teste ou de produção).</li>
            <li>No servidor, defina <code class="rounded bg-muted px-1">MERCADOPAGO_ACCESS_TOKEN</code> no <code class="rounded bg-muted px-1">.env</code> do backend.</li>
            <li>Configure o webhook (abaixo) e a <code class="rounded bg-muted px-1">MERCADOPAGO_WEBHOOK_SECRET</code>.</li>
          </ol>
        </div>

        <div class="space-y-1.5">
          <p class="text-sm font-medium">URL do webhook (evento: Pagamentos)</p>
          <div v-if="status.data.value.webhook_url" class="flex gap-2">
            <code class="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-xs">{{ status.data.value.webhook_url }}</code>
            <Button variant="outline" size="icon" aria-label="Copiar URL do webhook" @click="copy(status.data.value.webhook_url!, 'URL copiada!')"><Copy /></Button>
          </div>
          <p v-else class="flex items-start gap-1.5 text-xs text-muted-foreground"><AlertTriangle class="mt-0.5 size-3.5 shrink-0 text-warning" /> Sem URL pública (https) neste ambiente: a confirmação do pagamento é feita consultando o Mercado Pago a cada poucos segundos.</p>
          <p class="flex items-center gap-1.5 text-xs" :class="status.data.value.webhook_signature ? 'text-success' : 'text-muted-foreground'">
            <ShieldCheck class="size-3.5" /> {{ status.data.value.webhook_signature ? 'Assinatura do webhook validada (x-signature)' : 'Assinatura secreta não configurada: o status é sempre confirmado na API antes de ser aplicado' }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 border-t pt-4">
          <Button :disabled="!status.data.value.configured || !!status.data.value.error" @click="testing = true"><QrCode /> Gerar Pix de teste</Button>
        </div>
      </template>
    </div>
    <PixChargeDialog v-model:open="testing" title="Pix de teste" :amount="1" description="Teste de integração Pix" />
  </SectionCard>
</template>
