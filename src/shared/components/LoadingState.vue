<script setup lang="ts">
import { Loader2 } from '@lucide/vue'

withDefaults(defineProps<{ label?: string; fullscreen?: boolean }>(), { label: 'Carregando...' })
</script>

<template>
  <div :class="['flex flex-col items-center justify-center gap-3 text-muted-foreground', fullscreen ? 'h-dvh' : 'py-12']">
    <Loader2 class="size-8 animate-spin text-brand" />
    <p class="text-sm">{{ label }}</p>
  </div>
</template>
