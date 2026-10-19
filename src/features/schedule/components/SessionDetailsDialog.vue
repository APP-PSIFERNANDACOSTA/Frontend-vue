<script setup lang="ts">
import { AlertCircle, Calendar, CalendarClock, CalendarX2, CheckCircle2, ChevronLeft, Clock, Loader2, Pencil, Save, Trash2, User } from '@lucide/vue'
import { ptBR } from 'date-fns/locale'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import SessionScopePicker from '@/features/sessions/components/SessionScopePicker.vue'
import CancelSessionDialog from '@/features/sessions/components/CancelSessionDialog.vue'
import InitiatedByPicker from '@/features/sessions/components/InitiatedByPicker.vue'
import SessionStatusSelect from '@/features/sessions/components/SessionStatusSelect.vue'
import { useSeriesInfo } from '@/features/sessions/queries'
import { SESSION_STATUS_MAP } from '@/features/sessions/status'
import type { Session, SessionApplyTo, SessionInitiator, SessionStatus } from '@/features/sessions/types'
import FormField from '@/shared/components/FormField.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatSessionInstantInLocalTimezone, formatSessionInstantInSaoPaulo, saoPauloWallDateTimeToUtcIso, utcIsoToSaoPauloDateAndTime } from '@/shared/lib/datetime-br'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { useMarkSession, useUpdateSession } from '../queries'

const props = defineProps<{ session: Session | null; startInEdit?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ delete: [s: Session]; reschedule: [s: Session] }>()
const privacy = usePrivacyMode()

const editing = ref(false)
const form = reactive({ date: '', time: '', duration: null as number | null, notes: '' })
const applyTo = ref<SessionApplyTo>('single')
const initiatedBy = ref<SessionInitiator | null>(null)
const cancelOpen = ref(false)
// a data só conta como remarcação se mudou em relação à original
const original = computed(() => (props.session ? utcIsoToSaoPauloDateAndTime(props.session.session_date) : null))
const dateChanged = computed(() => !!original.value && (form.date !== original.value.date || form.time !== original.value.time))

const series = useSeriesInfo(() => (editing.value ? props.session?.patient_id : undefined), () => props.session?.id)
const futureCount = computed(() => series.data.value?.future_count ?? 0)

function startEdit() {
  if (!props.session) return
  const { date, time } = utcIsoToSaoPauloDateAndTime(props.session.session_date)
  Object.assign(form, { date, time, duration: props.session.duration, notes: props.session.notes ?? '' })
  applyTo.value = 'single'
  initiatedBy.value = null
  editing.value = true
}
// reabre sempre na visão de detalhes (ou direto na edição, se pedido)
watch(open, (o) => {
  editing.value = false
  if (o && props.startInEdit) startEdit()
})

const update = useUpdateSession()
const complete = useMarkSession('complete', () => (open.value = false))
const noShow = useMarkSession('no-show', () => (open.value = false))
const busy = computed(() => update.isPending.value || complete.isPending.value || noShow.isPending.value)

const local = (iso: string, p: string) => formatSessionInstantInLocalTimezone(iso, p, { locale: ptBR })
const brasilia = (iso: string, p: string) => formatSessionInstantInSaoPaulo(iso, p, { locale: ptBR })
const target = computed(() => (props.session ? { patientId: props.session.patient_id, id: props.session.id } : null))

function changeStatus(status: SessionStatus, by?: SessionInitiator) {
  if (!target.value || status === props.session?.status) return
  if (status === 'cancelled' && !by) return void (cancelOpen.value = true) // pergunta quem cancelou
  update.mutate({ ...target.value, data: { status, ...(by ? { initiated_by: by } : {}) } }, { onSuccess: () => notify.success('Status atualizado', 'O status da sessão foi alterado.') })
}

function save() {
  if (!target.value) return
  if (!form.date || !form.time) return notify.error('Campos obrigatórios', 'Data e horário são obrigatórios')
  if (dateChanged.value && !initiatedBy.value) return notify.error('Informe quem pediu', 'A data mudou: escolha se foi o paciente ou a psicóloga que pediu a remarcação.')
  update.mutate(
    {
      ...target.value,
      data: {
        session_date: saoPauloWallDateTimeToUtcIso(form.date, form.time),
        duration: form.duration,
        notes: form.notes.trim() || null,
        ...(dateChanged.value ? { initiated_by: initiatedBy.value! } : {}),
        ...(futureCount.value > 0 ? { apply_to: applyTo.value } : {}),
      },
    },
    {
      onSuccess: (r) => {
        notify.success('Sessão atualizada', r.updated_sessions_count > 1 ? `${r.updated_sessions_count} sessões atualizadas.` : 'Alterações salvas com sucesso.')
        editing.value = false
      },
    },
  )
}
</script>

