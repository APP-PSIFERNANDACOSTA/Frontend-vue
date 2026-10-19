<script setup lang="ts">
import { Download, Eye, Loader2, MoreVertical, Pencil, Trash2 } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { isPaymentLockedByHealthReceipt, type Payment } from '../types'

defineProps<{ payment: Payment; downloading?: boolean }>()
const emit = defineEmits<{ download: []; delete: [] }>()
</script>

<template>
  <div class="flex items-center justify-end gap-1">
    <Button v-if="payment.pdf_path" variant="outline" size="sm" :disabled="downloading" @click.stop="emit('download')">
      <Loader2 v-if="downloading" class="animate-spin" /><Download v-else /> <span class="hidden xl:inline">PDF</span>
    </Button>
    <Button variant="outline" size="sm" as-child @click.stop><RouterLink :to="`/dashboard/payments/${payment.id}`"><Eye /> <span class="hidden xl:inline">Ver</span></RouterLink></Button>
    <DropdownMenu v-if="!isPaymentLockedByHealthReceipt(payment)">
      <DropdownMenuTrigger as-child><Button variant="ghost" size="icon" class="size-9" aria-label="Mais ações" @click.stop><MoreVertical /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem as-child><RouterLink :to="`/dashboard/payments/${payment.id}/edit`"><Pencil /> Editar</RouterLink></DropdownMenuItem>
        <DropdownMenuItem variant="destructive" @click="emit('delete')"><Trash2 /> Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
