<script setup lang="ts">
import { Calendar, CheckCircle2, User } from '@lucide/vue'
import { computed } from 'vue'
import { ptBR } from 'date-fns/locale'
import SessionActionsMenu from '@/features/sessions/components/SessionActionsMenu.vue'
import { SESSION_STATUS_MAP } from '@/features/sessions/status'
import type { Session, SessionStatus } from '@/features/sessions/types'
import type { GoogleCalendarEvent } from '@/features/settings/google.api'
import EmptyState from '@/shared/components/EmptyState.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatSessionInstantInLocalTimezone, formatSessionInstantInSaoPaulo, isSameSaoPauloCalendarDay } from '@/shared/lib/datetime-br'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { googleEventStyle } from '../googleColors'

const props = defineProps<{ day: Date; sessions: Session[]; events: GoogleCalendarEvent[] }>()
const emit = defineEmits<{
  openSession: [s: Session]; editSession: [s: Session]; openEvent: [e: GoogleCalendarEvent]
  complete: [s: Session]; noShow: [s: Session]; reschedule: [s: Session]; cancel: [s: Session]; delete: [s: Session]; status: [s: Session, status: SessionStatus]
}>()
const privacy = usePrivacyMode()

const title = computed(() => formatSessionInstantInSaoPaulo(props.day.toISOString(), "EEEE, dd 'de' MMMM", { locale: ptBR }))
const linked = computed(() => new Set(props.sessions.map((s) => s.google_event_id).filter((id): id is string => !!id)))
const daySessions = computed(() => props.sessions.filter((s) => isSameSaoPauloCalendarDay(s.session_date, props.day)).sort((a, b) => +new Date(a.session_date) - +new Date(b.session_date)))
const dayEvents = computed(() => props.events.filter((e) => !linked.value.has(e.id) && isSameSaoPauloCalendarDay(e.start, props.day)).sort((a, b) => +new Date(a.start) - +new Date(b.start)))
const time = (iso: string) => formatSessionInstantInLocalTimezone(iso, 'HH:mm')
const canComplete = (s: Session) => s.status !== 'completed' && s.status !== 'no_show' && s.status !== 'cancelled'
</script>

<template>
  <section class="min-w-0 space-y-3">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="text-lg font-semibold first-letter:uppercase">Sessões de {{ title }}</h3>
      <span class="text-sm text-muted-foreground">{{ daySessions.length }} {{ daySessions.length === 1 ? 'sessão' : 'sessões' }}<template v-if="dayEvents.length"> · {{ dayEvents.length }} do Google</template></span>
    </div>

    <EmptyState v-if="!daySessions.length && !dayEvents.length" :icon="Calendar" title="Nenhuma sessão neste dia" description="Para agendar, abra o paciente e use a aba Sessões." />

    <div class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
    <Card v-for="s in daySessions" :key="s.id" class="min-w-0 cursor-pointer transition-shadow hover:shadow-md" @click="emit('openSession', s)">
      <CardContent class="flex items-start gap-3">
        <div class="flex min-w-16 flex-col items-center rounded-lg bg-brand-50 px-2 py-2.5">
          <span class="text-xl font-bold text-brand-800 dark:text-brand">{{ time(s.session_date) }}</span>
          <span v-if="s.duration" class="text-[11px] text-muted-foreground">{{ s.duration }} min</span>
        </div>
        <div class="min-w-0 flex-1 space-y-1">
          <p class="flex items-center gap-1.5 font-semibold"><User class="size-4 shrink-0 text-muted-foreground" /><span class="truncate">{{ s.patient?.name ? privacy.name(s.patient.name) : 'Sem paciente' }}</span></p>
          <p v-if="s.patient?.email" class="truncate text-xs text-muted-foreground">{{ privacy.email(s.patient.email) }}</p>
          <p v-if="s.notes" class="line-clamp-2 rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">{{ s.notes }}</p>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-2" @click.stop>
          <StatusBadge :status="s.status" :map="SESSION_STATUS_MAP" />
          <div class="flex items-center gap-1">
            <Button v-if="canComplete(s)" size="sm" class="h-8 bg-success text-white hover:bg-success/90" @click="emit('complete', s)"><CheckCircle2 /> Realizada</Button>
            <SessionActionsMenu
              :session="s" :has-report="false" :report-loading="false" hide-report hide-quick show-edit
              @no-show="emit('noShow', s)" @reschedule="emit('reschedule', s)" @cancel="emit('cancel', s)" @delete="emit('delete', s)"
              @edit="emit('editSession', s)" @status="emit('status', s, $event)"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-for="e in dayEvents" :key="e.id" class="cursor-pointer border transition-shadow hover:shadow-md" :style="googleEventStyle(e.colorId)" @click="emit('openEvent', e)">
      <CardContent class="flex items-center gap-3">
        <span class="rounded-lg bg-black/10 px-3 py-2 text-xl font-bold">{{ time(e.start) }}</span>
        <div class="min-w-0">
          <p class="truncate font-semibold">{{ e.summary }}</p>
          <Badge variant="outline" class="mt-1 border-current text-[11px] opacity-90">Google Calendar</Badge>
        </div>
      </CardContent>
    </Card>
    </div>
  </section>
</template>
