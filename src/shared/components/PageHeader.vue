<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ title: string; description?: string; back?: string | boolean }>()
const router = useRouter()
const goBack = () => (typeof props.back === 'string' ? router.push(props.back) : router.back())
</script>

<template>
  <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex min-w-0 flex-1 items-start gap-2">
      <button
        v-if="back"
        type="button"
        class="-ml-2 mt-0.5 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Voltar"
        @click="goBack"
      >
        <ArrowLeft class="size-5" />
      </button>
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-balance text-foreground sm:text-3xl">{{ title }}</h1>
        <p v-if="description || $slots.description" class="mt-1 text-sm text-muted-foreground sm:text-base">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
