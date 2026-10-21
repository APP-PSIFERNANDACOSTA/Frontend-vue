<script setup lang="ts">
import { Edit, Eye, MoreVertical, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { useReactivatePatient } from '../queries'
import type { Patient } from '../types'

defineProps<{ patient: Patient; label?: string }>()
const reactivate = useReactivatePatient()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="size-9"><MoreVertical /><span class="sr-only">Ações de {{ label ?? patient.name }}</span></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem as-child><RouterLink :to="`/dashboard/patients/${patient.id}`"><Eye /> Ver detalhes</RouterLink></DropdownMenuItem>
      <DropdownMenuItem as-child><RouterLink :to="`/dashboard/patients/${patient.id}/edit`"><Edit /> Editar</RouterLink></DropdownMenuItem>
      <DropdownMenuItem v-if="patient.status === 'inactive'" :disabled="reactivate.isPending.value" @select="reactivate.mutate(patient.id)"><RotateCcw /> Reativar paciente</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
