<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import { computed, ref } from 'vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { moodUi, parseTags } from '../mood'
import type { DiaryEntry } from '../types'
import MoodBadge from './MoodBadge.vue'

const props = withDefaults(defineProps<{ entry: DiaryEntry; showPatientName?: boolean; previewLength?: number }>(), { previewLength: 220 })
const privacy = usePrivacyMode()
const expanded = ref(false)
const tags = computed(() => parseTags(props.entry.tags))
const long = computed(() => props.entry.content.length > props.previewLength)
const text = computed(() => (expanded.value || !long.value ? props.entry.content : `${props.entry.content.slice(0, props.previewLength).trimEnd()}…`))
</script>

<template>
  <Card class="transition-shadow hover:shadow-md">
    <CardHeader>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex items-center gap-2">
            <component :is="moodUi(entry.mood).icon" :class="['size-5 shrink-0', moodUi(entry.mood).text]" />
            <CardTitle class="truncate text-base sm:text-lg">{{ entry.title || 'Entrada do diário' }}</CardTitle>
          </div>
          <p class="text-sm text-muted-foreground first-letter:uppercase">{{ formatDate(entry.date, "EEEE, dd 'de' MMMM 'de' yyyy") }}</p>
          <p v-if="showPatientName && entry.patient" class="text-sm font-medium text-brand-700 dark:text-brand">{{ privacy.name(entry.patient.name) }}</p>
        </div>
        <MoodBadge :mood="entry.mood" class="shrink-0" />
      </div>
    </CardHeader>
    <CardContent class="space-y-3">
      <p class="whitespace-pre-line break-words text-sm text-muted-foreground">{{ text }}</p>
      <button v-if="long" type="button" class="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand" @click="expanded = !expanded">
        {{ expanded ? 'Mostrar menos' : 'Ler completo' }}
        <ChevronDown class="size-3.5 transition-transform" :class="expanded && 'rotate-180'" />
      </button>
      <div v-if="tags.length" class="flex flex-wrap gap-2">
        <Badge v-for="t in tags" :key="t" variant="outline" class="text-xs">{{ t }}</Badge>
      </div>
      <slot />
    </CardContent>
  </Card>
</template>
