<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { NativeSelect } from '@/shared/ui/native-select'
import { SESSION_STATUS_LABELS, type SessionStatus } from '../types'

defineProps<{ modelValue: SessionStatus; loading?: boolean; compact?: boolean; id?: string }>()
const emit = defineEmits<{ change: [status: SessionStatus] }>()
const ORDER: SessionStatus[] = ['scheduled', 'rescheduled', 'completed', 'no_show', 'cancelled']
</script>

<template>
  <div class="flex items-center gap-2">
    <NativeSelect
      :id="id"
      :model-value="modelValue"
      :disabled="loading"
      :class="compact ? 'h-8 min-w-[118px] text-xs' : 'min-w-[140px]'"
      aria-label="Status da sessão"
      @update:model-value="(v: unknown) => emit('change', v as SessionStatus)"
    >
      <option v-for="s in ORDER" :key="s" :value="s">{{ SESSION_STATUS_LABELS[s] }}</option>
    </NativeSelect>
    <Loader2 v-if="loading" class="size-4 animate-spin text-muted-foreground" />
  </div>
</template>
