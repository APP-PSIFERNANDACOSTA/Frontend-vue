<script setup lang="ts">
import { AlertCircle, Bell, Cake, HeartPulse, Mail, MessageSquare } from '@lucide/vue'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed } from 'vue'
import PushToggleCard from '@/features/notifications/components/PushToggleCard.vue'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/features/notifications/queries'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

const query = useNotifications()
const markOne = useMarkNotificationRead()
const markAll = useMarkAllNotificationsRead()
const list = computed(() => query.data.value?.notifications ?? [])
const unread = computed(() => query.data.value?.unread_count ?? 0)

const KIND: Record<string, { icon: typeof Bell; box: string; text: string }> = {
  payment: { icon: Mail, box: 'bg-success/10', text: 'text-success' },
  appointment: { icon: Bell, box: 'bg-brand-100', text: 'text-brand-700' },
  reminder: { icon: AlertCircle, box: 'bg-warning/10', text: 'text-warning' },
  birthday: { icon: Cake, box: 'bg-brand-100', text: 'text-brand-700' },
  mood_alert: { icon: HeartPulse, box: 'bg-destructive/10', text: 'text-destructive' },
}
const kind = (t: string) => KIND[t] ?? { icon: MessageSquare, box: 'bg-muted', text: 'text-muted-foreground' }
const since = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR })
</script>

<template>
  <div class="space-y-4">
    <SectionCard title="Central de notificações" :description="unread ? `${unread} ${unread === 1 ? 'notificação não lida' : 'notificações não lidas'}` : undefined">
      <template #actions><Button v-if="unread" variant="outline" size="sm" :disabled="markAll.isPending.value" @click="markAll.mutate()">Marcar todas como lidas</Button></template>
      <QueryState :query="query" :empty="list.length === 0" loading-label="Carregando notificações...">
        <template #empty><EmptyState :icon="Bell" title="Nenhuma notificação no momento" /></template>
        <ul class="space-y-3">
          <li v-for="n in list" :key="n.id">
            <button type="button" :class="cn('flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent/50', n.read ? 'bg-card' : 'border-brand/30 bg-brand/5')" @click="!n.read && markOne.mutate(n.id)">
              <span :class="cn('flex size-10 shrink-0 items-center justify-center rounded-lg', kind(n.type).box)"><component :is="kind(n.type).icon" :class="cn('size-5', kind(n.type).text)" /></span>
              <span class="min-w-0 flex-1"><span class="block font-medium">{{ n.title }}</span><span class="mt-1 block break-words text-sm text-muted-foreground">{{ n.message }}</span><span class="mt-2 block text-xs text-muted-foreground">{{ since(n.created_at) }}</span></span>
              <span v-if="!n.read" class="mt-1 size-2 shrink-0 rounded-full bg-brand" title="Não lida" />
            </button>
          </li>
        </ul>
      </QueryState>
    </SectionCard>

    <SectionCard title="Receber no celular" description="Gerencie como você recebe notificações" :icon="Bell">
      <PushToggleCard description="Receba avisos no celular quando seus pacientes postarem diários ou responderem quizzes." />
    </SectionCard>
  </div>
</template>
