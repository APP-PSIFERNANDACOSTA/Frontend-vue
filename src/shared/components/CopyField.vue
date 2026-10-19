<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

const props = defineProps<{ value: string; label?: string }>()
const { copy, copied } = useClipboard({ legacy: true })
</script>

<template>
  <div class="space-y-1.5">
    <p v-if="label" class="text-sm font-medium">{{ label }}</p>
    <div class="flex gap-2">
      <Input :model-value="props.value" readonly class="font-mono text-xs" />
      <Button type="button" variant="outline" size="icon" :aria-label="copied ? 'Copiado' : 'Copiar'" @click="copy(props.value)">
        <Check v-if="copied" class="text-success" />
        <Copy v-else />
      </Button>
    </div>
  </div>
</template>
