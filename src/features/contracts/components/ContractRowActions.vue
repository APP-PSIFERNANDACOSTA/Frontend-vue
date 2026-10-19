<script setup lang="ts">
import { Ban, Copy, Eye, Mail, MoreVertical, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { Button } from '@/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { contractActions, contractLink } from '../template'
import type { Contract } from '../types'

const props = defineProps<{ contract: Contract }>()
const emit = defineEmits<{ resend: []; inactivate: []; delete: [] }>()
const { copy } = useClipboardToast()
const flags = computed(() => contractActions(props.contract))
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="size-8" aria-label="Ações do contrato" @click.stop><MoreVertical /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-48" @click.stop>
      <DropdownMenuItem as-child><RouterLink :to="`/dashboard/contracts/${contract.id}`"><Eye /> Ver</RouterLink></DropdownMenuItem>
      <template v-if="flags.canShare">
        <DropdownMenuItem @click="copy(contractLink(contract.token), 'Link copiado!', 'O link do contrato foi copiado para a área de transferência')"><Copy /> Copiar link</DropdownMenuItem>
        <DropdownMenuItem @click="emit('resend')"><Mail /> Reenviar</DropdownMenuItem>
      </template>
      <DropdownMenuItem v-if="flags.canInactivate" @click="emit('inactivate')"><Ban /> Inativar</DropdownMenuItem>
      <template v-if="flags.canDelete">
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" @click="emit('delete')"><Trash2 /> Excluir</DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
