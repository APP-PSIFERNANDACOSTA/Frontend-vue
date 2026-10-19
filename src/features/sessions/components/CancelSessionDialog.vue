<script setup lang="ts">
import { CalendarX2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { Button } from '@/shared/ui/button'
import type { SessionInitiator } from '../types'
import InitiatedByPicker from './InitiatedByPicker.vue'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [by: SessionInitiator] }>()
const by = ref<SessionInitiator | null>(null)
watch(open, (o) => o && (by.value = null))
</script>

<template>
  <ResponsiveDialog v-model:open="open" title="Cancelar sessão" description="Informe quem cancelou. Cancelamento pelo paciente entra no cálculo de frequência.">
    <div class="space-y-4">
      <InitiatedByPicker v-model="by" label="Quem cancelou?" hint="Cancelamento pelo paciente reduz a taxa de frequência; pela psicóloga, não." />
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" @click="open = false">Voltar</Button>
        <Button variant="destructive" :disabled="!by" @click="by && (emit('confirm', by), (open = false))"><CalendarX2 /> Cancelar sessão</Button>
      </div>
    </div>
  </ResponsiveDialog>
</template>
