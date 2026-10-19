<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon?: Component; title: string; description?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 py-12 text-center">
    <div v-if="icon" class="mb-4 flex size-16 items-center justify-center rounded-full bg-brand-50">
      <component :is="icon" class="size-8 text-brand-600" />
    </div>
    <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-sm text-sm text-muted-foreground">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
