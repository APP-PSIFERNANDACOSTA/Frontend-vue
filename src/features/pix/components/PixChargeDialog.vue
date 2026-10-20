<script setup lang="ts">
/**
 * Cria uma cobrança Pix (Mercado Pago) e mostra o pagamento: QR, copia e cola, status ao vivo
 * e o link público para mandar ao paciente (copiar ou WhatsApp).
 * Com `patientId` fixo (perfil do paciente), não pede paciente nem e-mail.
 */
import { Link2, Loader2, MessageCircle, QrCode, XCircle } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
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
import { pixApi, pixPaymentLink } from '../api'
import { pixKeys, useCancelPixCharge, useCreatePixCharge, usePixCharge } from '../queries'
import { whatsappPixLink } from '../share'
import type { PixCharge } from '../types'
import PixPaymentPanel from './PixPaymentPanel.vue'

const props = defineProps<{ patientId?: number | null; amount?: number; description?: string; title?: string; lockPatient?: boolean; existing?: PixCharge | null }>()
const emit = defineEmits<{ paid: [charge: PixCharge]; created: [charge: PixCharge] }>()
const open = defineModel<boolean>('open', { default: false })

const qc = useQueryClient()
const { copy } = useClipboardToast()
const patients = useActivePatients()
const form = reactive({ patient_id: null as number | null, amount: undefined as number | undefined, description: '', payer_email: '' })
const created = ref<PixCharge | null>(null)
const chargeId = computed(() => created.value?.id ?? null)
const charge = usePixCharge(chargeId, created)
const current = computed(() => charge.data.value ?? created.value)
const patient = computed(() => patients.data.value?.find((p) => p.id === (current.value?.patient_id ?? form.patient_id)))

const create = useCreatePixCharge((c) => ((created.value = c), emit('created', c)))
const cancel = useCancelPixCharge()
const renewing = ref(false)

watch(open, (o) => {
  if (!o) return
  created.value = props.existing ?? null
  Object.assign(form, { patient_id: props.patientId ?? null, amount: props.amount, description: props.description ?? '', payer_email: '' })
})

let notifiedPaid = false
watch(() => current.value?.status, (s) => {
  if (s === 'paid' && current.value && !notifiedPaid) {
    notifiedPaid = true
    notify.success('Pix recebido!', `${formatMoney(current.value.amount)} já foi lançado nos pagamentos`)
    qc.invalidateQueries({ queryKey: ['payments'] })
    qc.invalidateQueries({ queryKey: pixKeys.all })
    emit('paid', current.value)
  }
  if (s === 'pending') notifiedPaid = false
})

function submit() {
  if (!form.amount || form.amount <= 0) return notify.error('Valor inválido', 'Informe um valor maior que zero')
  create.mutate({ amount: form.amount, description: form.description.trim() || undefined, patient_id: form.patient_id, payer_email: form.payer_email.trim() || undefined })
}

async function renew() {
  if (!current.value) return
  renewing.value = true
  try {
    await pixApi.publicRenew(current.value.token)
    await qc.invalidateQueries({ queryKey: pixKeys.one(current.value.id) })
    await qc.invalidateQueries({ queryKey: pixKeys.all })
  } catch {
    notify.error('Não foi possível gerar um novo Pix')
  } finally {
    renewing.value = false
  }
}

const link = computed(() => (current.value ? pixPaymentLink(current.value.token) : ''))
const whatsapp = computed(() => (current.value ? whatsappPixLink(patient.value?.phone, patient.value?.name, current.value.amount, link.value) : ''))
</script>

<template>
  <ResponsiveDialog v-model:open="open" :title="title ?? 'Cobrar via Pix'" :description="current ? undefined : 'Gera um Pix pelo Mercado Pago. Quando o paciente pagar, o pagamento entra sozinho no sistema.'" content-class="sm:max-w-md">
    <!-- 1) dados da cobrança -->
    <form v-if="!current" class="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0" @submit.prevent="submit">
      <FormField v-if="!lockPatient" label="Paciente">
        <PatientSelect v-model="form.patient_id" clearable clear-label="Sem paciente" />
      </FormField>
      <FormField v-slot="{ id }" label="Valor" required><MoneyInput :id="id" v-model="form.amount" required /></FormField>
      <FormField v-slot="{ id }" label="Descrição" hint="Aparece para o paciente e no recibo."><Input :id="id" v-model="form.description" maxlength="255" placeholder="Ex.: Sessão de 20/10" /></FormField>
      <FormField v-if="!form.patient_id" v-slot="{ id }" label="E-mail do pagador (opcional)" hint="Sem paciente vinculado o pagamento não é lançado automaticamente.">
        <Input :id="id" v-model="form.payer_email" type="email" placeholder="pagador@email.com" />
      </FormField>
      <Button type="submit" class="w-full" :disabled="create.isPending.value"><Loader2 v-if="create.isPending.value" class="animate-spin" /><QrCode v-else /> Gerar cobrança Pix</Button>
    </form>

    <!-- 2) pagamento + envio -->
    <div v-else class="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0">
      <PixPaymentPanel :charge="current" :refreshing="charge.isFetching.value" :renewing="renewing" @refresh="charge.refetch()" @renew="renew" />

      <div v-if="current.status === 'pending' || current.can_renew" class="space-y-2 rounded-xl border bg-muted/30 p-3">
        <p class="text-xs font-medium text-muted-foreground">Enviar para o paciente pagar</p>
        <div class="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" @click="copy(link, 'Link de pagamento copiado!', 'O paciente paga sem precisar de login')"><Link2 /> Copiar link</Button>
          <Button v-if="whatsapp" variant="outline" as-child><a :href="whatsapp" target="_blank" rel="noopener"><MessageCircle /> WhatsApp</a></Button>
        </div>
        <p class="text-xs text-muted-foreground">A cobrança também aparece no app do paciente, em Financeiro.</p>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        <Button v-if="current.status === 'pending'" variant="ghost" size="sm" class="text-destructive" :disabled="cancel.isPending.value" @click="cancel.mutate(current.id)"><XCircle /> Cancelar cobrança</Button>
        <Button v-if="current.status !== 'pending' && !lockPatient" variant="outline" size="sm" @click="created = null">Gerar outra cobrança</Button>
      </div>
    </div>
  </ResponsiveDialog>
</template>
