<script setup lang="ts">
import { AlertCircle, FileText, Loader2, Signature } from '@lucide/vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paymentTypeLabel } from '@/features/patients/constants'
import type { Patient } from '@/features/patients/types'
import ErrorState from '@/shared/components/ErrorState.vue'
import FormField from '@/shared/components/FormField.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import { formatCpf, formatMoney, formatPhone } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import ContractText from '../components/ContractText.vue'
import SigningProgress from '../components/SigningProgress.vue'
import { useContractByToken, useSignContract } from '../queries'
import { laravelErrorsToFieldMap, validateSignContractForm, type SignContractValidationErrors } from '../sign-validation'
import { PAYMENT_DAY_OPTIONS, type SignContractData } from '../types'

const MIN_LOADING_MS = 5500 // tempo mínimo da tela "assinando"
const STEP_INTERVAL_MS = 1600
const STEPS = ['Validando seus dados...', 'Assinando seu contrato...', 'Gerando o documento em PDF...', 'Preparando sua cópia por e-mail...', 'Finalizando...']
const FIELD_ORDER = ['patient_name', 'patient_email', 'patient_phone', 'patient_cpf', 'patient_birthdate', 'emergency_contact', 'payment_day', 'accept_terms'] as const

const route = useRoute()
const router = useRouter()
const token = computed(() => String(route.params.token))
const query = useContractByToken(token)
const contract = computed(() => query.data.value?.contract)
const existing = computed(() => contract.value?.patient as Patient | undefined)
const isRenewal = computed(() => !!existing.value)

const form = reactive<SignContractData>({ patient_name: '', patient_email: '', patient_phone: '', patient_cpf: '', patient_birthdate: '', emergency_contact: '', payment_day: undefined, accept_terms: false })
// renovação: pré-carrega os dados do paciente para conferência
watch(existing, (p) => {
  if (!p) return
  Object.assign(form, { patient_name: p.name || '', patient_email: p.email || '', patient_phone: formatPhone(p.phone || ''), patient_cpf: formatCpf(p.cpf || ''), patient_birthdate: p.birthdate ? String(p.birthdate).slice(0, 10) : '', emergency_contact: p.emergency_contact || '' })
}, { immediate: true })

const errors = ref<SignContractValidationErrors>({})
const attempted = ref(false)
const err = (k: keyof SignContractValidationErrors) => (attempted.value ? errors.value[k] : undefined)
const clear = (k: keyof SignContractValidationErrors) => errors.value[k] && delete errors.value[k]

const sign = useSignContract(token)
const signing = ref(false)
const step = ref(0)
let lock = false

async function scrollToFirstError(e: SignContractValidationErrors) {
  const key = FIELD_ORDER.find((k) => e[k])
  await nextTick()
  if (key) document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function submit() {
  if (!contract.value || lock) return
  attempted.value = true
  const data: SignContractData = { ...form, patient_name: form.patient_name.trim(), patient_email: form.patient_email.trim(), patient_phone: form.patient_phone.trim(), patient_cpf: form.patient_cpf.trim(), patient_birthdate: form.patient_birthdate.trim(), emergency_contact: form.emergency_contact.trim() }
  const v = validateSignContractForm(data, contract.value.payment_type, {
    psychologistEmail: query.data.value?.psychologist_email, psychologistCpf: query.data.value?.psychologist_cpf,
    existingPatientEmail: existing.value?.email, existingPatientCpf: existing.value?.cpf,
  })
  if (!v.ok) {
    errors.value = v.errors
    notify.error('Verifique o formulário', FIELD_ORDER.map((k) => v.errors[k]).find(Boolean) || 'Preencha todos os campos obrigatórios antes de assinar.')
    return scrollToFirstError(v.errors)
  }
  errors.value = {}
  lock = true
  signing.value = true
  step.value = 0
  const started = Date.now()
  const timer = setInterval(() => (step.value = Math.min(step.value + 1, STEPS.length - 1)), STEP_INTERVAL_MS)
  try {
    const res = await sign.mutateAsync(data)
    clearInterval(timer)
    step.value = STEPS.length - 1
    if (res.success) {
      notify.success('Contrato assinado!', 'Seu contrato foi assinado com sucesso')
      const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - started)) + 800
      setTimeout(() => router.replace(isRenewal.value ? '/contract/success?renewal=1' : '/contract/success'), wait)
    }
  } catch (e: any) {
    clearInterval(timer)
    if (e.response?.status === 422) {
      const raw = e.response?.data?.errors
      errors.value = laravelErrorsToFieldMap(raw)
      const first = FIELD_ORDER.map((k) => errors.value[k]).find(Boolean) || (raw && (Object.values(raw).find((x) => Array.isArray(x) && x[0]) as string[] | undefined)?.[0])
      notify.error('Erro de validação', first || e.response?.data?.message || 'Corrija os campos destacados.')
      scrollToFirstError(errors.value)
    } else {
      notify.error('Erro ao assinar contrato', e.response?.data?.message || 'Tente novamente mais tarde')
    }
    lock = false
    signing.value = false
  }
}

