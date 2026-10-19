<script setup lang="ts">
import { MOOD_ENABLED } from '@/features/mood/feature'
import { Calendar, CalendarCheck, DollarSign, FileText, Loader2, Mail, MapPin, Phone, Save, Shield } from '@lucide/vue'
import { computed, ref } from 'vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { formatSessionInstantInSaoPaulo, sessionDateTimeToApiIso } from '@/shared/lib/datetime-br'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import AttendanceCard from '@/features/attendance/components/AttendanceCard.vue'
import MoodHistoryCard from '@/features/mood/components/MoodHistoryCard.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { paymentTypeLabel } from '../constants'
import { useUpdatePatient } from '../queries'
import type { Patient } from '../types'
import InfoItem from './InfoItem.vue'
import PortalAccessCard from './PortalAccessCard.vue'

const props = defineProps<{ patient: Patient }>()
const privacy = usePrivacyMode()

// Primeira sessão: campo aberto enquanto estiver vazio; depois de salvo, só muda em "Editar paciente"
const firstSession = ref('')
const firstLabel = computed(() => (props.patient.first_session_at ? formatSessionInstantInSaoPaulo(props.patient.first_session_at, "dd/MM/yyyy 'às' HH:mm") : ''))
const saveFirst = useUpdatePatient(() => props.patient.id)
function submitFirst() {
  if (!firstSession.value) return notify.error('Informe a data e o horário', 'Preencha a primeira sessão antes de salvar.')
  saveFirst.mutate({ first_session_at: sessionDateTimeToApiIso(firstSession.value) })
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <AttendanceCard :patient-id="patient.id" title="Frequência do paciente" />
    <MoodHistoryCard v-if="MOOD_ENABLED" :patient-id="patient.id" />

    <Card>
      <CardHeader><CardTitle class="flex items-center gap-2 text-lg"><FileText class="size-5" /> Informações pessoais</CardTitle></CardHeader>
      <CardContent class="grid gap-4 sm:grid-cols-2">
        <InfoItem v-if="patient.first_session_at" :icon="CalendarCheck" label="Primeira sessão (Brasília)" :value="firstLabel" />
        <div v-else class="flex items-start gap-3 sm:col-span-2">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50"><CalendarCheck class="size-5 text-brand-600" /></div>
          <form class="min-w-0 flex-1 space-y-2" @submit.prevent="submitFirst">
            <label for="first-session" class="text-sm font-medium">Data e hora da primeira sessão (Brasília)</label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <Input id="first-session" v-model="firstSession" type="datetime-local" class="sm:max-w-xs" />
              <Button type="submit" :disabled="saveFirst.isPending.value || !firstSession"><Loader2 v-if="saveFirst.isPending.value" class="animate-spin" /><Save v-else /> Salvar</Button>
            </div>
            <p class="text-xs text-muted-foreground">Depois de salva, só pode ser alterada em “Editar paciente”.</p>
          </form>
        </div>
        <InfoItem :icon="Calendar" label="Data de nascimento" :value="formatDate(patient.birthdate) || 'Não informado'" />
        <InfoItem v-if="patient.email" :icon="Mail" label="E-mail" :value="privacy.email(patient.email)" />
        <InfoItem v-if="patient.phone" :icon="Phone" label="Telefone" :value="privacy.phone(patient.phone)" />
        <InfoItem v-if="patient.cpf" :icon="FileText" label="CPF" :value="privacy.cpf(patient.cpf)" />
        <InfoItem v-if="patient.address" :icon="MapPin" label="Endereço" :value="privacy.text(patient.address)" class="sm:col-span-2" />
        <InfoItem v-if="patient.emergency_contact" :icon="Phone" label="Contato de emergência" :value="privacy.text(patient.emergency_contact)" />
        <InfoItem v-if="patient.insurance" :icon="Shield" label="Convênio / plano de saúde" :value="privacy.text(patient.insurance, 6)" />
        <InfoItem v-if="patient.price_session" :icon="DollarSign" label="Valor da sessão" :value="privacy.money(patient.price_session)" />
        <InfoItem v-if="patient.payment_type" :icon="Calendar" label="Tipo de pagamento" :value="paymentTypeLabel(patient.payment_type)" />
      </CardContent>
    </Card>

    <Card v-if="patient.initial_notes">
      <CardHeader><CardTitle class="text-lg">Observações</CardTitle></CardHeader>
      <CardContent>
        <p class="whitespace-pre-wrap break-words text-sm text-muted-foreground">{{ privacy.text(patient.initial_notes, 24) }}</p>
      </CardContent>
    </Card>

    <PortalAccessCard :patient="patient" />
  </div>
</template>
