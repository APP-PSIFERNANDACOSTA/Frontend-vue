<script setup lang="ts">
/** Tela de "assinando": passos animados enquanto o servidor assina e gera o PDF. */
import { CheckCircle, Loader2 } from '@lucide/vue'
import { computed } from 'vue'
import { cn } from '@/shared/lib/utils'

const props = defineProps<{ steps: string[]; current: number }>()
const percent = computed(() => ((props.current + 1) / props.steps.length) * 100)
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-50 via-background to-brand-50 p-4">
    <div class="w-full max-w-md overflow-hidden rounded-2xl border border-brand-200 bg-card px-8 py-10 shadow-2xl">
      <img src="/assinando-contrato1.gif" alt="" aria-hidden="true" width="240" height="240" class="mx-auto mb-3 size-44 object-contain sm:size-52" />
      <h2 class="mb-1 text-center text-xl font-bold text-brand-800 dark:text-brand">Contrato sendo preparado</h2>
      <p class="mb-6 text-center text-sm text-muted-foreground">Não feche esta página.</p>
      <div class="mb-8 h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-brand transition-all duration-700" :style="{ width: `${percent}%` }" /></div>
      <ul class="space-y-3">
        <li v-for="(label, i) in steps" :key="i" :class="cn('flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 transition-colors', i <= current ? 'border-brand bg-brand-50' : 'border-border')">
          <CheckCircle v-if="i < current" class="size-5 shrink-0 text-brand-600" />
          <Loader2 v-else-if="i === current" class="size-5 shrink-0 animate-spin text-brand-600" />
          <span v-else class="size-5 shrink-0 rounded-full border-2 border-border" />
          <span :class="cn('text-sm font-medium', i <= current ? 'text-foreground' : 'text-muted-foreground')">{{ label }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
