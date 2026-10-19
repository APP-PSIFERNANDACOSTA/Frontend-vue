<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { VIEW_OPTIONS, type CalendarView } from '../calendar'

defineProps<{ title: string; loading?: boolean }>()
const view = defineModel<CalendarView>('view', { required: true })
defineEmits<{ prev: []; next: []; today: [] }>()
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-2">
      <Button variant="outline" size="icon" class="size-9" aria-label="Anterior" @click="$emit('prev')"><ChevronLeft /></Button>
      <Button variant="outline" size="icon" class="size-9" aria-label="Próximo" @click="$emit('next')"><ChevronRight /></Button>
      <Button variant="outline" class="h-9" @click="$emit('today')">Hoje</Button>
      <h2 class="ml-1 min-w-0 truncate text-lg font-semibold first-letter:uppercase sm:text-xl">{{ title }}</h2>
      <span v-if="loading" class="size-2 shrink-0 animate-pulse rounded-full bg-brand" aria-label="Atualizando" />
    </div>
    <div role="tablist" aria-label="Tipo de visualização" class="inline-flex self-start rounded-lg bg-muted p-1 sm:self-auto">
      <button
        v-for="o in VIEW_OPTIONS"
        :key="o.value"
        type="button"
        role="tab"
        :aria-selected="view === o.value"
        :class="cn('rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors', view === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')"
        @click="view = o.value"
      >{{ o.label }}</button>
    </div>
  </div>
</template>
