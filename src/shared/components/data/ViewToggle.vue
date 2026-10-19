<script setup lang="ts">
import { LayoutGrid, List } from '@lucide/vue'
import { Button } from '@/shared/ui/button'
import type { ViewMode } from './types'

const view = defineModel<ViewMode>({ default: 'cards' })
</script>

<template>
  <div class="inline-flex gap-1" role="group" aria-label="Modo de visualização">
    <Button type="button" size="sm" class="h-9" :variant="view === 'cards' ? 'default' : 'outline'" :aria-pressed="view === 'cards'" @click="view = 'cards'">
      <LayoutGrid /> <span class="hidden sm:inline">Cards</span>
    </Button>
    <Button type="button" size="sm" class="h-9" :variant="view === 'list' ? 'default' : 'outline'" :aria-pressed="view === 'list'" @click="view = 'list'">
      <List /> <span class="hidden sm:inline">Lista</span>
    </Button>
  </div>
</template>
