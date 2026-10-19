<script setup lang="ts">
import { MOOD_ENABLED } from '@/features/mood/feature'
import { Calendar, CalendarClock, CheckCircle2, ChevronRight, Clock, PartyPopper, UserRound, UserX } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { format, formatDistanceStrict } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import MoodWeekStrip from '@/features/mood/components/MoodWeekStrip.vue'
import { useMarkSession } from '@/features/schedule/queries'
import type { Session } from '@/features/sessions/types'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { Button } from '@/shared/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

const props = defineProps<{ sessions: Session[]; upcoming: Session | null; loading: boolean }>()
const privacy = usePrivacyMode()
const complete = useMarkSession('complete')

// relógio do cartão (contagem regressiva e "em andamento")
const now = ref(Date.now())
useIntervalFn(() => (now.value = Date.now()), 30_000)

const start = (s: Session) => +new Date(s.session_date)
const end = (s: Session) => start(s) + (s.duration || 50) * 60_000
const isOpen = (s: Session) => s.status === 'scheduled' || s.status === 'rescheduled'

const total = computed(() => props.sessions.length)
const done = computed(() => props.sessions.filter((s) => s.status === 'completed').length)
const missed = computed(() => props.sessions.filter((s) => s.status === 'no_show').length)
// concluída = já tem desfecho (realizada ou falta); é isso que fecha a agenda do dia
const finished = computed(() => props.sessions.filter((s) => s.status === 'completed' || s.status === 'no_show'))
const percent = computed(() => (total.value ? Math.round((finished.value.length / total.value) * 100) : 0))
const allDone = computed(() => total.value > 0 && finished.value.length === total.value)
const minutes = computed(() => props.sessions.filter((s) => s.status === 'completed').reduce((a, s) => a + (s.duration || 50), 0))
const hoursLabel = computed(() => {
  const h = Math.floor(minutes.value / 60)
  const m = minutes.value % 60
  return h ? `${h}h${m ? ` ${m}min` : ''}` : `${m}min`
})
// próxima = primeira ainda aberta que não terminou; as já passadas e não registradas viram "aguardando registro"
const queue = computed(() => props.sessions.filter((s) => isOpen(s) && end(s) > now.value))
const awaiting = computed(() => props.sessions.filter((s) => isOpen(s) && end(s) <= now.value).length)
const next = computed(() => queue.value[0] ?? null)
const rest = computed(() => queue.value.slice(1))
const shown = computed(() => rest.value.slice(0, 3))

