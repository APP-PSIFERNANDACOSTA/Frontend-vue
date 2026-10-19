<script setup lang="ts">
import { Construction } from '@lucide/vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/shared/components/EmptyState.vue'

const route = useRoute()
</script>

<template>
  <EmptyState :icon="Construction" title="Tela em migração" :description="`A rota ${route.path} ainda não foi portada para o novo app.`" />
</template>
