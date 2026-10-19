<script setup lang="ts">
import { CheckCircle2, XCircle } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { monthSessionStats } from '@/features/dashboard/metrics'
import CancelSessionDialog from '@/features/sessions/components/CancelSessionDialog.vue'
import RescheduleDialog from '@/features/sessions/components/RescheduleDialog.vue'
import SessionDeleteDialog from '@/features/sessions/components/SessionDeleteDialog.vue'
import type { Session, SessionInitiator, SessionStatus } from '@/features/sessions/types'
import type { GoogleCalendarEvent } from '@/features/settings/google.api'
import ErrorState from '@/shared/components/ErrorState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatSessionInstantInSaoPaulo, getBrazilWallDateKey, getSaoPauloTodayNoonDate } from '@/shared/lib/datetime-br'
import { storage } from '@/shared/lib/storage'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import DayPanel from '../components/DayPanel.vue'
import GoogleCalendarBar from '../components/GoogleCalendarBar.vue'
import GoogleEventDialog from '../components/GoogleEventDialog.vue'
import MonthGrid from '../components/MonthGrid.vue'
import ScheduleStats from '../components/ScheduleStats.vue'
import SessionDetailsDialog from '../components/SessionDetailsDialog.vue'
import AgendaList from '../components/AgendaList.vue'
import CalendarToolbar from '../components/CalendarToolbar.vue'
import TimeGrid from '../components/TimeGrid.vue'
import { VIEW_OPTIONS, daysToUtcRange, shiftAnchor, viewTitle, visibleDays, type CalendarView } from '../calendar'
import { useGoogleEventsRange, useGoogleStatus, useMarkSession, useSessionsRange, useUpdateSession } from '../queries'

const route = useRoute()
const router = useRouter()
const qc = useQueryClient()

const VIEW_KEY = 'schedule-view'
const saved = storage.get(VIEW_KEY) as CalendarView | null
const view = ref<CalendarView>(VIEW_OPTIONS.some((o) => o.value === saved) ? (saved as CalendarView) : 'month')
watch(view, (v) => storage.set(VIEW_KEY, v))

/** `anchor` = período navegado; `selectedDay` = dia cujas sessões aparecem abaixo do calendário. */
const anchor = ref(getSaoPauloTodayNoonDate())
const selectedDay = ref(getSaoPauloTodayNoonDate())
const selectedKey = computed(() => getBrazilWallDateKey(selectedDay.value))
const days = computed(() => visibleDays(view.value, anchor.value))
const range = computed(() => daysToUtcRange(days.value))
const title = computed(() => viewTitle(view.value, anchor.value))
const monthKey = computed(() => getBrazilWallDateKey(anchor.value).slice(0, 7))

const sessionsQuery = useSessionsRange(range)
const sessions = computed(() => sessionsQuery.data.value ?? [])
// números do período em foco (mês/lista: só o mês; semana e dia: só os dias exibidos)
const periodSessions = computed(() => {
  const keys = new Set(days.value.map((d) => getBrazilWallDateKey(d)))
  const monthly = view.value === 'month' || view.value === 'list'
  return sessions.value.filter((s) => {
    const k = formatSessionInstantInSaoPaulo(s.session_date, 'yyyy-MM-dd')
    return monthly ? k.startsWith(monthKey.value) : keys.has(k)
  })
})
const stats = computed(() => monthSessionStats(periodSessions.value))

const google = useGoogleStatus()
const googleConnected = computed(() => !!google.data.value?.connected)
const events = useGoogleEventsRange(range, googleConnected)
const googleEvents = computed(() => events.data.value ?? [])

// Detalhes da sessão: guarda só o id e relê da lista, assim o diálogo se atualiza após cada ação
const selectedId = ref<number | null>(null)
const detailsOpen = ref(false)
const startInEdit = ref(false)
const selected = computed(() => sessions.value.find((s) => s.id === selectedId.value) ?? null)
const openSession = (s: Session, edit = false) => ((selectedId.value = s.id), (startInEdit.value = edit), (detailsOpen.value = true))
watch(selected, (s) => !s && detailsOpen.value && (detailsOpen.value = false))

const eventOpen = ref(false)
const selectedEvent = ref<GoogleCalendarEvent | null>(null)
const openEvent = (e: GoogleCalendarEvent) => ((selectedEvent.value = e), (eventOpen.value = true))

const deleteOpen = ref(false)
const deleteTarget = ref<Session | null>(null)
const askDelete = (s: Session) => ((deleteTarget.value = s), (deleteOpen.value = true))

