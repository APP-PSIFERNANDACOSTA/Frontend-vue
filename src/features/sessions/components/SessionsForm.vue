<script setup lang="ts">
import { CalendarDays, CalendarPlus, ChevronDown, Loader2, Plus, Repeat, Trash2, Wallet } from '@lucide/vue'
import { ptBR } from 'date-fns/locale'
import { computed, reactive, ref } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatSaoPauloWallAsLocalPreview, formatSessionInstantInSaoPaulo } from '@/shared/lib/datetime-br'
import { notify } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { Input } from '@/shared/ui/input'
import { NativeSelect } from '@/shared/ui/native-select'
import { Textarea } from '@/shared/ui/textarea'
import { buildSessionsPayload, defaultRecurrenceCount, RECURRENCE_COUNTS, RECURRENCE_LABELS, type RecurrenceType, type SessionDraft } from '../recurrence'
import { SESSION_STATUS_LABELS, type CreateSessionData, type SessionStatus } from '../types'

type Mode = 'single' | 'recurring' | 'multi'

defineProps<{ priceSession?: number | null; saving?: boolean }>()
const emit = defineEmits<{ submit: [sessions: CreateSessionData[], recurrenceLabel: string | null]; cancel: [] }>()
const privacy = usePrivacyMode()

const MODES: { value: Mode; label: string; icon: typeof CalendarPlus }[] = [
  { value: 'single', label: 'Sessão única', icon: CalendarPlus },
  { value: 'recurring', label: 'Recorrente', icon: Repeat },
  { value: 'multi', label: 'Várias datas', icon: CalendarDays },
]
const FREQUENCIES: { value: RecurrenceType; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
]
const DURATIONS = [30, 45, 50, 60, 90]
const STATUSES: SessionStatus[] = ['scheduled', 'completed', 'rescheduled', 'no_show', 'cancelled']

const initial = () => ({
  mode: 'single' as Mode,
  rows: [{ date: '', time: '' }],
  duration: 50 as number | null,
  status: 'scheduled' as SessionStatus,
  notes: '',
  recType: 'weekly' as RecurrenceType,
  recCount: 4,
})
const f = reactive(initial())
const advancedOpen = ref(false)
const today = new Date().toISOString().split('T')[0]

const first = computed(() => f.rows[0])
const setMode = (m: Mode) => {
  f.mode = m
  if (m !== 'multi') f.rows.splice(1) // só "Várias datas" usa mais de uma linha
}
const setFrequency = (t: RecurrenceType) => ((f.recType = t), (f.recCount = defaultRecurrenceCount(t)))
const addRow = () => f.rows.push({ date: '', time: first.value.time })
const drafts = computed<SessionDraft[]>(() => f.rows.map((r) => ({ date: r.date, time: r.time, duration: f.duration, status: f.status, notes: f.notes })))
const recurrence = computed(() => (f.mode === 'recurring' ? { type: f.recType, count: f.recCount } : undefined))

// prévia das datas que serão criadas (horário de Brasília)
const payload = computed(() => (drafts.value.every((d) => d.date && d.time) ? buildSessionsPayload(drafts.value, recurrence.value) : []))
const dateChips = computed(() => payload.value.map((s) => formatSessionInstantInSaoPaulo(s.session_date, "EEE dd/MM", { locale: ptBR }).replace('.', '')))
const total = computed(() => (f.mode === 'recurring' ? f.recCount : f.rows.length))
const summary = computed(() => (total.value === 1 ? '1 sessão será criada' : `${total.value} sessões serão criadas`))

// só avisa sobre fuso quando o horário local é diferente do de Brasília
const localHint = (d: { date: string; time: string }) => {
  if (!d.date || !d.time) return undefined
  const local = formatSaoPauloWallAsLocalPreview(d.date, d.time, "HH:mm")
  return local === d.time ? undefined : `No seu fuso: ${formatSaoPauloWallAsLocalPreview(d.date, d.time, "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}`
}

function submit() {
  if (f.rows.some((r) => !r.date || !r.time)) return notify.error('Faltam dados', 'Preencha a data e o horário de todas as sessões.')
  emit('submit', buildSessionsPayload(drafts.value, recurrence.value), f.mode === 'recurring' ? RECURRENCE_LABELS[f.recType] : null)
}
defineExpose({ reset: () => (Object.assign(f, initial()), (advancedOpen.value = false)) })
</script>

