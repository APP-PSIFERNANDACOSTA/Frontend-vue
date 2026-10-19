<script setup lang="ts">
import { Card } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { fmtBrasilia, fmtShortDate, fmtTime } from '../format'
import type { Session, SessionStatus } from '../types'
import SessionActionsMenu from './SessionActionsMenu.vue'
import SessionStatusSelect from './SessionStatusSelect.vue'

defineProps<{
  sessions: Session[]
  hasReport: (id: number) => boolean
  reportLoading: (id: number) => boolean
  busyId: number | null
}>()
const emit = defineEmits<{
  status: [id: number, status: SessionStatus]
  report: [id: number]; complete: [id: number]; noShow: [id: number]; reschedule: [s: Session]; delete: [s: Session]
}>()
</script>

<template>
  <Card class="overflow-hidden p-0">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="h-9 w-16 text-xs">Hora</TableHead>
          <TableHead class="h-9 text-xs">Data</TableHead>
          <TableHead class="hidden h-9 text-xs md:table-cell">Brasília</TableHead>
          <TableHead class="hidden h-9 text-xs lg:table-cell">Duração</TableHead>
          <TableHead class="hidden h-9 text-xs xl:table-cell">Notas</TableHead>
          <TableHead class="h-9 w-36 text-xs">Status</TableHead>
          <TableHead class="h-9 w-14 text-right text-xs">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="s in sessions" :key="s.id" class="text-sm">
          <TableCell class="py-2 font-semibold text-brand-700 dark:text-brand">{{ fmtTime(s.session_date) }}</TableCell>
          <TableCell class="py-2 font-medium">{{ fmtShortDate(s.session_date) }}</TableCell>
          <TableCell class="hidden py-2 text-xs text-muted-foreground md:table-cell">{{ fmtBrasilia(s.session_date) }}</TableCell>
          <TableCell class="hidden py-2 text-xs text-muted-foreground lg:table-cell">{{ s.duration ? `${s.duration} min` : '—' }}</TableCell>
          <TableCell class="hidden max-w-[220px] py-2 xl:table-cell"><span class="block truncate text-xs text-muted-foreground" :title="s.notes ?? undefined">{{ s.notes || '—' }}</span></TableCell>
          <TableCell class="py-2"><SessionStatusSelect compact :model-value="s.status" :loading="busyId === s.id" @change="emit('status', s.id, $event)" /></TableCell>
          <TableCell class="py-2 text-right">
            <SessionActionsMenu
              :session="s" :has-report="hasReport(s.id)" :report-loading="reportLoading(s.id)" :busy="busyId === s.id"
              @report="emit('report', s.id)" @complete="emit('complete', s.id)" @no-show="emit('noShow', s.id)"
              @reschedule="emit('reschedule', s)" @delete="emit('delete', s)"
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </Card>
</template>
