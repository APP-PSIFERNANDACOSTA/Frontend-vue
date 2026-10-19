<script setup lang="ts">
import { Heart, Sparkles } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import messageService from '@/features/communications/message.api'
import SectionCard from '@/shared/components/SectionCard.vue'
import { Skeleton } from '@/shared/ui/skeleton'
import { formatDate } from '@/shared/lib/format'

const q = useQuery({ queryKey: ['messages', 'mine'], queryFn: () => messageService.getMyMessages(), refetchInterval: 60_000 })
const latest = computed(() => q.data.value?.[0] ?? null)
</script>

<template>
  <SectionCard title="Mensagem da Psi" :icon="Heart">
    <div v-if="q.isPending.value" class="space-y-2">
      <Skeleton class="h-4 w-1/2" /><Skeleton class="h-4 w-full" />
    </div>
    <div v-else-if="latest" class="space-y-2">
      <p class="text-sm font-medium">{{ latest.title }}</p>
      <p class="whitespace-pre-line text-sm text-muted-foreground">{{ latest.body }}</p>
      <p v-if="latest.sent_at" class="text-xs text-muted-foreground">Enviado em {{ formatDate(latest.sent_at) }}</p>
    </div>
    <p v-else class="flex items-center gap-2 text-sm text-muted-foreground">
      <Sparkles class="size-4 shrink-0 text-brand-600" />
      Continue seu progresso terapêutico com dedicação e autocuidado
    </p>
  </SectionCard>
</template>
