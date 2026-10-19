<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppToaster from '@/shared/components/AppToaster.vue'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import { TooltipProvider } from '@/shared/ui/tooltip'
</script>

<template>
  <TooltipProvider>
    <RouterView />
  </TooltipProvider>
  <ConfirmDialog />
  <AppToaster />
</template>
