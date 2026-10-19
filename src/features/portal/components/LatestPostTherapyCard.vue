<script setup lang="ts">
import { Calendar, Clock, NotebookPen } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getPatientNoteDisplayTitle, getPostTherapySnippet } from '@/features/notes/helpers'
import { useMyPostTherapyList } from '@/features/notes/queries'
import { formatSessionDay, formatSessionTimeRange } from '@/features/sessions/format'
import InfoRow from '@/shared/components/InfoRow.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const q = useMyPostTherapyList(1, 1)
const note = computed(() => q.data.value?.data[0] ?? null)
const snippet = computed(() => (note.value ? getPostTherapySnippet(note.value) : null))
</script>

<template>
  <SectionCard title="Pós-terapia da última sessão" :icon="NotebookPen">
    <div v-if="q.isPending.value" class="space-y-2"><Skeleton class="h-5 w-1/2" /><Skeleton class="h-12 w-full" /></div>

    <RouterLink v-else-if="note" :to="`/portal/post-therapy/${note.id}`" class="block space-y-3">
      <p class="font-medium break-words">{{ getPatientNoteDisplayTitle(note) }}</p>
      <div v-if="note.session" class="space-y-1.5">
        <InfoRow :icon="Calendar" :text="formatSessionDay(note.session.session_date)" />
        <InfoRow :icon="Clock" :text="formatSessionTimeRange(note.session.session_date, note.session.duration)" />
      </div>
      <div class="rounded-xl border bg-muted/60 p-3 text-sm">
        <p class="font-medium">{{ snippet ? 'Trecho da pós-terapia:' : 'Nota da profissional:' }}</p>
        <p class="mt-1 leading-relaxed text-muted-foreground">{{ snippet || 'Toque para ler o registro completo desta sessão.' }}</p>
      </div>
      <Button variant="outline" class="h-11 w-full" tabindex="-1">Ler pós-terapia</Button>
    </RouterLink>

    <div v-else class="py-4 text-center">
      <p class="font-medium">Ainda não há pós-terapia</p>
      <p class="mb-3 text-sm text-muted-foreground">Quando houver um registro após uma sessão, ele aparecerá aqui.</p>
      <Button variant="outline" size="sm" as-child><RouterLink to="/portal/post-therapy">Ver área Pós-terapia</RouterLink></Button>
    </div>
  </SectionCard>
</template>
