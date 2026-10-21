<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Copy, KeyRound, Loader2, Pencil, QrCode, ShieldCheck, Trash2, XCircle } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { useConfirm } from '@/shared/composables/useConfirm'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { useDeleteMercadoPagoSettings, useMercadoPagoStatus } from '../queries'
import MercadoPagoCredentialsForm from './MercadoPagoCredentialsForm.vue'
import PixChargeDialog from './PixChargeDialog.vue'

const status = useMercadoPagoStatus()
const remove = useDeleteMercadoPagoSettings()
const { copy } = useClipboardToast()
const confirm = useConfirm()
const testing = ref(false)
const editing = ref(false)
const s = computed(() => status.data.value)
const connected = computed(() => !!s.value?.configured && !s.value.error)

// sem credenciais: já abre o formulário
watch(s, (v) => v && !v.configured && (editing.value = true), { immediate: true })

async function removeCredentials() {
  // depois de remover, o servidor diz se ainda há credenciais no .env; sem nenhuma, reabre o formulário
  if (await confirm({ title: 'Remover credenciais do Mercado Pago?', description: 'Novas cobranças Pix deixam de ser geradas até você salvar outras credenciais. As cobranças já criadas não são afetadas.', confirmText: 'Remover', destructive: true })) remove.mutate(undefined, { onSuccess: () => (editing.value = !status.data.value?.configured) })
}
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
        <div v-else-if="s" class="flex flex-wrap gap-1.5">
          <Badge v-if="connected" class="bg-success text-white"><CheckCircle2 class="size-3" />Conectado</Badge>
          <Badge v-else-if="s.error" variant="destructive"><XCircle class="size-3" />Erro na conexão</Badge>
          <Badge v-else variant="secondary"><XCircle class="size-3" />Não configurado</Badge>
          <Badge v-if="s.configured" variant="outline" :class="s.sandbox ? 'border-warning/40 text-warning' : 'border-success/40 text-success'">{{ s.sandbox ? 'Modo teste' : 'Produção' }}</Badge>
        </div>
      </div>

      <template v-if="s">
        <!-- conta conectada -->
        <div v-if="s.configured && !editing" class="space-y-3">
          <dl class="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">
            <div><dt class="text-xs text-muted-foreground">Conta</dt><dd class="font-medium">{{ s.account?.name || s.account?.nickname || '—' }}</dd></div>
            <div><dt class="text-xs text-muted-foreground">E-mail</dt><dd class="truncate font-medium">{{ s.account?.email || '—' }}</dd></div>
            <div><dt class="text-xs text-muted-foreground">Access Token</dt><dd class="flex items-center gap-1.5 font-mono text-xs"><KeyRound class="size-3.5 text-muted-foreground" />{{ s.access_token_hint }}</dd></div>
          </dl>
          <p v-if="s.error" class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{{ s.error }}</p>
          <p v-if="s.sandbox" class="flex items-start gap-1.5 rounded-lg bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle class="mt-0.5 size-3.5 shrink-0" /> Credenciais de teste: o Pix é gerado, mas não pode ser pago por um banco de verdade. Para receber de pacientes, use as credenciais de produção.
          </p>
          <p v-if="s.source === 'env'" class="text-xs text-muted-foreground">Credenciais vindas do servidor (.env). Salve outras aqui para substituir.</p>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" @click="editing = true"><Pencil /> Alterar credenciais</Button>
            <Button v-if="s.source === 'panel'" variant="ghost" class="text-destructive" :disabled="remove.isPending.value" @click="removeCredentials"><Trash2 /> Remover</Button>
          </div>
        </div>

        <!-- formulário -->
        <div v-else class="space-y-2">
          <p class="text-sm text-muted-foreground">
            No <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener" class="font-medium text-brand-700 underline">painel de desenvolvedor do Mercado Pago</a>, abra sua aplicação → <strong>Credenciais</strong> e cole aqui. Use as de <strong>teste</strong> para experimentar e as de <strong>produção</strong> para receber de verdade.
          </p>
          <MercadoPagoCredentialsForm :key="s.access_token_hint ?? 'novo'" :status="s" @saved="editing = false" @cancel="editing = false" />
        </div>

        <!-- webhook -->
        <div class="space-y-1.5">
          <p class="text-sm font-medium">URL do webhook (evento: Order (Mercado Pago))</p>
          <div v-if="s.webhook_url" class="flex gap-2">
            <code class="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-xs">{{ s.webhook_url }}</code>
            <Button variant="outline" size="icon" aria-label="Copiar URL do webhook" @click="copy(s.webhook_url!, 'URL copiada!', 'Cole em Suas integrações → Webhooks')"><Copy /></Button>
          </div>
          <p v-else class="flex items-start gap-1.5 text-xs text-muted-foreground"><AlertTriangle class="mt-0.5 size-3.5 shrink-0 text-warning" /> Sem URL pública (https) neste ambiente: a confirmação do pagamento é feita consultando o Mercado Pago a cada poucos segundos.</p>
          <p class="flex items-center gap-1.5 text-xs" :class="s.webhook_signature ? 'text-success' : 'text-muted-foreground'">
            <ShieldCheck class="size-3.5" /> {{ s.webhook_signature ? 'Assinatura do webhook configurada (avisos falsos são recusados)' : 'Sem assinatura secreta: o status é sempre confirmado na API antes de ser aplicado' }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 border-t pt-4">
          <Button :disabled="!connected" @click="testing = true"><QrCode /> Gerar Pix de teste</Button>
        </div>
      </template>
    </div>
    <PixChargeDialog v-model:open="testing" title="Pix de teste" :amount="1" description="Teste de integração Pix" />
  </SectionCard>
</template>
