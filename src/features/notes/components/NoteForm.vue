<script setup lang="ts">
import { FileText, LayoutTemplate, Loader2 } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { usePatientSessions } from '@/features/sessions/queries'
import { findNextScheduledSession, findPastSessionsForNoteLink, prefillFromSession, sessionOptionLabel } from '../helpers'
import {
  DEFAULT_POST_THERAPY_TEMPLATE_LABEL, emptyPostTherapyBody, formatPostTherapyFieldLabel, SESSION_META_FIELD_KEYS,
  STRUCTURED_FIELDS_ORDER, type CreatePatientNotePayload, type PatientNote, type PatientNoteKind,
} from '../types'

const props = defineProps<{ patientId: number; note?: PatientNote | null; saving?: boolean }>()
const emit = defineEmits<{ submit: [payload: CreatePatientNotePayload]; cancel: [] }>()

const kind = ref<PatientNoteKind>('free_text')
const title = ref('')
const templateLabel = ref(DEFAULT_POST_THERAPY_TEMPLATE_LABEL)
const sessionId = ref('none')
const bodyText = ref('')
const structured = reactive(emptyPostTherapyBody())

const sessions = usePatientSessions(() => props.patientId)
const all = computed(() => sessions.data.value ?? [])
const linkedId = computed(() => (sessionId.value === 'none' ? null : Number(sessionId.value)))
const linkable = computed(() => findPastSessionsForNoteLink(all.value, linkedId.value))
const nextSession = computed(() => findNextScheduledSession(all.value))
const linkedSession = () => all.value.find((s) => s.id === linkedId.value)

watch(
  () => props.note,
  (n) => {
    if (!n) return
    kind.value = n.kind
    title.value = n.title || ''
    templateLabel.value = n.template_label || DEFAULT_POST_THERAPY_TEMPLATE_LABEL
    sessionId.value = n.session_id ? String(n.session_id) : 'none'
    bodyText.value = n.body_text || ''
    Object.assign(structured, emptyPostTherapyBody(), n.body_structured || {})
  },
  { immediate: true },
)

function onSessionChange(v: unknown) {
  sessionId.value = String(v)
  if (v === 'none') return Object.assign(structured, { session_date_label: '', session_time_label: '', duration_label: '' })
  const s = linkedSession()
  if (s && kind.value === 'structured') Object.assign(structured, prefillFromSession(s, structured))
}
function setKind(k: PatientNoteKind) {
  kind.value = k
  const s = linkedSession()
  if (k === 'structured' && s) Object.assign(structured, prefillFromSession(s, structured))
}

function submit() {
  if (kind.value === 'free_text' && !bodyText.value.trim()) return notify.error('Texto vazio', 'Escreva o conteúdo da anotação ou escolha o modelo.')
  const body = { ...structured, next_session_label: nextSession.value ? sessionOptionLabel(nextSession.value) : '' }
  if (sessionId.value === 'none') Object.assign(body, { session_date_label: '', session_time_label: '', duration_label: '' })
  emit('submit', {
    title: title.value.trim() || null,
    kind: kind.value,
    template_label: kind.value === 'structured' ? templateLabel.value.trim() || DEFAULT_POST_THERAPY_TEMPLATE_LABEL : null,
    session_id: linkedId.value,
    body_text: kind.value === 'free_text' ? bodyText.value : null,
    body_structured: kind.value === 'structured' ? body : null,
  })
}

const fieldKeys = STRUCTURED_FIELDS_ORDER.filter((k) => !SESSION_META_FIELD_KEYS.has(k) && k !== 'next_session_label')
const metaKeys = ['session_date_label', 'session_time_label', 'duration_label'] as const
</script>

<template>
  <form class="min-w-0 space-y-6" @submit.prevent="submit">
    <Card>
      <CardHeader><CardTitle class="text-base">Informações gerais</CardTitle></CardHeader>
      <CardContent class="space-y-5">
        <FormField v-slot="{ id }" label="Título (opcional)"><Input :id="id" v-model="title" placeholder="Ex.: Retorno sobre ansiedade" /></FormField>

        <FormField label="Tipo">
          <div class="flex flex-wrap gap-2">
            <Button type="button" size="sm" :variant="kind === 'free_text' ? 'default' : 'outline'" @click="setKind('free_text')"><FileText /> Texto livre</Button>
            <Button type="button" size="sm" :variant="kind === 'structured' ? 'default' : 'outline'" @click="setKind('structured')"><LayoutTemplate /> Modelo pós-terapia</Button>
          </div>
        </FormField>

        <FormField v-if="kind === 'structured'" v-slot="{ id }" label="Nome do modelo (opcional)">
          <Input :id="id" v-model="templateLabel" :placeholder="DEFAULT_POST_THERAPY_TEMPLATE_LABEL" />
        </FormField>

        <FormField label="Vincular a uma sessão (opcional)" hint="Apenas sessões que já ocorreram podem ser vinculadas.">
          <Select :model-value="sessionId" @update:model-value="onSessionChange">
            <SelectTrigger class="w-full"><SelectValue placeholder="Sem vínculo — anotação geral" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma (anotação geral)</SelectItem>
              <SelectItem v-for="s in linkable" :key="s.id" :value="String(s.id)">{{ sessionOptionLabel(s) }}</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="!sessions.isPending.value && linkable.length === 0" class="mt-1 text-xs text-muted-foreground">Nenhuma sessão passada encontrada para este paciente.</p>
          <p v-if="kind === 'structured' && sessionId !== 'none'" class="mt-1 text-xs text-muted-foreground">Data, hora e duração abaixo são preenchidos com base nesta sessão (você pode editar).</p>
        </FormField>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle class="text-base">{{ kind === 'free_text' ? 'Conteúdo' : 'Campos do modelo' }}</CardTitle></CardHeader>
      <CardContent>
        <Textarea v-if="kind === 'free_text'" v-model="bodyText" class="min-h-[min(60vh,560px)] w-full text-base" placeholder="Escreva suas observações..." />

        <div v-else class="space-y-6">
          <div v-if="sessionId !== 'none'" class="grid gap-4 sm:grid-cols-3">
            <FormField v-for="k in metaKeys" :key="k" v-slot="{ id }" :label="formatPostTherapyFieldLabel(k)">
              <Input :id="id" v-model="structured[k]" class="h-10 border-brand-300" />
            </FormField>
          </div>
          <div class="grid gap-5 md:grid-cols-2">
            <FormField v-for="k in fieldKeys" :key="k" v-slot="{ id }" :label="formatPostTherapyFieldLabel(k)" :class="k === 'discussion_summary' && 'md:col-span-2'">
              <Textarea :id="id" v-model="structured[k]" :class="['w-full border-brand-300', k === 'discussion_summary' ? 'min-h-[200px]' : 'min-h-[110px]']" />
            </FormField>
            <FormField label="Próxima sessão" class="md:col-span-2">
              <p v-if="nextSession" class="rounded-md border border-brand-300 bg-card px-3 py-2.5 text-sm">{{ sessionOptionLabel(nextSession) }}</p>
              <p v-else class="rounded-md border border-dashed bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">Nenhuma próxima sessão agendada.</p>
            </FormField>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="flex flex-col-reverse gap-3 border-t pb-4 pt-4 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" :disabled="saving" @click="emit('cancel')">Cancelar</Button>
      <Button type="submit" :disabled="saving" class="min-w-[120px]"><Loader2 v-if="saving" class="animate-spin" /> {{ saving ? 'Salvando...' : 'Salvar' }}</Button>
    </div>
  </form>
</template>
