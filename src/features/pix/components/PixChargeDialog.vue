<script setup lang="ts">
/**
 * Gera uma cobrança Pix (Mercado Pago) e acompanha o pagamento: QR Code, copia e cola e status ao vivo.
 * Reutilizável: aceita paciente/valor/descrição pré-preenchidos.
 */
import { CheckCircle2, Copy, Loader2, QrCode, RefreshCw, XCircle } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { computed, reactive, ref, watch } from 'vue'
import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import { useActivePatients } from '@/features/patients/queries'
import FormField from '@/shared/components/FormField.vue'
import MoneyInput from '@/shared/components/MoneyInput.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { formatMoney } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useCancelPixCharge, useCreatePixCharge, usePixCharge } from '../queries'
import { PIX_STATUS } from '../status'
import type { PixCharge } from '../types'

const props = defineProps<{ patientId?: number | null; amount?: number; description?: string; title?: string }>()
const emit = defineEmits<{ paid: [charge: PixCharge] }>()
const open = defineModel<boolean>('open', { default: false })

const { copy } = useClipboardToast()
const patients = useActivePatients()
const form = reactive({ patient_id: null as number | null, amount: undefined as number | undefined, description: '', payer_email: '' })
const created = ref<PixCharge | null>(null)
const chargeId = computed(() => created.value?.id ?? null)
const charge = usePixCharge(chargeId, created)
const current = computed(() => charge.data.value ?? created.value)
const patientEmail = computed(() => patients.data.value?.find((p) => p.id === form.patient_id)?.email || '')

const create = useCreatePixCharge((c) => (created.value = c))
const cancel = useCancelPixCharge()

// reabre limpo, com os valores sugeridos por quem chamou
watch(open, (o) => {
  if (!o) return
  created.value = null
  Object.assign(form, { patient_id: props.patientId ?? null, amount: props.amount, description: props.description ?? '', payer_email: '' })
})

let notifiedPaid = false
watch(() => current.value?.status, (s) => {
  if (s === 'paid' && current.value && !notifiedPaid) {
    notifiedPaid = true
    notify.success('Pix recebido!', `${formatMoney(current.value.amount)} confirmado pelo Mercado Pago`)
    emit('paid', current.value)
  }
  if (s === 'pending') notifiedPaid = false
})

function submit() {
  if (!form.amount || form.amount <= 0) return notify.error('Valor inválido', 'Informe um valor maior que zero')
  const email = form.payer_email.trim() || patientEmail.value
  if (!email) return notify.error('E-mail obrigatório', 'O Mercado Pago exige o e-mail de quem vai pagar')
  create.mutate({ amount: form.amount, description: form.description.trim() || undefined, patient_id: form.patient_id, payer_email: email })
}

// contagem até expirar
const now = ref(Date.now())
useIntervalFn(() => (now.value = Date.now()), 1000)
const expiresIn = computed(() => {
  const exp = current.value?.expires_at ? +new Date(current.value.expires_at) - now.value : 0
  if (exp <= 0) return ''
  const h = Math.floor(exp / 3_600_000)
  const m = Math.floor((exp % 3_600_000) / 60_000)
  const s = Math.floor((exp % 60_000) / 1000)
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}:${String(s).padStart(2, '0')}`
})
const qrSrc = computed(() => (current.value?.qr_code_base64 ? `data:image/png;base64,${current.value.qr_code_base64}` : ''))
</script>

<template>
  <ResponsiveDialog v-model:open="open" :title="title ?? 'Cobrar via Pix'" :description="current ? undefined : 'Gera um QR Code Pix pelo Mercado Pago. A confirmação do pagamento é automática.'" content-class="sm:max-w-md">
    <!-- 1) dados da cobrança -->
    <form v-if="!current" class="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0" @submit.prevent="submit">
      <FormField label="Paciente (opcional)">
        <PatientSelect v-model="form.patient_id" clearable clear-label="Sem paciente" />
      </FormField>
      <FormField v-slot="{ id }" label="Valor" required><MoneyInput :id="id" v-model="form.amount" required /></FormField>
      <FormField v-slot="{ id }" label="Descrição" hint="Aparece para quem paga no app do banco."><Input :id="id" v-model="form.description" maxlength="255" placeholder="Ex.: Sessão de 20/10" /></FormField>
      <FormField v-slot="{ id }" label="E-mail do pagador" :hint="patientEmail ? `Se vazio, usa ${patientEmail}` : 'Obrigatório pelo Mercado Pago'">
        <Input :id="id" v-model="form.payer_email" type="email" :placeholder="patientEmail || 'paciente@email.com'" />
      </FormField>
      <Button type="submit" class="w-full" :disabled="create.isPending.value"><Loader2 v-if="create.isPending.value" class="animate-spin" /><QrCode v-else /> Gerar Pix</Button>
    </form>

    <!-- 2) pagamento -->
    <div v-else class="space-y-4 px-4 pb-4 text-center sm:px-0 sm:pb-0">
      <div>
        <p class="text-3xl font-bold tabular-nums">{{ formatMoney(current.amount) }}</p>
        <p class="truncate text-sm text-muted-foreground">{{ current.description }}</p>
        <span :class="['mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', PIX_STATUS[current.status].class]">
          <Loader2 v-if="current.status === 'pending'" class="size-3 animate-spin" />{{ PIX_STATUS[current.status].label }}
        </span>
      </div>

      <template v-if="current.status === 'pending'">
        <img v-if="qrSrc" :src="qrSrc" alt="QR Code Pix" class="mx-auto size-56 rounded-xl border bg-white p-2" />
        <div v-if="current.qr_code" class="space-y-1.5 text-left">
          <p class="text-xs font-medium text-muted-foreground">Pix copia e cola</p>
          <div class="flex gap-2">
            <Input :model-value="current.qr_code" readonly class="font-mono text-xs" @focus="($event.target as HTMLInputElement).select()" />
            <Button variant="outline" size="icon" aria-label="Copiar código Pix" @click="copy(current.qr_code!, 'Código Pix copiado!')"><Copy /></Button>
          </div>
        </div>
        <p v-if="expiresIn" class="text-xs text-muted-foreground">Expira em <strong class="tabular-nums text-foreground">{{ expiresIn }}</strong> · o status atualiza sozinho</p>
        <div class="flex justify-center gap-2">
          <Button variant="ghost" size="sm" :disabled="charge.isFetching.value" @click="charge.refetch()"><RefreshCw :class="charge.isFetching.value && 'animate-spin'" /> Verificar agora</Button>
          <Button variant="ghost" size="sm" class="text-destructive" :disabled="cancel.isPending.value" @click="cancel.mutate(current.id)"><XCircle /> Cancelar cobrança</Button>
        </div>
      </template>

      <div v-else-if="current.status === 'paid'" class="rounded-2xl border border-success/30 bg-success/10 p-5">
        <CheckCircle2 class="mx-auto mb-2 size-10 text-success" />
        <p class="font-semibold">Pagamento confirmado</p>
        <p v-if="current.paid_at" class="text-sm text-muted-foreground">em {{ new Date(current.paid_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }}</p>
      </div>

      <p v-else class="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Esta cobrança não pode mais ser paga. Gere uma nova se precisar.</p>

      <Button v-if="current.status !== 'pending'" variant="outline" class="w-full" @click="created = null">Gerar outra cobrança</Button>
    </div>
  </ResponsiveDialog>
</template>