const loadError = computed(() => {
  const s = (query.error.value as { response?: { status?: number } } | null)?.response?.status
  return s === 410 ? { title: 'Contrato expirado', text: 'Este contrato expirou e não pode mais ser assinado. Peça um novo link à psicóloga.' } : s === 404 ? { title: 'Contrato não encontrado', text: 'Este contrato não existe ou já foi processado.' } : null
})
</script>

<template>
  <SigningProgress v-if="signing" :steps="STEPS" :current="step" />

  <div v-else-if="query.isPending.value"><LoadingState fullscreen label="Carregando contrato..." /></div>
  <div v-else-if="loadError" class="flex min-h-dvh items-center justify-center p-4">
    <Card class="w-full max-w-md"><CardContent class="flex flex-col items-center py-10 text-center"><AlertCircle class="mb-4 size-14 text-destructive" /><h2 class="mb-2 text-2xl font-bold">{{ loadError.title }}</h2><p class="text-muted-foreground">{{ loadError.text }}</p></CardContent></Card>
  </div>
  <div v-else-if="query.isError.value || !contract" class="flex min-h-dvh items-center justify-center p-4"><ErrorState message="Erro ao carregar contrato. Tente novamente mais tarde." @retry="query.refetch()" /></div>

  <div v-else class="mx-auto max-w-5xl p-4 pb-10">
    <header class="mb-6 text-center sm:mb-8">
      <img src="/logo-login.png" alt="Psi Fernanda Costa" class="mx-auto mb-3 h-auto w-48 sm:w-56" />
      <h1 class="mb-1 text-2xl font-bold sm:text-3xl">Contrato Terapêutico</h1>
      <p class="text-sm text-muted-foreground sm:text-base">Fernanda Costa — Psicóloga CRP-08/43119</p>
    </header>

    <div class="grid gap-4 lg:grid-cols-2 lg:gap-8">
      <Card class="min-w-0">
        <CardHeader><CardTitle class="flex items-center gap-2"><FileText class="size-5" /> Texto do contrato</CardTitle></CardHeader>
        <CardContent><div class="max-h-96 overflow-y-auto rounded-lg bg-muted/40 p-4 lg:max-h-[70vh]"><ContractText :text="contract.contract_text" /></div></CardContent>
      </Card>

      <Card class="min-w-0">
        <CardHeader>
          <CardTitle>{{ isRenewal ? 'Renovar / revisar contrato' : 'Assinar contrato' }}</CardTitle>
          <p v-if="isRenewal" class="mt-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm">Os dados abaixo foram carregados para você conferir. Ao assinar, apenas atualizamos seu cadastro caso necessário e atribuímos o novo contrato.</p>
          <dl class="mt-3 grid gap-3 rounded-lg bg-brand-50 p-3 text-sm sm:grid-cols-2">
            <div><dt class="text-xs text-muted-foreground">Tipo</dt><dd class="font-medium">{{ paymentTypeLabel(contract.payment_type) }}</dd></div>
            <div><dt class="text-xs text-muted-foreground">Valor</dt><dd class="font-medium">{{ formatMoney(contract.price_session) }}</dd></div>
          </dl>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" novalidate @submit.prevent="submit">
            <FormField id="patient_name" label="Nome completo" required :error="err('patient_name')"><Input id="patient_name" v-model="form.patient_name" autocomplete="name" class="h-11" :aria-invalid="!!err('patient_name')" @input="clear('patient_name')" /></FormField>
            <FormField id="patient_email" label="E-mail" required :error="err('patient_email')"><Input id="patient_email" v-model="form.patient_email" type="email" inputmode="email" autocomplete="email" class="h-11" :aria-invalid="!!err('patient_email')" @input="clear('patient_email')" /></FormField>
            <FormField id="patient_phone" label="Telefone / WhatsApp" required :error="err('patient_phone')">
              <Input id="patient_phone" :model-value="form.patient_phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" maxlength="16" class="h-11" :aria-invalid="!!err('patient_phone')" @update:model-value="(v) => ((form.patient_phone = formatPhone(String(v))), clear('patient_phone'))" />
            </FormField>
            <FormField id="patient_cpf" label="CPF" required :error="err('patient_cpf')">
              <Input id="patient_cpf" :model-value="form.patient_cpf" inputmode="numeric" placeholder="000.000.000-00" maxlength="14" class="h-11" :aria-invalid="!!err('patient_cpf')" @update:model-value="(v) => ((form.patient_cpf = formatCpf(String(v))), clear('patient_cpf'))" />
            </FormField>
            <FormField id="patient_birthdate" label="Data de nascimento" required :error="err('patient_birthdate')"><Input id="patient_birthdate" v-model="form.patient_birthdate" type="date" class="h-11" :aria-invalid="!!err('patient_birthdate')" @input="clear('patient_birthdate')" /></FormField>
            <FormField id="emergency_contact" label="Contato de emergência" required :error="err('emergency_contact')"><Input id="emergency_contact" v-model="form.emergency_contact" placeholder="Nome e telefone" class="h-11" :aria-invalid="!!err('emergency_contact')" @input="clear('emergency_contact')" /></FormField>

            <FormField v-if="contract.payment_type === 'mensal'" label="Dia de pagamento" required :error="err('payment_day')">
              <Select :model-value="form.payment_day?.toString()" @update:model-value="(v) => ((form.payment_day = Number(v)), clear('payment_day'))">
                <SelectTrigger id="payment_day" class="h-11 w-full"><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                <SelectContent><SelectItem v-for="o in PAYMENT_DAY_OPTIONS" :key="o.value" :value="o.value.toString()">{{ o.label }}</SelectItem></SelectContent>
              </Select>
            </FormField>

            <div class="space-y-1.5">
              <div class="flex items-start gap-3"><Checkbox id="accept_terms" v-model="form.accept_terms" class="mt-0.5" @update:model-value="clear('accept_terms')" /><Label for="accept_terms" class="text-sm font-normal leading-snug">Li e aceito os termos do contrato terapêutico acima.</Label></div>
              <p v-if="err('accept_terms')" class="text-xs text-destructive">{{ err('accept_terms') }}</p>
            </div>

            <p class="text-xs text-muted-foreground">Ao assinar, você receberá uma cópia do contrato em PDF por e-mail. Seus dados são protegidos pela LGPD.</p>
            <Button type="submit" size="lg" class="h-12 w-full" :disabled="signing"><Loader2 v-if="signing" class="animate-spin" /><Signature v-else /> Assinar contrato</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
