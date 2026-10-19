<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon: Component; text?: string }>()
</script>

<template>
  <div class="flex items-center gap-2 text-sm text-muted-foreground">
    <component :is="icon" class="size-4 shrink-0" />
    <span class="min-w-0 truncate first-letter:uppercase"><slot>{{ text }}</slot></span>
  </div>
</template>
