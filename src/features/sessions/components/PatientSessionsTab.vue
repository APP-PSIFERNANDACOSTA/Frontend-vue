<script setup lang="ts">
import { CalendarPlus, LayoutGrid, List } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppPagination from '@/shared/components/AppPagination.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { useBreakpoint } from '@/shared/composables/useBreakpoint'
import { getBrowserTimezoneLabel } from '@/shared/lib/datetime-br'
import { notify } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useAttendance } from '@/features/attendance/queries'
import { rateTone } from '@/features/attendance/rate'
import { isUpcoming } from '../format'
import {
  useChangeSessionStatus, useCompleteSession, useCreateSessions, useNoShowSession, usePatientSessions, useReportsExist,
} from '../queries'
import type { Session, SessionInitiator, SessionStatus } from '../types'
import CancelSessionDialog from './CancelSessionDialog.vue'
import RescheduleDialog from './RescheduleDialog.vue'
import SessionCard from './SessionCard.vue'
import SessionDeleteDialog from './SessionDeleteDialog.vue'
import SessionsForm from './SessionsForm.vue'
import SessionsTable from './SessionsTable.vue'

const props = defineProps<{ patientId: number; priceSession?: number | null }>()
const router = useRouter()
const { isDesktop } = useBreakpoint()

const query = usePatientSessions(() => props.patientId)
const all = computed(() => query.data.value ?? [])
const upcoming = computed(() => all.value.filter(isUpcoming).sort((a, b) => +new Date(a.session_date) - +new Date(b.session_date)))
const history = computed(() => all.value.filter((s) => !isUpcoming(s)).sort((a, b) => +new Date(b.session_date) - +new Date(a.session_date)))
const everything = computed(() => [...all.value].sort((a, b) => +new Date(b.session_date) - +new Date(a.session_date)))

type Filter = 'upcoming' | 'history' | 'all'
const filter = ref<Filter>('upcoming')
// sem sessões futuras, abre direto no histórico (só na primeira carga)
const settled = ref(false)
watch(() => query.data.value, (d) => {
  if (settled.value || !d) return
  settled.value = true
  if (!d.some(isUpcoming)) filter.value = 'history'
}, { immediate: true })
const FILTERS = computed(() => [
  { value: 'upcoming' as const, label: 'Próximas', count: upcoming.value.length },
  { value: 'history' as const, label: 'Histórico', count: history.value.length },
  { value: 'all' as const, label: 'Todas', count: all.value.length },
])
const list = computed(() => (filter.value === 'upcoming' ? upcoming.value : filter.value === 'history' ? history.value : everything.value))

