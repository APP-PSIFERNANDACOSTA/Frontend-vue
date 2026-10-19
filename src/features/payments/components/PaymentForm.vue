<script setup lang="ts">
/** Formulário único de pagamento (cadastro e edição). Na edição o paciente fica bloqueado. */
import { DollarSign, Loader2, Save } from '@lucide/vue'
import { reactive, watch } from 'vue'
import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import FormField from '@/shared/components/FormField.vue'
import MoneyInput from '@/shared/components/MoneyInput.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { PAYMENT_METHOD_LABELS, type CreatePaymentData, type Payment, type PaymentMethod } from '../types'

const props = defineProps<{ payment?: Payment | null; saving?: boolean }>()
const emit = defineEmits<{ submit: [data: CreatePaymentData]; cancel: [] }>()
const privacy = usePrivacyMode()

const form = reactive({
  patient_id: null as number | null,
  amount: undefined as number | undefined,
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'pix' as PaymentMethod,
  description: '',
})

watch(
  () => props.payment,
  (p) => {
    if (!p) return
    Object.assign(form, {
      patient_id: p.patient_id,
      amount: Number(p.amount),
      payment_date: p.payment_date.slice(0, 10),
      payment_method: p.payment_method,
      description: p.description ?? '',
    })
  },
  { immediate: true },
)

function submit() {
  if (!form.patient_id) return notify.error('Erro', 'Selecione um paciente')
  if (!form.amount || form.amount <= 0) return notify.error('Erro', 'O valor deve ser maior que zero')
  emit('submit', { patient_id: form.patient_id, amount: form.amount, payment_date: form.payment_date, payment_method: form.payment_method, description: form.description || null })
}
</script>

<template>
  <form @submit.prevent="submit">
    <Card>
      <CardHeader><CardTitle class="flex items-center gap-2"><DollarSign class="size-5" /> Dados do pagamento</CardTitle></CardHeader>
      <CardContent class="space-y-5">
        <FormField v-slot="{ id }" label="Paciente" required :hint="payment ? 'O paciente não pode ser alterado.' : undefined">
          <Input v-if="payment" :id="id" :model-value="privacy.name(payment.patient?.name)" disabled />
          <PatientSelect v-else :id="id" v-model="form.patient_id" />
        </FormField>

        <div class="grid gap-4 md:grid-cols-2">
          <FormField v-slot="{ id }" label="Valor (R$)" required>
            <MoneyInput :id="id" v-model="form.amount" required />
          </FormField>
          <FormField v-slot="{ id }" label="Data do pagamento" required>
            <Input :id="id" v-model="form.payment_date" type="date" required />
          </FormField>
        </div>

        <FormField label="Método de pagamento" required>
          <Select v-model="form.payment_method">
            <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem v-for="(label, value) in PAYMENT_METHOD_LABELS" :key="value" :value="value">{{ label }}</SelectItem></SelectContent>
          </Select>
        </FormField>

        <FormField v-slot="{ id }" label="Descrição / observações">
          <Textarea :id="id" v-model="form.description" rows="3" placeholder="Ex.: Sessão do dia 10/10" />
        </FormField>

        <div class="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row">
          <Button type="button" variant="outline" :disabled="saving" @click="emit('cancel')">Cancelar</Button>
          <Button type="submit" :disabled="saving">
            <Loader2 v-if="saving" class="animate-spin" /><Save v-else />
            {{ saving ? 'Salvando...' : payment ? 'Salvar alterações' : 'Cadastrar pagamento' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </form>
</template>
