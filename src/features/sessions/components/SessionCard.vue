<script setup lang="ts">
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2 } from '@lucide/vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatSessionInstantInSaoPaulo } from '@/shared/lib/datetime-br'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { fmtBrasilia, fmtDayNum, fmtTime, fmtMonthShort, fmtWeekday, formatSessionTimeRange, isPendingRecord } from '../format'
import { SESSION_STATUS_MAP } from '../status'
import type { Session, SessionStatus } from '../types'
import SessionActionsMenu from './SessionActionsMenu.vue'

const props = defineProps<{ session: Session; hasReport: boolean; reportLoading: boolean; statusLoading: boolean }>()
const emit = defineEmits<{ status: [status: SessionStatus]; report: []; complete: []; noShow: []; reschedule: []; delete: [] }>()
const needsRecord = () => isPendingRecord(props.session)
// só mostra o horário do paciente quando ele difere do horário local (psicóloga em outro fuso)
const differs = () => fmtTime(props.session.session_date) !== formatSessionInstantInSaoPaulo(props.session.session_date, 'HH:mm')
</script>

<template>
  <article :class="cn('flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md', needsRecord() && 'border-warning/40')">
    <div class="flex items-start gap-3">
      <div class="flex w-14 shrink-0 flex-col items-center rounded-xl bg-brand-50 py-2">
        <span class="text-xl font-bold leading-none text-brand-800">{{ fmtDayNum(session.session_date) }}</span>
        <span class="mt-1 text-[11px] font-medium uppercase tracking-wide text-brand-700">{{ fmtMonthShort(session.session_date) }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold capitalize">{{ fmtWeekday(session.session_date) }}</p>
        <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock class="size-3.5 shrink-0" />{{ formatSessionTimeRange(session.session_date, session.duration) }}<template v-if="session.duration"> · {{ session.duration }} min</template></p>
        <p v-if="differs()" class="text-xs text-muted-foreground">Paciente (Brasília): {{ fmtBrasilia(session.session_date) }}</p>
      </div>
      <StatusBadge :status="session.status" :map="SESSION_STATUS_MAP" class="shrink-0" />
    </div>

    <p v-if="needsRecord()" class="flex items-center gap-1.5 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs font-medium text-warning"><AlertCircle class="size-3.5 shrink-0" /> Horário já passou — registre se a sessão aconteceu.</p>
    <p v-if="session.notes" class="line-clamp-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm text-muted-foreground">{{ session.notes }}</p>

    <div class="mt-auto flex items-center gap-2 border-t pt-3">
      <Button v-if="reportLoading" variant="outline" size="sm" disabled><Loader2 class="animate-spin" /> Relatório</Button>
      <Button v-else-if="hasReport" variant="outline" size="sm" @click="emit('report')"><FileText /> Relatório</Button>
      <Button v-else variant="ghost" size="sm" class="text-muted-foreground" @click="emit('report')"><FileText /> Criar relatório</Button>

      <Button v-if="session.status !== 'completed' && session.status !== 'no_show' && session.status !== 'cancelled'" size="sm" class="ml-auto bg-success text-white hover:bg-success/90" @click="emit('complete')"><CheckCircle2 /> Realizada</Button>
      <span v-else class="ml-auto" />
      <SessionActionsMenu
        :session="session" :has-report="hasReport" :report-loading="reportLoading" :busy="statusLoading" hide-report hide-quick
        @complete="emit('complete')" @no-show="emit('noShow')" @reschedule="emit('reschedule')" @delete="emit('delete')" @status="emit('status', $event)"
      />
    </div>
  </article>
</template>
