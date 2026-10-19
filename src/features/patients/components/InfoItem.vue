<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon: Component; label: string; value?: string | null }>()
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
      <component :is="icon" class="size-5 text-brand-600" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium">{{ label }}</p>
      <p class="break-words text-sm text-muted-foreground">{{ value }}</p>
    </div>
  </div>
</template>
