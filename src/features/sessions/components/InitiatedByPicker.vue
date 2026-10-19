<script setup lang="ts">
import { HeartHandshake, User } from '@lucide/vue'
import FormField from '@/shared/components/FormField.vue'
import { cn } from '@/shared/lib/utils'
import type { SessionInitiator } from '../types'

defineProps<{ label: string; hint?: string; error?: string }>()
const model = defineModel<SessionInitiator | null>({ default: null })
const OPTIONS = [
  { value: 'patient' as const, label: 'Paciente', icon: User },
  { value: 'psychologist' as const, label: 'Psicóloga', icon: HeartHandshake },
]
</script>

<template>
  <FormField :label="label" required :hint="hint" :error="error">
    <div role="radiogroup" :aria-label="label" class="grid grid-cols-2 gap-2">
      <button
        v-for="o in OPTIONS" :key="o.value" type="button" role="radio" :aria-checked="model === o.value"
        :class="cn('flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors', model === o.value ? 'border-brand bg-brand-50 text-brand-900' : 'hover:border-brand-200')"
        @click="model = o.value"
      ><component :is="o.icon" class="size-4" />{{ o.label }}</button>
    </div>
  </FormField>
</template>
