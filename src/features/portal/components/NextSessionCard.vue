<script setup lang="ts">
import { Calendar, Clock } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatSessionDay, formatSessionTimeRange, isUpcoming } from '@/features/sessions/format'
import { useMySessions } from '@/features/sessions/queries'
import { SESSION_STATUS_MAP } from '@/features/sessions/status'
import InfoRow from '@/shared/components/InfoRow.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const q = useMySessions()
const next = computed(
  () =>
    (q.data.value ?? [])
      .filter(isUpcoming)
      .sort((a, b) => +new Date(a.session_date) - +new Date(b.session_date))[0] ?? null,
)
</script>

<template>
  <SectionCard title="Próxima sessão" :icon="Calendar">
    <div v-if="q.isPending.value" class="space-y-2"><Skeleton class="h-5 w-24" /><Skeleton class="h-4 w-2/3" /></div>

    <div v-else-if="next" class="space-y-3">
      <StatusBadge :status="next.status" :map="SESSION_STATUS_MAP" />
      <div class="space-y-1.5">
        <InfoRow :icon="Calendar" :text="formatSessionDay(next.session_date)" />
        <InfoRow :icon="Clock" :text="formatSessionTimeRange(next.session_date, next.duration)" />
      </div>
      <div class="rounded-xl bg-muted p-3 text-sm">
        <p class="font-medium">{{ next.notes ? 'Notas:' : 'Preparação para a sessão:' }}</p>
        <p class="mt-1 text-muted-foreground">
          {{ next.notes || 'Lembre-se de estar em um ambiente tranquilo e privado. Tenha água por perto e seu diário emocional em mãos.' }}
        </p>
      </div>
      <Button variant="outline" class="h-11 w-full" as-child><RouterLink to="/portal/sessions">Ver minhas sessões</RouterLink></Button>
    </div>

    <div v-else class="py-4 text-center">
      <p class="font-medium">Nenhuma sessão agendada</p>
      <p class="mb-3 text-sm text-muted-foreground">Você não possui sessões agendadas no momento.</p>
      <Button variant="outline" size="sm" as-child><RouterLink to="/portal/sessions">Ver histórico de sessões</RouterLink></Button>
    </div>
  </SectionCard>
</template>
