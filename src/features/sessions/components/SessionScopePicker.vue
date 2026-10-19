<script setup lang="ts">
/** "Só esta sessão" vs "esta e as próximas" — aparece só se a sessão faz parte de uma série. */
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import type { SessionApplyTo } from '../types'

const props = withDefaults(defineProps<{ futureCount: number; idPrefix?: string; mode?: 'edit' | 'delete' }>(), {
  idPrefix: 'session-scope',
  mode: 'edit',
})
const value = defineModel<SessionApplyTo>({ default: 'single' })
</script>

<template>
  <div v-if="props.futureCount > 0" class="space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
    <p class="text-sm font-medium">Esta sessão faz parte de uma série recorrente</p>
    <RadioGroup v-model="value" class="space-y-2">
      <div class="flex items-center gap-3">
        <RadioGroupItem :id="`${idPrefix}-single`" value="single" />
        <Label :for="`${idPrefix}-single`" class="cursor-pointer font-normal">Somente esta sessão</Label>
      </div>
      <div class="flex items-center gap-3">
        <RadioGroupItem :id="`${idPrefix}-future`" value="future" />
        <Label :for="`${idPrefix}-future`" class="cursor-pointer font-normal">
          Esta e as próximas ({{ props.futureCount }} {{ props.futureCount === 1 ? 'sessão' : 'sessões' }})
        </Label>
      </div>
    </RadioGroup>
    <p class="text-xs text-muted-foreground">
      {{ props.mode === 'delete'
        ? 'Ao escolher "esta e as próximas", esta sessão e todas as futuras agendadas da série serão excluídas.'
        : 'Ao escolher "esta e as próximas", a mesma alteração de data/hora será aplicada às sessões futuras da série.' }}
    </p>
  </div>
</template>
