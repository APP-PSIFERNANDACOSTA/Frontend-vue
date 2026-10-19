<script setup lang="ts">
import { ArrowDown, ArrowRight, ArrowUp, DollarSign } from '@lucide/vue'
import { computed } from 'vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatMoney } from '@/shared/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

const props = defineProps<{ current?: number; previous?: number; change: number | null | undefined; average: number; loading: boolean }>()
const privacy = usePrivacyMode()
const money = (v?: number) => (privacy.enabled.value ? 'R$ •••' : formatMoney(v ?? 0))
const trend = computed(() => (props.change == null ? null : props.change > 0 ? 'up' : props.change < 0 ? 'down' : 'flat'))
</script>

<template>
  <Card class="h-full">
    <CardHeader><CardTitle class="flex items-center gap-2 text-base"><DollarSign class="size-5 text-brand-600" /> Receita</CardTitle></CardHeader>
    <CardContent>
      <Skeleton v-if="loading" class="h-32 w-full" />
      <div v-else class="space-y-4">
        <div>
          <p class="text-3xl font-bold text-success">{{ money(current) }}</p>
          <p class="text-xs text-muted-foreground">Este mês</p>
        </div>
        <dl class="space-y-2 border-t pt-3 text-sm">
          <div class="flex items-center justify-between"><dt class="text-muted-foreground">Mês anterior</dt><dd class="font-medium">{{ money(previous) }}</dd></div>
          <div v-if="!privacy.enabled.value && trend" class="flex items-center justify-between">
            <dt class="text-muted-foreground">Variação</dt>
            <dd :class="['inline-flex items-center gap-1 font-medium', trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground']">
              <ArrowUp v-if="trend === 'up'" class="size-4" /><ArrowDown v-else-if="trend === 'down'" class="size-4" /><ArrowRight v-else class="size-4" />
              {{ Math.abs(change ?? 0).toFixed(1) }}%
            </dd>
          </div>
          <div v-if="average > 0" class="flex items-center justify-between"><dt class="text-muted-foreground">Média por sessão</dt><dd class="font-medium">{{ money(average) }}</dd></div>
        </dl>
      </div>
    </CardContent>
  </Card>
</template>