const time = (s: Session) => format(new Date(s.session_date), 'HH:mm')
const name = (s: Session) => (s.patient?.name ? privacy.name(s.patient.name) : 'Sem paciente')
const inProgress = computed(() => !!next.value && start(next.value) <= now.value)
const when = computed(() => {
  if (!next.value) return ''
  if (inProgress.value) return 'Em andamento agora'
  return `Começa em ${formatDistanceStrict(start(next.value), now.value, { locale: ptBR })}`
})
const upcomingLabel = computed(() => (props.upcoming ? format(new Date(props.upcoming.session_date), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR }) : ''))
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base">
        <Calendar class="size-5 text-brand-600" /> Agenda de hoje
        <span v-if="!loading && total && !privacy.enabled.value" class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">{{ total }}</span>
      </CardTitle>
      <CardAction><Button variant="ghost" size="sm" as-child><RouterLink to="/dashboard/schedule">Agenda <ChevronRight /></RouterLink></Button></CardAction>
    </CardHeader>

    <CardContent class="flex flex-col gap-4">
      <div v-if="loading" class="space-y-3"><Skeleton class="h-4 w-full" /><Skeleton class="h-28 w-full" /><Skeleton class="h-10 w-full" /></div>

      <template v-else>
        <!-- progresso do dia (rosa da marca) -->
        <div v-if="total" class="space-y-1.5">
          <div class="flex items-baseline justify-between text-sm">
            <span class="font-medium">Progresso do dia</span>
            <span class="text-muted-foreground"><strong class="text-foreground">{{ finished.length }}</strong> de {{ total }} concluída{{ total === 1 ? '' : 's' }}<template v-if="missed"> · {{ missed }} falta{{ missed === 1 ? '' : 's' }}</template></span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-brand-100" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso do dia">
            <div class="h-full rounded-full bg-brand-500 transition-all duration-500" :style="{ width: `${percent}%` }" />
          </div>
        </div>

        <!-- próxima sessão -->
        <div v-if="next" class="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-brand-700">{{ inProgress ? 'Sessão atual' : 'Próxima sessão' }}</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-brand-800"><Clock class="size-3" /> {{ when }}</span>
          </div>
          <div class="mt-2 flex items-center gap-4">
            <span class="text-4xl font-bold tabular-nums leading-none text-brand-800">{{ time(next) }}</span>
            <div class="min-w-0">
              <p class="truncate text-lg font-semibold">{{ name(next) }}</p>
              <p class="text-sm text-muted-foreground">{{ next.duration ? `${next.duration} min` : 'Duração não definida' }}</p>
            </div>
          </div>
          <MoodWeekStrip v-if="MOOD_ENABLED" :patient-id="next.patient_id" class="mt-3" />
          <div class="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" as-child><RouterLink :to="`/dashboard/patients/${next.patient_id}`"><UserRound /> Ver paciente</RouterLink></Button>
            <Button size="sm" :disabled="complete.isPending.value" @click="complete.mutate({ patientId: next.patient_id, id: next.id })"><CheckCircle2 /> Marcar como realizada</Button>
          </div>
        </div>

        <!-- agenda do dia 100% concluída -->
        <div v-else-if="allDone" class="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-100 to-brand-50 p-5 text-center">
          <PartyPopper class="mx-auto mb-2 size-9 text-brand-700" />
          <p class="text-lg font-semibold">Parabéns! Você concluiu 100% da sua agenda de hoje</p>
          <p class="mt-1 text-sm text-muted-foreground">
            <strong class="text-foreground">{{ done }}</strong> atendimento{{ done === 1 ? '' : 's' }} realizado{{ done === 1 ? '' : 's' }}<template v-if="done"> · {{ hoursLabel }} de sessão</template><template v-if="missed"> · {{ missed }} falta{{ missed === 1 ? '' : 's' }}</template>
          </p>
          <p v-if="upcoming" class="mt-3 text-xs text-muted-foreground">Próxima: <span class="font-medium text-foreground">{{ upcomingLabel }}</span><template v-if="!privacy.enabled.value"> com {{ name(upcoming) }}</template></p>
        </div>

        <!-- dia sem mais sessões: mostra a próxima futura para o cartão não ficar vazio -->
        <div v-else class="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4 text-center">
          <component :is="total && !awaiting ? PartyPopper : CalendarClock" class="mx-auto mb-2 size-8 text-brand-600" />
          <p class="font-medium">{{ !total ? 'Nenhuma sessão hoje' : awaiting ? 'Sem mais atendimentos por hoje' : 'Atendimentos de hoje concluídos' }}</p>
          <p v-if="upcoming" class="mt-1 text-sm text-muted-foreground">Próxima: <span class="font-medium text-foreground first-letter:uppercase">{{ upcomingLabel }}</span><template v-if="!privacy.enabled.value"> com {{ name(upcoming) }}</template></p>
          <p v-else class="mt-1 text-sm text-muted-foreground">Não há sessões agendadas nos próximos dias.</p>
        </div>

        <p v-if="awaiting" class="flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning"><Clock class="size-3.5 shrink-0" /> {{ awaiting }} sessão(ões) de hoje aguardando registro — <RouterLink to="/dashboard/schedule" class="underline">abrir agenda</RouterLink></p>

        <!-- já feitas hoje (realizadas e faltas), mais recentes primeiro -->
        <div v-if="finished.length && !allDone" class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feitas hoje</p>
          <ul class="divide-y">
            <li v-for="s in [...finished].reverse().slice(0, 3)" :key="s.id">
              <RouterLink :to="`/dashboard/patients/${s.patient_id}`" class="flex items-center gap-3 py-2 text-sm opacity-80 hover:opacity-100">
                <span class="w-12 shrink-0 tabular-nums text-muted-foreground">{{ time(s) }}</span>
                <span class="min-w-0 flex-1 truncate">{{ name(s) }}</span>
                <span v-if="s.status === 'completed'" class="inline-flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 class="size-3.5" /> Realizada</span>
                <span v-else class="inline-flex items-center gap-1 text-xs font-medium text-warning"><UserX class="size-3.5" /> Falta</span>
              </RouterLink>
            </li>
          </ul>
          <p v-if="finished.length > 3" class="text-xs text-muted-foreground">+{{ finished.length - 3 }} concluída(s)</p>
        </div>

        <!-- demais sessões do dia (no máximo 3, para o cartão não crescer) -->
        <div v-if="rest.length" class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">A seguir</p>
          <ul class="divide-y">
            <li v-for="s in shown" :key="s.id">
              <RouterLink :to="`/dashboard/patients/${s.patient_id}`" class="flex items-center gap-3 py-2 text-sm hover:opacity-80">
                <span class="w-12 shrink-0 font-semibold tabular-nums text-brand-700">{{ time(s) }}</span>
                <span class="min-w-0 flex-1 truncate">{{ name(s) }}</span>
                <span class="text-xs text-muted-foreground">{{ s.duration ? `${s.duration} min` : '' }}</span>
              </RouterLink>
            </li>
          </ul>
          <RouterLink v-if="rest.length > shown.length" to="/dashboard/schedule" class="inline-block pt-1 text-sm font-medium text-brand-700 hover:underline">+{{ rest.length - shown.length }} na agenda</RouterLink>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