// ações rápidas direto da agenda (sem precisar abrir o perfil do paciente)
const rescheduleTarget = ref<Session | null>(null)
const rescheduleOpen = ref(false)
const askReschedule = (s: Session) => ((rescheduleTarget.value = s), (rescheduleOpen.value = true))
const cancelTarget = ref<Session | null>(null)
const cancelOpen = ref(false)
const askCancel = (s: Session) => ((cancelTarget.value = s), (cancelOpen.value = true))
const complete = useMarkSession('complete')
const noShow = useMarkSession('no-show')
const update = useUpdateSession()
const ref_ = (s: Session) => ({ patientId: s.patient_id, id: s.id })
const confirmCancel = (by: SessionInitiator) => cancelTarget.value && update.mutate({ ...ref_(cancelTarget.value), data: { status: 'cancelled', initiated_by: by } }, { onSuccess: () => notify.success('Sessão cancelada') })
function changeStatus(s: Session, status: SessionStatus) {
  if (status === s.status) return
  if (status === 'cancelled') return askCancel(s) // pergunta quem cancelou
  update.mutate({ ...ref_(s), data: { status } }, { onSuccess: () => notify.success('Status atualizado') })
}

/** Navegar move o dia selecionado junto, para o painel de baixo acompanhar o calendário. */
function move(dir: 1 | -1) {
  anchor.value = shiftAnchor(view.value, anchor.value, dir)
  selectedDay.value = shiftAnchor(view.value, selectedDay.value, dir)
}
function goToday() {
  anchor.value = getSaoPauloTodayNoonDate()
  selectedDay.value = getSaoPauloTodayNoonDate()
}
const selectDay = (d: Date) => {
  selectedDay.value = d
  if (view.value === 'day') anchor.value = new Date(d.getTime())
  else if (view.value === 'month' && getBrazilWallDateKey(d).slice(0, 7) !== monthKey.value) anchor.value = new Date(d.getTime())
}
// trocar de visão mantém o dia selecionado como referência
watch(view, () => (anchor.value = new Date(selectedDay.value.getTime())))

// retorno do consentimento do Google: ?google_connected=true
onMounted(() => {
  if (route.query.google_connected === 'true') {
    notify.success('Google Calendar conectado!', 'Suas sessões serão sincronizadas automaticamente')
    qc.invalidateQueries({ queryKey: ['google'] })
    router.replace({ path: route.path })
  }
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Agenda" description="Visualize e gerencie todas as suas sessões em formato de calendário">
      <template #actions>
        <StatusBadge v-if="!google.isPending.value && googleConnected" tone="success"><CheckCircle2 class="size-3" /> Google conectado</StatusBadge>
        <StatusBadge v-if="google.data.value?.expired" tone="danger"><XCircle class="size-3" /> Conexão expirada</StatusBadge>
        <GoogleCalendarBar :connected="googleConnected" :checking="google.isPending.value" :loading-events="events.isFetching.value" :events-error="events.isError.value" @refresh="events.refetch()" />
        <Button as-child><RouterLink to="/dashboard/patients">Agendar sessão</RouterLink></Button>
      </template>
    </PageHeader>

    <ScheduleStats :stats="stats" :loading="sessionsQuery.isPending.value" />

    <ErrorState v-if="sessionsQuery.isError.value && !sessionsQuery.data.value" message="Não foi possível carregar as sessões." @retry="sessionsQuery.refetch()" />

    <template v-else>
      <Card>
        <CardContent class="space-y-4">
          <CalendarToolbar v-model:view="view" :title="title" :loading="sessionsQuery.isFetching.value && !sessionsQuery.isPending.value" @prev="move(-1)" @next="move(1)" @today="goToday" />
          <p v-if="events.isError.value" class="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs">Não foi possível buscar os eventos do Google neste período. Use "Repuxar eventos do Google".</p>

          <MonthGrid v-if="view === 'month'" :month="anchor" :sessions="sessions" :events="googleEvents" :selected-key="selectedKey" @select-day="selectDay" @open-session="openSession($event)" @open-event="openEvent" />
          <TimeGrid v-else-if="view === 'week' || view === 'day'" :days="days" :sessions="sessions" :events="googleEvents" :selected-key="selectedKey" @select-day="selectDay" @open-session="openSession($event)" @open-event="openEvent" />
          <AgendaList v-else :month-key="monthKey" :sessions="sessions" :events="googleEvents" @open-session="openSession($event)" @open-event="openEvent" />
        </CardContent>
      </Card>

      <DayPanel v-if="view !== 'list'" :day="selectedDay" :sessions="sessions" :events="googleEvents" @open-session="openSession($event)" @edit-session="openSession($event, true)" @open-event="openEvent"
        @complete="complete.mutate(ref_($event))" @no-show="noShow.mutate(ref_($event))" @reschedule="askReschedule" @cancel="askCancel" @delete="askDelete" @status="changeStatus" />
    </template>

    <SessionDetailsDialog v-model:open="detailsOpen" :session="selected" :start-in-edit="startInEdit" @delete="askDelete" @reschedule="(s) => ((detailsOpen = false), askReschedule(s))" />
    <RescheduleDialog v-model:open="rescheduleOpen" :session="rescheduleTarget" :patient-id="rescheduleTarget?.patient_id ?? 0" />
    <CancelSessionDialog v-model:open="cancelOpen" @confirm="confirmCancel" />
    <SessionDeleteDialog v-model:open="deleteOpen" :session="deleteTarget" />
    <GoogleEventDialog v-model:open="eventOpen" :event="selectedEvent" />
  </div>
</template>
