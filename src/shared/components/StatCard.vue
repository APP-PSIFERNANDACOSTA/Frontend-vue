<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'

defineProps<{ label: string; value: string | number; icon?: Component; hint?: string; to?: string; loading?: boolean }>()
</script>

<template>
  <component
    :is="to ? RouterLink : 'div'"
    :to="to"
    class="flex items-center gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-colors"
    :class="to && 'hover:border-brand-300 hover:bg-brand-50/50'"
  >
    <div v-if="icon" class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-50">
      <component :is="icon" class="size-5 text-brand-600" />
    </div>
    <div class="min-w-0">
      <p class="line-clamp-2 text-xs font-medium leading-tight text-muted-foreground sm:text-sm">{{ label }}</p>
      <p v-if="loading" class="mt-1 h-7 w-12 animate-pulse rounded bg-muted" />
      <p v-else class="text-xl font-semibold sm:text-2xl">{{ value }}</p>
      <p v-if="hint" class="truncate text-xs text-muted-foreground">{{ hint }}</p>
    </div>
  </component>
</template>
