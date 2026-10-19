<script setup lang="ts">
import { SearchX } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import EmptyState from '@/shared/components/EmptyState.vue'
import { Button } from '@/shared/ui/button'
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center p-4">
    <EmptyState :icon="SearchX" title="Página não encontrada" description="O endereço que você tentou acessar não existe.">
      <Button as-child><RouterLink to="/">Voltar ao início</RouterLink></Button>
    </EmptyState>
  </div>
</template>
