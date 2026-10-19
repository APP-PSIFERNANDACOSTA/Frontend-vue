<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BrandLogo from '@/shared/components/BrandLogo.vue'
import ThemeToggle from '@/shared/components/ThemeToggle.vue'

const route = useRoute()
/** Título da tela atual (meta.title), ou nome do portal na home. */
const title = computed(() => (route.meta.title as string | undefined) ?? 'Portal do Paciente')
</script>

<template>
  <header class="safe-top sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
    <div class="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
      <BrandLogo variant="symbol" class="size-9" />
      <h1 class="flex-1 truncate text-base font-semibold">{{ title }}</h1>
      <slot name="actions" />
      <ThemeToggle />
    </div>
  </header>
</template>
