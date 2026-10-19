<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import { formatSessionInstantInSaoPaulo } from '@/shared/lib/datetime-br'
import { ptBR } from 'date-fns/locale'
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { useDeleteSession, useSeriesInfo } from '../queries'
import type { Session, SessionApplyTo } from '../types'
import SessionScopePicker from './SessionScopePicker.vue'

const props = defineProps<{ session: Session | null }>()
const open = defineModel<boolean>('open', { default: false })
const applyTo = ref<SessionApplyTo>('single')

const series = useSeriesInfo(() => (open.value ? props.session?.patient_id : undefined), () => props.session?.id)
const futureCount = () => series.data.value?.future_count ?? 0
const del = useDeleteSession(() => (open.value = false))
watch(open, (o) => o && (applyTo.value = 'single'))

const when = () =>
  props.session ? formatSessionInstantInSaoPaulo(props.session.session_date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''
const confirm = () =>
  props.session && del.mutate({ patientId: props.session.patient_id, id: props.session.id, applyTo: futureCount() > 0 ? applyTo.value : undefined })
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir sessão</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja excluir a sessão de {{ when() }}? Esta ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <p v-if="series.isPending.value" class="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 class="size-4 animate-spin" /> Verificando série recorrente...
      </p>
      <SessionScopePicker v-else v-model="applyTo" id-prefix="delete" mode="delete" :future-count="futureCount()" />
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="del.isPending.value">Cancelar</AlertDialogCancel>
        <Button variant="destructive" :disabled="del.isPending.value || series.isPending.value" @click="confirm">
          <Loader2 v-if="del.isPending.value" class="animate-spin" />
          {{ del.isPending.value ? 'Excluindo...' : 'Excluir' }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
