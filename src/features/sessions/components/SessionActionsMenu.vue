<script setup lang="ts">
import { AlertCircle, CalendarClock, CalendarX2, CheckCircle2, FileText, Loader2, MoreVertical, Pencil, RefreshCw, Trash2 } from '@lucide/vue'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { SESSION_STATUS_LABELS, type Session, type SessionStatus } from '../types'

const props = defineProps<{ session: Session; hasReport: boolean; reportLoading: boolean; busy?: boolean; hideReport?: boolean; showEdit?: boolean; hideQuick?: boolean /* esconde 'Marcar como realizada' quando a tela já tem esse botão */ }>()
const emit = defineEmits<{ report: []; complete: []; noShow: []; reschedule: []; delete: []; edit: []; cancel: []; status: [status: SessionStatus] }>()
const ORDER: SessionStatus[] = ['scheduled', 'rescheduled', 'completed', 'no_show', 'cancelled']
const open = () => props.session.status === 'scheduled' || props.session.status === 'rescheduled'
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="size-9" aria-label="Mais ações da sessão">
        <Loader2 v-if="busy" class="animate-spin" /><MoreVertical v-else />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <template v-if="!hideReport">
        <DropdownMenuItem v-if="reportLoading" disabled>Verificando relatório...</DropdownMenuItem>
        <DropdownMenuItem v-else @click="emit('report')"><FileText /> {{ hasReport ? 'Ver relatório' : 'Criar relatório' }}</DropdownMenuItem>
      </template>
      <DropdownMenuItem v-if="!hideQuick && session.status !== 'completed' && session.status !== 'no_show'" @click="emit('complete')"><CheckCircle2 /> Marcar como realizada</DropdownMenuItem>
      <template v-if="open()">
        <DropdownMenuItem @click="emit('noShow')"><AlertCircle /> Registrar falta</DropdownMenuItem>
        <DropdownMenuItem @click="emit('reschedule')"><CalendarClock /> Remarcar</DropdownMenuItem>
        <DropdownMenuItem @click="emit('cancel')"><CalendarX2 /> Cancelar sessão</DropdownMenuItem>
      </template>
      <DropdownMenuItem v-if="showEdit" @click="emit('edit')"><Pencil /> Editar detalhes</DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger><RefreshCw /> Alterar status</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem v-for="s in ORDER.filter((x) => x !== session.status)" :key="s" @click="emit('status', s)">{{ SESSION_STATUS_LABELS[s] }}</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <template v-if="session.status !== 'completed'">
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" @click="emit('delete')"><Trash2 /> Excluir</DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