const view = useStorage<'cards' | 'list'>('patient-sessions-view', 'cards')
const showTable = computed(() => view.value === 'list' && isDesktop.value)
const page = ref(1)
const perPage = ref(10)
watch([() => props.patientId, filter], () => (page.value = 1))
const pageItems = computed(() => list.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const reports = useReportsExist(() => props.patientId, all)

const showForm = ref(false)
const form = ref<InstanceType<typeof SessionsForm> | null>(null)
const create = useCreateSessions(() => props.patientId)
function onCreate(sessions: Parameters<typeof create.mutate>[0], recurrenceLabel: string | null) {
  create.mutate(sessions, {
    onSuccess: () => {
      notify.success('Sessões criadas', `${sessions.length} sessão(ões) criada(s)${recurrenceLabel ? ` (recorrência ${recurrenceLabel})` : ''}`)
      form.value?.reset()
      showForm.value = false
      filter.value = 'upcoming'
    },
  })
}

const status = useChangeSessionStatus(() => props.patientId)
const complete = useCompleteSession(() => props.patientId)
const noShow = useNoShowSession(() => props.patientId)
const busyId = computed(() =>
  status.isPending.value ? status.variables.value?.id ?? null
  : complete.isPending.value ? complete.variables.value ?? null
  : noShow.isPending.value ? noShow.variables.value ?? null : null,
)
const cancelTarget = ref<Session | null>(null)
const cancelOpen = ref(false)
// cancelar pergunta quem cancelou (conta na frequência); os demais status mudam direto
function changeStatus(s: Session, next: SessionStatus) {
  if (s.status === next) return
  if (next === 'cancelled') return void ((cancelTarget.value = s), (cancelOpen.value = true))
  status.mutate({ id: s.id, status: next })
}
const confirmCancel = (by: SessionInitiator) => cancelTarget.value && status.mutate({ id: cancelTarget.value.id, status: 'cancelled', initiated_by: by })

const rescheduleTarget = ref<Session | null>(null)
const rescheduleOpen = ref(false)
const deleteTarget = ref<Session | null>(null)
const deleteOpen = ref(false)
const openReschedule = (s: Session) => ((rescheduleTarget.value = s), (rescheduleOpen.value = true))
const openDelete = (s: Session) => ((deleteTarget.value = s), (deleteOpen.value = true))
const openReport = (sessionId: number) => router.push(`/dashboard/patients/${props.patientId}/sessions/${sessionId}/report`)
const byId = (id: number) => all.value.find((s) => s.id === id)!
const tz = getBrowserTimezoneLabel()
const attendance = useAttendance(() => ({ patient_id: props.patientId }))
const rate = computed(() => attendance.data.value?.summary.rate ?? null)
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="flex flex-wrap items-center gap-2 text-xl font-semibold">Sessões
          <span v-if="rate !== null" :class="cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', rateTone(rate).bg, rateTone(rate).text)" title="Frequência: realizadas ÷ (realizadas + faltas + remarcações e cancelamentos pelo paciente)">Frequência {{ rate }}%</span>
        </h3>
        <p v-if="tz !== 'America/Sao_Paulo'" class="text-sm text-muted-foreground">Horários no seu fuso ({{ tz }}). O cadastro usa o horário de Brasília.</p>
      </div>
      <Button class="w-full sm:w-auto" @click="showForm = true"><CalendarPlus /> Nova sessão</Button>
    </div>

    <div v-if="all.length" class="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Filtrar sessões" class="inline-flex rounded-lg bg-muted p-1">
        <button
          v-for="f in FILTERS" :key="f.value" type="button" role="tab" :aria-selected="filter === f.value"
          :class="cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', filter === f.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')"
          @click="filter = f.value"
        >{{ f.label }}<span :class="cn('rounded-full px-1.5 text-xs', filter === f.value ? 'bg-brand-100 text-brand-900' : 'bg-background/70')">{{ f.count }}</span></button>
      </div>
      <div class="hidden gap-1 lg:flex" role="group" aria-label="Modo de visualização">
        <Button size="sm" :variant="view === 'cards' ? 'default' : 'outline'" @click="view = 'cards'"><LayoutGrid /> Cards</Button>
        <Button size="sm" :variant="view === 'list' ? 'default' : 'outline'" @click="view = 'list'; page = 1"><List /> Lista</Button>
      </div>
    </div>

    <QueryState :query="query" :empty="all.length === 0">
      <template #empty>
        <EmptyState :icon="CalendarPlus" title="Nenhuma sessão ainda" description="Agende a primeira sessão deste paciente.">
          <Button @click="showForm = true"><CalendarPlus /> Nova sessão</Button>
        </EmptyState>
      </template>

      <EmptyState v-if="!list.length" :icon="CalendarPlus" :title="filter === 'upcoming' ? 'Nenhuma sessão futura' : 'Nada por aqui'" :description="filter === 'upcoming' ? 'Não há sessões agendadas para os próximos dias.' : 'Nenhuma sessão neste filtro.'" />
      <template v-else-if="showTable">
        <SessionsTable
          :sessions="pageItems" :has-report="reports.has" :report-loading="reports.loading" :busy-id="busyId"
          @status="(id, s) => changeStatus(byId(id), s)" @report="openReport" @complete="complete.mutate" @no-show="noShow.mutate"
          @reschedule="openReschedule" @delete="openDelete"
        />
        <AppPagination v-if="list.length > perPage" v-model:page="page" v-model:per-page="perPage" :total="list.length" />
      </template>
      <template v-else>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SessionCard
            v-for="s in pageItems" :key="s.id" :session="s"
            :has-report="reports.has(s.id)" :report-loading="reports.loading(s.id)" :status-loading="busyId === s.id"
            @status="changeStatus(s, $event)" @report="openReport(s.id)" @complete="complete.mutate(s.id)" @no-show="noShow.mutate(s.id)"
            @reschedule="openReschedule(s)" @delete="openDelete(s)"
          />
        </div>
        <AppPagination v-if="list.length > perPage" v-model:page="page" v-model:per-page="perPage" :total="list.length" />
      </template>
    </QueryState>

    <ResponsiveDialog v-model:open="showForm" title="Nova sessão" description="Agende uma sessão, uma série recorrente ou várias datas." content-class="sm:max-w-2xl">
      <SessionsForm ref="form" :price-session="priceSession" :saving="create.isPending.value" @submit="onCreate" @cancel="showForm = false" />
    </ResponsiveDialog>

    <CancelSessionDialog v-model:open="cancelOpen" @confirm="confirmCancel" />
    <RescheduleDialog v-model:open="rescheduleOpen" :session="rescheduleTarget" :patient-id="patientId" />
    <SessionDeleteDialog v-model:open="deleteOpen" :session="deleteTarget" />
  </div>
</template>
