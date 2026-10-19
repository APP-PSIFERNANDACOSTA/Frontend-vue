<script setup lang="ts">
import { Cake, Calendar, DollarSign, Eye, Mail, Phone } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import InfoRow from '@/shared/components/InfoRow.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { PATIENT_STATUS_MAP, paymentTypeLabel } from '../constants'
import type { Patient } from '../types'
import PatientActions from './PatientActions.vue'

defineProps<{ patient: Patient }>()
const privacy = usePrivacyMode()
</script>

<template>
  <Card class="transition-shadow hover:shadow-md">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 space-y-1">
          <CardTitle class="truncate text-lg">{{ privacy.name(patient.name) }}</CardTitle>
          <div class="flex items-center gap-2">
            <StatusBadge :status="patient.status" :map="PATIENT_STATUS_MAP" />
            <span class="text-xs text-muted-foreground">ID: {{ patient.id }}</span>
          </div>
        </div>
        <PatientActions :patient="patient" :label="privacy.name(patient.name)" />
      </div>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="space-y-2">
        <InfoRow v-if="patient.email" :icon="Mail" :text="privacy.email(patient.email)" />
        <InfoRow v-if="patient.phone" :icon="Phone" :text="privacy.phone(patient.phone)" />
        <InfoRow :icon="Cake" :text="`Nascimento: ${formatDate(patient.birthdate) || 'Não informado'}`" />
        <InfoRow v-if="patient.payment_type" :icon="Calendar" :text="`Pagamento: ${paymentTypeLabel(patient.payment_type)}`" />
        <InfoRow v-if="patient.price_session" :icon="DollarSign" :text="`Sessão: ${privacy.money(patient.price_session)}`" />
      </div>
      <Button variant="outline" size="sm" class="w-full" as-child>
        <RouterLink :to="`/dashboard/patients/${patient.id}`"><Eye /> Ver detalhes</RouterLink>
      </Button>
    </CardContent>
  </Card>
</template>
