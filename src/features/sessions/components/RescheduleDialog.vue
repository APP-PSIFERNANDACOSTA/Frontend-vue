<script setup lang="ts">
import { CalendarClock, Loader2 } from '@lucide/vue'
import { reactive, ref, watch } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { sessionDateTimeToApiIso, utcIsoToSaoPauloDateAndTime } from '@/shared/lib/datetime-br'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { useRescheduleSession, useSeriesInfo } from '../queries'
import type { Session, SessionApplyTo, SessionInitiator } from '../types'
import InitiatedByPicker from './InitiatedByPicker.vue'
import SessionScopePicker from './SessionScopePicker.vue'

const props = defineProps<{ session: Session | null; patientId: number }>()
const open = defineModel<boolean>('open', { default: false })

const form = reactive({ session_date: '', duration: 50 as number | null, notes: '' })
const applyTo = ref<SessionApplyTo>('single')
const initiatedBy = ref<SessionInitiator | null>(null)
const series = useSeriesInfo(() => (open.value ? props.patientId : undefined), () => props.session?.id)
const futureCount = () => series.data.value?.future_count ?? 0
const reschedule = useRescheduleSession(() => props.patientId, () => (open.value = false))

watch(open, (o) => {
  if (!o || !props.session) return
  const { date, time } = utcIsoToSaoPauloDateAndTime(props.session.session_date)
  Object.assign(form, { session_date: `${date}T${time}`, duration: props.session.duration || 50, notes: props.session.notes || '' })
  applyTo.value = 'single'
  initiatedBy.value = null
})

function submit() {
  if (!props.session) return
  if (!form.session_date) return notify.error('Erro', 'Data e hora são obrigatórias')
  if (!initiatedBy.value) return notify.error('Informe quem pediu', 'Escolha se a remarcação foi pedida pelo paciente ou pela psicóloga.')
  reschedule.mutate({
    id: props.session.id,
    data: {
      session_date: sessionDateTimeToApiIso(form.session_date),
      duration: form.duration || null,
      notes: form.notes || null,
      initiated_by: initiatedBy.value,
      ...(futureCount() > 0 ? { apply_to: applyTo.value } : {}),
    },
  })
}
</script>

<template>
  <ResponsiveDialog v-model:open="open" title="Remarcar sessão">
    <form class="space-y-4" @submit.prevent="submit">
      <FormField v-slot="{ id }" label="Nova data e hora (horário de Brasília)" required hint="O valor é interpretado como fuso de Brasília, independente do seu navegador.">
        <Input :id="id" v-model="form.session_date" type="datetime-local" required />
      </FormField>
      <FormField v-slot="{ id }" label="Duração (minutos)">
        <Input :id="id" :model-value="form.duration ?? ''" type="number" min="15" max="300" @update:model-value="(v) => (form.duration = v ? Number(v) : null)" />
      </FormField>
      <FormField v-slot="{ id }" label="Notas (opcional)">
        <Textarea :id="id" v-model="form.notes" rows="3" placeholder="Adicione notas sobre a remarcação..." />
      </FormField>
      <InitiatedByPicker v-model="initiatedBy" label="Quem pediu a remarcação?" hint="Remarcação pedida pelo paciente entra no cálculo de frequência; pela psicóloga, não." />
      <SessionScopePicker v-model="applyTo" id-prefix="reschedule" :future-count="futureCount()" />
      <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" :disabled="reschedule.isPending.value" @click="open = false">Cancelar</Button>
        <Button type="submit" :disabled="reschedule.isPending.value || !initiatedBy">
          <Loader2 v-if="reschedule.isPending.value" class="animate-spin" /><CalendarClock v-else />
          {{ reschedule.isPending.value ? 'Remarcando...' : 'Remarcar sessão' }}
        </Button>
      </div>
    </form>
  </ResponsiveDialog>
</template>