<template>
  <form class="space-y-5" @submit.prevent="submit">
    <!-- tipo de agendamento -->
    <div role="tablist" aria-label="Tipo de agendamento" class="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      <button
        v-for="m in MODES" :key="m.value" type="button" role="tab" :aria-selected="f.mode === m.value"
        :class="cn('flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors', f.mode === m.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')"
        @click="setMode(m.value)"
      ><component :is="m.icon" class="size-4 shrink-0" /><span class="truncate">{{ m.label }}</span></button>
    </div>

    <!-- data e horário -->
    <div v-if="f.mode !== 'multi'" class="grid gap-4 sm:grid-cols-2">
      <FormField v-slot="{ id }" :label="f.mode === 'recurring' ? 'Primeira sessão' : 'Data'" required>
        <Input :id="id" v-model="first.date" type="date" :min="today" required />
      </FormField>
      <FormField v-slot="{ id }" label="Horário" required :hint="localHint(first) ?? 'Horário de Brasília'">
        <Input :id="id" v-model="first.time" type="time" required />
      </FormField>
    </div>

    <div v-else class="space-y-2">
      <p class="text-sm font-medium">Datas e horários <span class="font-normal text-muted-foreground">(Brasília)</span></p>
      <div v-for="(r, i) in f.rows" :key="i" class="flex items-center gap-2">
        <span class="w-5 shrink-0 text-center text-sm text-muted-foreground">{{ i + 1 }}</span>
        <Input v-model="r.date" type="date" :min="today" required class="min-w-0 flex-1" :aria-label="`Data da sessão ${i + 1}`" />
        <Input v-model="r.time" type="time" required class="w-32 shrink-0" :aria-label="`Horário da sessão ${i + 1}`" />
        <Button type="button" variant="ghost" size="icon" class="size-9 shrink-0" :disabled="f.rows.length === 1" aria-label="Remover data" @click="f.rows.splice(i, 1)"><Trash2 class="size-4 text-destructive" /></Button>
      </div>
      <Button type="button" variant="outline" size="sm" @click="addRow"><Plus /> Adicionar data</Button>
    </div>

    <!-- duração -->
    <FormField label="Duração">
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="d in DURATIONS" :key="d" type="button" :class="cn('rounded-full border px-3 py-1 text-sm transition-colors', f.duration === d ? 'border-brand bg-brand-100 font-medium text-brand-900' : 'hover:bg-muted')" @click="f.duration = d">{{ d }} min</button>
        <Input :model-value="f.duration && !DURATIONS.includes(f.duration) ? f.duration : ''" type="number" min="5" max="300" step="5" inputmode="numeric" placeholder="Outro" class="h-8 w-24" aria-label="Duração personalizada em minutos" @update:model-value="(v) => (f.duration = v ? Number(v) : 50)" />
      </div>
    </FormField>

    <!-- recorrência -->
    <div v-if="f.mode === 'recurring'" class="space-y-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
      <FormField label="Repetir">
        <div class="inline-flex rounded-lg bg-background p-1 shadow-xs">
          <button v-for="o in FREQUENCIES" :key="o.value" type="button" :class="cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', f.recType === o.value ? 'bg-brand-100 text-brand-900' : 'text-muted-foreground hover:text-foreground')" @click="setFrequency(o.value)">{{ o.label }}</button>
        </div>
      </FormField>
      <FormField v-slot="{ id }" label="Total de sessões" hint="Contando com a primeira data.">
        <NativeSelect :id="id" v-model.number="f.recCount" class="h-10 w-full sm:w-64">
          <option v-for="c in RECURRENCE_COUNTS[f.recType]" :key="c.value" :value="c.value">{{ c.label }}</option>
        </NativeSelect>
      </FormField>
    </div>

    <!-- prévia -->
    <div v-if="dateChips.length > 1" class="space-y-2">
      <p class="text-sm font-medium">Datas que serão criadas</p>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="(c, i) in dateChips.slice(0, 8)" :key="i" class="rounded-md bg-muted px-2 py-1 text-xs capitalize">{{ c }}</span>
        <span v-if="dateChips.length > 8" class="px-1 py-1 text-xs text-muted-foreground">+{{ dateChips.length - 8 }} datas</span>
      </div>
    </div>

    <!-- opções adicionais -->
    <Collapsible v-model:open="advancedOpen">
      <CollapsibleTrigger as-child>
        <button type="button" class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ChevronDown :class="cn('size-4 transition-transform', advancedOpen && 'rotate-180')" /> Opções adicionais (status e notas)</button>
      </CollapsibleTrigger>
      <CollapsibleContent class="space-y-4 pt-3">
        <FormField v-slot="{ id }" label="Status inicial" hint="Use outro status só para registrar sessões que já aconteceram.">
          <NativeSelect :id="id" v-model="f.status" class="h-10 w-full sm:w-64"><option v-for="s in STATUSES" :key="s" :value="s">{{ SESSION_STATUS_LABELS[s] }}</option></NativeSelect>
        </FormField>
        <FormField v-slot="{ id }" label="Notas"><Textarea :id="id" v-model="f.notes" rows="3" placeholder="Anotações sobre a sessão (opcional)" /></FormField>
      </CollapsibleContent>
    </Collapsible>

    <!-- rodapé -->
    <div class="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-sm">
        <p class="font-medium">{{ summary }}</p>
        <p v-if="priceSession" class="flex items-center gap-1.5 text-muted-foreground"><Wallet class="size-4" /> {{ privacy.money(priceSession) }} por sessão (valor padrão do paciente)</p>
      </div>
      <div class="flex gap-2">
        <Button type="button" variant="outline" class="flex-1 sm:flex-none" @click="emit('cancel')">Cancelar</Button>
        <Button type="submit" class="flex-1 sm:flex-none" :disabled="saving"><Loader2 v-if="saving" class="animate-spin" /><CalendarPlus v-else />{{ saving ? 'Criando...' : total === 1 ? 'Criar sessão' : `Criar ${total} sessões` }}</Button>
      </div>
    </div>
  </form>
</template>
