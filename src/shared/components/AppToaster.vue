<script setup lang="ts">
/**
 * Toaster único do app (montado no App.vue). Disparar via `notify` (@/shared/lib/toast).
 * Visual em assets/styles/toast.css: marca para sucesso/info/aviso, vermelho só para erro.
 */
import { CircleCheck, Info, Loader2, OctagonX, TriangleAlert } from '@lucide/vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { useBreakpoint } from '@/shared/composables/useBreakpoint'

const { isTablet } = useBreakpoint()
</script>

<template>
  <Toaster
    class="app-toaster"
    :position="isTablet ? 'top-right' : 'top-center'"
    :close-button="true"
    :visible-toasts="4"
    :offset="16"
    :toast-options="{ duration: 4000 }"
  >
    <template #success-icon><CircleCheck class="size-5" /></template>
    <template #info-icon><Info class="size-5" /></template>
    <template #warning-icon><TriangleAlert class="size-5" /></template>
    <template #error-icon><OctagonX class="size-5" /></template>
    <template #loading-icon><Loader2 class="size-5 animate-spin" /></template>
  </Toaster>
</template>
