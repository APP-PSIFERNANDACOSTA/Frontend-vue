<script setup lang="ts">
/** Card com cabeçalho ícone + título — bloco padrão das telas (principalmente no portal). */
import type { Component } from 'vue'

defineProps<{ title?: string; description?: string; icon?: Component }>()
</script>

<template>
  <section class="rounded-2xl border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
    <header v-if="title || $slots.actions" class="mb-3 flex items-center gap-3">
      <span v-if="icon" class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50">
        <component :is="icon" class="size-5 text-brand-600" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="truncate text-base font-semibold">{{ title }}</h2>
        <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>