<template>
  <ResponsiveDialog v-model:open="open" :title="editing ? 'Editar sessão' : 'Detalhes da sessão'" :description="editing && session?.patient ? `${privacy.name(session.patient.name)} · Atual: ${brasilia(session.session_date, `dd/MM/yyyy 'às' HH:mm`)} (Brasília)` : undefined" content-class="sm:max-w-xl">
    <div v-if="session && !editing" class="space-y-4 pb-2">
      <StatusBadge :status="session.status" :map="SESSION_STATUS_MAP" />

      <FormField v-slot="{ id }" label="Alterar status" hint="Inclui sessões já finalizadas: você pode corrigir o status quando precisar.">
        <SessionStatusSelect :id="id" :model-value="session.status" :loading="update.isPending.value" @change="changeStatus" />
      </FormField>

      <div class="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
        <div>
          <p class="flex items-center gap-2 font-medium"><Calendar class="size-4 shrink-0 text-muted-foreground" /><span class="first-letter:uppercase">{{ local(session.session_date, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm") }}</span></p>
          <p class="pl-6 text-xs text-muted-foreground">Paciente (Brasília): {{ brasilia(session.session_date, 'dd/MM/yyyy HH:mm') }}</p>
        </div>
        <p v-if="session.patient" class="flex items-center gap-2"><User class="size-4 text-muted-foreground" /><span class="font-medium">{{ privacy.name(session.patient.name) }}</span><span class="truncate text-muted-foreground">({{ privacy.email(session.patient.email) }})</span></p>
        <p v-if="session.duration" class="flex items-center gap-2"><Clock class="size-4 text-muted-foreground" /> {{ session.duration }} minutos</p>
        <div v-if="session.notes"><p class="mb-1 font-medium">Notas:</p><p class="whitespace-pre-wrap rounded-md border bg-background p-3 text-xs text-muted-foreground">{{ session.notes }}</p></div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button v-if="session.status !== 'completed' && session.status !== 'no_show'" size="sm" :disabled="busy" @click="target && complete.mutate(target)"><CheckCircle2 /> Marcar como concluída</Button>
        <template v-if="session.status === 'scheduled' || session.status === 'rescheduled'">
          <Button size="sm" variant="outline" :disabled="busy" @click="target && noShow.mutate(target)"><AlertCircle /> Marcar como falta</Button>
          <Button size="sm" variant="outline" :disabled="busy" @click="emit('reschedule', session)"><CalendarClock /> Remarcar</Button>
          <Button size="sm" variant="outline" :disabled="busy" @click="cancelOpen = true"><CalendarX2 /> Cancelar sessão</Button>
          <Button size="sm" variant="outline" :disabled="busy" @click="startEdit"><Pencil /> Editar detalhes</Button>
        </template>
        <Button v-if="session.status !== 'completed'" size="sm" variant="outline" class="text-destructive hover:text-destructive" :disabled="busy" @click="emit('delete', session)"><Trash2 /> Excluir</Button>
        <Button v-if="session.patient" size="sm" variant="secondary" as-child><RouterLink :to="`/dashboard/patients/${session.patient_id}`">Ver paciente</RouterLink></Button>
      </div>
    </div>

    <form v-else-if="session" class="space-y-4 pb-2" @submit.prevent="save">
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField v-slot="{ id }" label="Nova data" required><Input :id="id" v-model="form.date" type="date" required /></FormField>
        <FormField v-slot="{ id }" label="Novo horário" required><Input :id="id" v-model="form.time" type="time" required /></FormField>
      </div>
      <p class="-mt-2 text-xs text-muted-foreground">Horário de Brasília. O Google Calendar recebe o instante correto.</p>
      <FormField v-slot="{ id }" label="Duração (minutos)">
        <Input :id="id" :model-value="form.duration ?? ''" type="number" min="5" max="300" step="5" :placeholder="session.duration?.toString() || '50'" @update:model-value="(v) => (form.duration = v ? Number(v) : null)" />
      </FormField>
      <FormField v-slot="{ id }" label="Notas"><Textarea :id="id" v-model="form.notes" rows="3" placeholder="Observações sobre a sessão..." /></FormField>
      <InitiatedByPicker v-if="dateChanged" v-model="initiatedBy" label="Quem pediu a remarcação?" hint="Remarcação pedida pelo paciente entra no cálculo de frequência; pela psicóloga, não." />
      <SessionScopePicker v-model="applyTo" id-prefix="calendar-edit" :future-count="futureCount" />
      <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" :disabled="busy" @click="editing = false"><ChevronLeft /> Voltar</Button>
        <Button type="submit" :disabled="busy || !form.date || !form.time || (dateChanged && !initiatedBy)"><Loader2 v-if="update.isPending.value" class="animate-spin" /><Save v-else /> {{ update.isPending.value ? 'Salvando...' : 'Salvar alterações' }}</Button>
      </div>
    </form>
  </ResponsiveDialog>
  <CancelSessionDialog v-model:open="cancelOpen" @confirm="(by) => changeStatus('cancelled', by)" />
</template>
