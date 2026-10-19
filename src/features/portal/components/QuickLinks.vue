<script setup lang="ts">
import { DollarSign, Sprout, FileText, MessageCircle } from '@lucide/vue'
import { RouterLink } from 'vue-router'

const links = [
  { name: 'Exercícios', hint: 'Práticas terapêuticas', to: '/portal/exercises', icon: Sprout },
  { name: 'Contratos', hint: 'Meus contratos', to: '/portal/contracts', icon: FileText },
  { name: 'Financeiro', hint: 'Pagamentos', to: '/portal/financial', icon: DollarSign },
  { name: 'Mensagens', hint: 'Recados da psi', to: '/portal/chat', icon: MessageCircle },
]
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <RouterLink
      v-for="l in links"
      :key="l.to"
      :to="l.to"
      class="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-4 text-center shadow-xs transition active:scale-[0.97]"
    >
      <span class="flex size-12 items-center justify-center rounded-xl bg-brand-50">
        <component :is="l.icon" class="size-6 text-brand-600" />
      </span>
      <span>
        <span class="block text-sm font-semibold">{{ l.name }}</span>
        <span class="block text-xs text-muted-foreground">{{ l.hint }}</span>
      </span>
    </RouterLink>
  </div>
</template>
