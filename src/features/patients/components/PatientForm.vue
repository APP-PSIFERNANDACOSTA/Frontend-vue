<script setup lang="ts">
/** Formulário único de paciente (cadastro e edição). */
import { Loader2, Save } from '@lucide/vue'
import { reactive, ref, watch } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import MoneyInput from '@/shared/components/MoneyInput.vue'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { sessionDateTimeToApiIso, utcIsoToSaoPauloDateAndTime } from '@/shared/lib/datetime-br'
import { Textarea } from '@/shared/ui/textarea'
import { PAYMENT_TYPES, type Patient, type PaymentType } from '../types'

export interface PatientFormValues {
  name: string
  email: string
  phone: string
  cpf: string
  birthdate: string
  emergency_contact: string
  address: string
  insurance: string
  price_session?: number
  payment_type: PaymentType
  payment_day: number | null
  initial_notes: string
  status: 'active' | 'inactive'
  /** ISO UTC (convertido do horário de Brasília digitado) ou null */
  first_session_at: string | null
}

const props = defineProps<{
  patient?: Patient | null
  submitLabel: string
  loadingLabel: string
  saving?: boolean
}>()
const emit = defineEmits<{ submit: [values: PatientFormValues]; cancel: [] }>()

const empty = (): Omit<PatientFormValues, 'first_session_at'> => ({
  name: '', email: '', phone: '', cpf: '', birthdate: '', emergency_contact: '', address: '',
  insurance: '', price_session: undefined, payment_type: 'por_sessao', payment_day: null, initial_notes: '', status: 'active',
})
const form = reactive(empty())
const firstSession = ref('') // datetime-local, horário de Brasília

watch(
  () => props.patient,
  (p) => {
    if (!p) return
    Object.assign(form, {
      name: p.name,
      email: p.email || '',
      phone: p.phone || '',
      cpf: p.cpf || '',
      birthdate: p.birthdate?.slice(0, 10) || '',
      emergency_contact: p.emergency_contact || '',
      address: p.address || '',
      insurance: p.insurance || '',
      price_session: p.price_session == null ? undefined : Number(p.price_session),
      payment_type: p.payment_type || 'por_sessao',
      payment_day: p.payment_day ?? null,
      initial_notes: p.initial_notes || '',
      status: p.status,
    })
    if (p.first_session_at) {
      const { date, time } = utcIsoToSaoPauloDateAndTime(p.first_session_at)
      firstSession.value = `${date}T${time}`
    }
  },
  { immediate: true },
)

</script>

<template>
  <form class="space-y-6" @submit.prevent="emit('submit', { ...form, first_session_at: firstSession ? sessionDateTimeToApiIso(firstSession) : null })">
    <Card>
      <CardHeader><CardTitle>Informações pessoais</CardTitle></CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2">
        <FormField v-slot="{ id }" label="Nome completo" required>
          <Input :id="id" v-model="form.name" required placeholder="Ex: João Silva" />
        </FormField>
        <FormField v-slot="{ id }" label="Data de nascimento">
          <Input :id="id" v-model="form.birthdate" type="date" />
        </FormField>
        <FormField v-slot="{ id }" label="Data e hora da primeira sessão" hint="Horário de Brasília. Depois de preenchida, só pode ser alterada aqui.">
          <Input :id="id" v-model="firstSession" type="datetime-local" />
        </FormField>
        <FormField v-slot="{ id }" label="E-mail">
          <Input :id="id" v-model="form.email" type="email" inputmode="email" placeholder="joao@email.com" />
        </FormField>
        <FormField v-slot="{ id }" label="Telefone">
          <Input :id="id" v-model="form.phone" type="tel" inputmode="tel" placeholder="(11) 99999-9999" />
        </FormField>
        <FormField v-slot="{ id }" label="CPF">
          <Input :id="id" v-model="form.cpf" inputmode="numeric" placeholder="000.000.000-00" />
        </FormField>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Informações adicionais</CardTitle></CardHeader>
      <CardContent class="space-y-4">
        <FormField v-slot="{ id }" label="Contato de emergência">
          <Input :id="id" v-model="form.emergency_contact" placeholder="Nome e telefone do contato de emergência" />
        </FormField>
        <FormField v-slot="{ id }" label="Endereço">
          <Textarea :id="id" v-model="form.address" rows="3" placeholder="Endereço completo" />
        </FormField>
        <div class="grid gap-4 md:grid-cols-2">
          <FormField v-slot="{ id }" label="Convênio / plano de saúde">
            <Input :id="id" v-model="form.insurance" placeholder="Ex: Unimed, Amil..." />
          </FormField>
          <FormField v-slot="{ id }" label="Valor da sessão (R$)">
            <MoneyInput :id="id" v-model="form.price_session" placeholder="150,00" />
          </FormField>
          <FormField label="Tipo de pagamento">
            <Select v-model="form.payment_type">
              <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in PAYMENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField v-if="form.payment_type !== 'por_sessao'" label="Dia de pagamento" :hint="form.payment_type === 'quinzenal' ? 'Duas cobranças: neste dia e 15 dias depois' : 'A mensalidade vence neste dia'">
            <Select :model-value="form.payment_day ? String(form.payment_day) : undefined" @update:model-value="(v) => (form.payment_day = v ? Number(v) : null)">
              <SelectTrigger class="w-full"><SelectValue placeholder="Escolha o dia" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="d in [5, 10, 15, 20]" :key="d" :value="String(d)">Todo dia {{ d }}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select v-model="form.status">
              <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Observações iniciais</CardTitle></CardHeader>
      <CardContent>
        <FormField v-slot="{ id }" label="Notas e observações">
          <Textarea :id="id" v-model="form.initial_notes" rows="5" placeholder="Informações importantes sobre o paciente, histórico, preferências..." />
        </FormField>
      </CardContent>
    </Card>

    <div class="flex flex-col-reverse gap-2 sm:flex-row">
      <Button type="button" variant="outline" :disabled="saving" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :disabled="saving" class="gap-2">
        <Loader2 v-if="saving" class="animate-spin" /><Save v-else />
        {{ saving ? loadingLabel : submitLabel }}
      </Button>
    </div>
  </form>
</template>
