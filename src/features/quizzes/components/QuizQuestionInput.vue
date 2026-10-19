<script setup lang="ts">
/** Campo de resposta de UMA pergunta (múltipla escolha, escala 0–10 ou texto livre). Pensado para toque. */
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Textarea } from '@/shared/ui/textarea'
import { cn } from '@/shared/lib/utils'
import type { QuizQuestion } from '../types'

defineProps<{ question: QuizQuestion }>()
/** Valor guardado como string (compatível com a API). */
const value = defineModel<string>({ default: '' })
const SCALE = Array.from({ length: 11 }, (_, i) => i)
</script>

<template>
  <RadioGroup v-if="question.question_type === 'multiple_choice' && question.options" v-model="value" class="gap-3">
    <Label
      v-for="o in question.options"
      :key="o.value"
      :for="`q${question.id}-${o.value}`"
      :class="cn('flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 font-normal transition-colors active:bg-muted', value === String(o.value) && 'border-brand-400 bg-brand-50')"
    >
      <RadioGroupItem :id="`q${question.id}-${o.value}`" :value="String(o.value)" />
      <span class="flex-1 leading-snug">{{ o.label }}</span>
    </Label>
  </RadioGroup>

  <div v-else-if="question.question_type === 'scale'" class="space-y-3">
    <p class="text-sm text-muted-foreground">Escolha um valor de 0 a 10</p>
    <div class="grid grid-cols-6 gap-2" role="radiogroup" :aria-label="question.question_text">
      <button
        v-for="n in SCALE"
        :key="n"
        type="button"
        role="radio"
        :aria-checked="value === String(n)"
        :class="cn('flex h-12 items-center justify-center rounded-xl border text-base font-semibold transition-colors active:scale-95', value === String(n) ? 'border-brand-400 bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')"
        @click="value = String(n)"
      >
        {{ n }}
      </button>
    </div>
    <div class="flex justify-between px-1 text-xs text-muted-foreground"><span>0 · nada</span><span>10 · muito</span></div>
  </div>

  <div v-else class="space-y-2">
    <Textarea v-model="value" rows="7" class="min-h-[160px] text-base" placeholder="Digite sua resposta aqui..." />
    <p class="text-xs text-muted-foreground">Responda com o máximo de detalhes possível</p>
  </div>
</template>
