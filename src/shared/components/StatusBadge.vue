<script setup lang="ts">
/**
 * Badge de status unificado. Passe `tone` direto ou um `map` status → { label, tone }.
 */
import { computed } from 'vue'
import { cn } from '@/shared/lib/utils'

import type { StatusMap, Tone } from './status'

const props = defineProps<{ status?: string; map?: StatusMap; tone?: Tone; label?: string; class?: string }>()

const tones: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-700 border-brand-200',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/25',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-muted text-muted-foreground border-border',
}

const resolved = computed(() => {
  const entry = props.status && props.map ? props.map[props.status] : undefined
  return { label: props.label ?? entry?.label ?? props.status ?? '', tone: props.tone ?? entry?.tone ?? 'neutral' }
})
</script>

<template>
  <span
    :class="cn('inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[resolved.tone], props.class)"
  >
    <slot>{{ resolved.label }}</slot>
  </span>
</template>
