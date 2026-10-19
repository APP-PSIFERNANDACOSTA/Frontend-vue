<script setup lang="ts">
import { MOOD_ENABLED } from '@/features/mood/feature'
/**
 * Portal do paciente — mobile-first.
 * Coluna única (max-w-lg) em qualquer tela, AppBar no topo e BottomNav fixa.
 */
import { useDisableZoom } from '@/shared/composables/useDisableZoom'
import PatientAppBar from './patient/PatientAppBar.vue'
import BottomNav from './patient/BottomNav.vue'
import PwaInstallPrompt from './patient/PwaInstallPrompt.vue'
import MoodCheckinDialog from '@/features/mood/components/MoodCheckinDialog.vue'

useDisableZoom()
</script>

<template>
  <div class="min-h-dvh bg-muted/30">
    <PatientAppBar />
    <main class="mx-auto w-full max-w-lg px-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-4">
      <RouterView />
    </main>
    <MoodCheckinDialog v-if="MOOD_ENABLED" />
    <PwaInstallPrompt />
    <BottomNav />
  </div>
</template>
