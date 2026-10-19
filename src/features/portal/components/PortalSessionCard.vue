<script setup lang="ts">
import { Calendar, CheckCircle2, Clock } from '@lucide/vue'
import { computed } from 'vue'
import { formatSessionDay, formatSessionTimeRange } from '@/features/sessions/format'
import { SESSION_STATUS_MAP } from '@/features/sessions/status'
import type { Session } from '@/features/sessions/types'
import InfoRow from '@/shared/components/InfoRow.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { cn } from '@/shared/lib/utils'

const props = defineProps<{ session: Session; highlight?: boolean }>()
const done = computed(() => props.session.status === 'completed')
</script>

<template>
  <article :class="cn('rounded-2xl border bg-card p-4 shadow-xs', highlight && 'border-brand-300 bg-gradient-to-br from-brand-50 to-card')">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <CheckCircle2 v-if="done" class="size-5 shrink-0 text-success" />
        <Calendar v-else class="size-5 shrink-0 text-brand-600" />
        <h3 class="truncate font-medium">Sessão de terapia</h3>
      </div>
      <StatusBadge :status="session.status" :map="SESSION_STATUS_MAP" />
    </div>
    <div class="mt-3 space-y-1.5">
      <InfoRow :icon="Calendar" :text="formatSessionDay(session.session_date, true)" />
      <InfoRow :icon="Clock" :text="formatSessionTimeRange(session.session_date, session.duration)" />
    </div>
    <div v-if="session.notes" class="mt-3 rounded-xl bg-muted p-3 text-sm">
      <p class="font-medium">{{ done ? 'Resumo da sessão:' : 'Notas:' }}</p>
      <p class="mt-1 whitespace-pre-line text-muted-foreground">{{ session.notes }}</p>
    </div>
  </article>
</template>
