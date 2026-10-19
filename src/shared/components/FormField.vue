<script setup lang="ts">
/** Label + controle (slot) + hint/erro. O slot recebe { id, invalid }. */
import { useId } from 'vue'
import { Label } from '@/shared/ui/label'

const props = defineProps<{ label?: string; error?: string; hint?: string; required?: boolean; id?: string }>()
const fieldId = props.id ?? useId()
</script>

<template>
  <div class="space-y-1.5">
    <Label v-if="label" :for="fieldId">
      {{ label }}<span v-if="required" class="text-destructive"> *</span>
    </Label>
    <slot :id="fieldId" :invalid="!!error" />
    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-muted-foreground">{{ hint }}</p>
  </div>
</template>
