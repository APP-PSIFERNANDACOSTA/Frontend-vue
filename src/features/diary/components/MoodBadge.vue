<script setup lang="ts">
import { cn } from '@/shared/lib/utils'
import { moodLabel, moodUi } from '../mood'
import type { MoodType } from '../types'

defineProps<{ mood: MoodType | string; iconOnly?: boolean; class?: string }>()
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', moodUi(mood).bg, moodUi(mood).text, $props.class)">
    <component :is="moodUi(mood).icon" class="size-3.5" />
    <template v-if="!iconOnly">{{ moodLabel(mood) }}</template>
  </span>
</template>
