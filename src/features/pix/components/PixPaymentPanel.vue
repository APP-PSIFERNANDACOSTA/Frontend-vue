<script setup lang="ts">
/**
 * Mostra uma cobrança Pix para pagar: valor, QR Code, copia e cola, validade e status ao vivo.
 * Mesmo componente no link público, no portal do paciente e no modal da psicóloga.
 */
import { CheckCircle2, Copy, Loader2, RefreshCw, TimerOff } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { PIX_STATUS } from '../status'
import type { PayableCharge } from '../types'

const props = defineProps<{ charge: PayableCharge; refreshing?: boolean; renewing?: boolean; hideHeader?: boolean }>()
defineEmits<{ refresh: []; renew: [] }>()
const { copy } = useClipboardToast()

const now = ref(Date.now())
useIntervalFn(() => (now.value = Date.now()), 1000)
const expiresIn = computed(() => {
  const ms = props.charge.expires_at ? +new Date(props.charge.expires_at) - now.value : 0
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}:${String(s).padStart(2, '0')}`
})
const qrSrc = computed(() => (props.charge.qr_code_base64 ? `data:image/png;base64,${props.charge.qr_code_base64}` : ''))
const paidAt = computed(() => (props.charge.paid_at ? new Date(props.charge.paid_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''))
const st = computed(() => PIX_STATUS[props.charge.status])
</script>

<template>
  <div class="space-y-4 text-center">
    <div v-if="!hideHeader">
      <p class="text-3xl font-bold tabular-nums">{{ formatMoney(charge.amount) }}</p>
      <p class="text-sm text-muted-foreground">{{ charge.description }}</p>
      <span :class="['mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', st.class]">
        <Loader2 v-if="charge.status === 'pending'" class="size-3 animate-spin" />{{ st.label }}
      </span>
    </div>

    <!-- aguardando -->
    <template v-if="charge.status === 'pending'">
      <img v-if="qrSrc" :src="qrSrc" alt="QR Code Pix" class="mx-auto size-56 rounded-xl border bg-white p-2" />
      <div v-if="charge.qr_code" class="space-y-1.5 text-left">
        <p class="text-xs font-medium text-muted-foreground">Pix copia e cola</p>
        <div class="flex gap-2">
          <input :value="charge.qr_code" readonly aria-label="Código Pix copia e cola" class="h-10 min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-3 font-mono text-xs" @focus="($event.target as HTMLInputElement).select()" />
          <Button class="h-10 shrink-0" @click="copy(charge.qr_code!, 'Código Pix copiado!', 'Cole no app do seu banco, na área Pix')"><Copy /> Copiar</Button>
        </div>
      </div>
      <ol class="mx-auto max-w-xs space-y-1 text-left text-xs text-muted-foreground">
        <li>1. Abra o app do seu banco e escolha <strong class="text-foreground">Pix</strong>.</li>
        <li>2. Leia o QR Code ou use <strong class="text-foreground">Pix copia e cola</strong>.</li>
        <li>3. Confirme o pagamento. Esta tela atualiza sozinha.</li>
      </ol>
      <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span v-if="expiresIn">Válido por <strong class="tabular-nums text-foreground">{{ expiresIn }}</strong></span>
        <button type="button" class="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline disabled:opacity-50" :disabled="refreshing" @click="$emit('refresh')"><RefreshCw :class="['size-3.5', refreshing && 'animate-spin']" /> Já paguei, verificar</button>
      </div>
    </template>

    <!-- pago -->
    <div v-else-if="charge.status === 'paid'" class="rounded-2xl border border-success/30 bg-success/10 p-5">
      <CheckCircle2 class="mx-auto mb-2 size-12 text-success" />
      <p class="text-lg font-semibold">Pagamento confirmado!</p>
      <p v-if="paidAt" class="text-sm text-muted-foreground">Recebido em {{ paidAt }}</p>
    </div>

    <!-- QR venceu: gera outro na mesma cobrança -->
    <div v-else-if="charge.can_renew" class="space-y-3 rounded-2xl border border-dashed p-5">
      <TimerOff class="mx-auto size-9 text-muted-foreground" />
      <p class="font-medium">O código Pix expirou</p>
      <p class="text-sm text-muted-foreground">Gere um novo código para pagar o mesmo valor.</p>
      <Button :disabled="renewing" @click="$emit('renew')"><Loader2 v-if="renewing" class="animate-spin" /><RefreshCw v-else /> Gerar novo Pix</Button>
    </div>

    <p v-else class="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Esta cobrança foi {{ st.label.toLowerCase() }} e não pode mais ser paga.</p>
  </div>
</template>
