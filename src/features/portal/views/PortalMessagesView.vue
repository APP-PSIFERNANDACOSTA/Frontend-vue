<script setup lang="ts">
import { Info, MessageCircle } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import messageService from '@/features/communications/message.api'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { formatDate } from '@/shared/lib/format'

const query = useQuery({ queryKey: ['messages', 'mine'], queryFn: () => messageService.getMyMessages(), refetchInterval: 60_000 })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">Recados da Psi Fernanda Costa para você</p>

    <QueryState :query="query" :empty="!query.data.value?.length">
      <template #empty><EmptyState :icon="MessageCircle" title="Nenhum recado ainda" description="Quando sua psicóloga enviar um recado, ele aparece aqui." /></template>
      <article v-for="m in query.data.value" :key="m.id" class="space-y-2 rounded-2xl border bg-card p-4 shadow-xs">
        <div class="flex items-start justify-between gap-3">
          <h3 class="font-semibold leading-snug">{{ m.title }}</h3>
          <span v-if="m.sent_at" class="shrink-0 text-xs text-muted-foreground">{{ formatDate(m.sent_at) }}</span>
        </div>
        <p class="whitespace-pre-line text-sm text-muted-foreground">{{ m.body }}</p>
      </article>
    </QueryState>

    <SectionCard title="Sobre os recados" :icon="Info" class="border-brand-200 bg-brand-50">
      <p class="text-sm text-muted-foreground">Os recados são enviados pela sua psicóloga. Para falar com ela, use os canais combinados nas sessões. Em caso de emergência, ligue para 188 (CVV) ou 192 (SAMU).</p>
    </SectionCard>
  </div>
</template>
