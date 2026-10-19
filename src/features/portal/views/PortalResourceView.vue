<script setup lang="ts">
import { BookOpen, CheckCircle2, Download, Loader2, Plus, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAddResourceNote, useCompleteResource, useDeleteResourceNote, useMyResource, useResourceNotes } from '@/features/resources/queries'
import { categoryLabel, fileTypeLabel } from '@/features/resources/ui'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { Textarea } from '@/shared/ui/textarea'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const query = useMyResource(id)
const r = computed(() => query.data.value)
const done = computed(() => !!r.value?.progress?.is_completed)
const complete = useCompleteResource()

const notesQ = useResourceNotes(id)
const text = ref('')
const add = useAddResourceNote(id.value, () => (text.value = ''))
const delNote = useDeleteResourceNote(id.value)

/** Links do YouTube/Vimeo viram embed; qualquer outro é usado como veio. */
function embedUrl(url: string) {
  if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
    const v = url.includes('youtu.be') ? url.split('/').pop()?.split('?')[0] : url.split('v=')[1]?.split('&')[0]
    if (v) return `https://www.youtube.com/embed/${v}`
  }
  if (url.includes('vimeo.com')) {
    const v = url.split('/').pop()
    if (v) return `https://player.vimeo.com/video/${v}`
  }
  return url
}
</script>

<template>
  <QueryState :query="query">
    <div v-if="r" class="space-y-4">
      <div>
        <div class="flex items-start justify-between gap-2"><h2 class="text-xl font-semibold leading-snug">{{ r.title }}</h2><Badge v-if="done" class="shrink-0 bg-success text-white"><CheckCircle2 class="size-3" />Concluído</Badge></div>
        <p v-if="r.description" class="mt-1 text-sm text-muted-foreground">{{ r.description }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-2"><Badge variant="outline" class="text-xs">{{ categoryLabel(r.category) }}</Badge><Badge variant="secondary" class="text-xs">{{ fileTypeLabel(r.file_type) }}</Badge><span v-if="r.file_size" class="text-xs text-muted-foreground">{{ r.formatted_file_size }}</span></div>
      </div>

      <div class="overflow-hidden rounded-2xl border bg-card">
        <iframe v-if="r.file_type === 'pdf' && r.file_url" :src="r.file_url" :title="r.title" class="h-[70dvh] w-full" />
        <div v-else-if="r.file_type === 'video' && r.video_url" class="aspect-video bg-black"><iframe :src="embedUrl(r.video_url)" :title="r.title" class="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen /></div>
        <video v-else-if="r.file_type === 'video' && r.file_url" :src="r.file_url" controls playsinline class="aspect-video w-full bg-black" />
        <div v-else-if="r.file_type === 'image' && r.file_url" class="flex items-center justify-center bg-muted"><img :src="r.file_url" :alt="r.title" class="max-h-[70dvh] max-w-full object-contain" /></div>
        <div v-else class="flex aspect-video items-center justify-center bg-muted"><img v-if="r.cover_url" :src="r.cover_url" :alt="r.title" class="max-h-full max-w-full object-contain" /><div v-else class="text-center"><BookOpen class="mx-auto mb-2 size-12 text-muted-foreground" /><p class="text-sm text-muted-foreground">{{ fileTypeLabel(r.file_type) }}</p></div></div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <Button v-if="r.file_url && !r.video_url" as-child variant="outline" class="h-11 flex-1"><a :href="r.file_url" target="_blank" rel="noopener"><Download /> Abrir / baixar arquivo</a></Button>
        <Button v-if="!done" class="h-11 flex-1" :disabled="complete.isPending.value" @click="complete.mutate(r.id)"><Loader2 v-if="complete.isPending.value" class="animate-spin" /><CheckCircle2 v-else /> Marcar como concluído</Button>
      </div>

      <SectionCard v-if="typeof r.progress?.progress_percentage === 'number' && !done" title="Seu progresso"><div class="space-y-1"><div class="flex justify-between text-sm"><span class="text-muted-foreground">Progresso</span><span class="font-medium">{{ r.progress.formatted_progress ?? `${r.progress.progress_percentage}%` }}</span></div><Progress :model-value="r.progress.progress_percentage" /></div></SectionCard>

      <SectionCard title="Minhas anotações" description="Anotações só suas sobre este recurso">
        <div class="space-y-3">
          <Textarea v-model="text" rows="3" placeholder="Escreva suas anotações aqui..." />
          <Button class="h-11 w-full" :disabled="!text.trim() || add.isPending.value" @click="add.mutate(text.trim())"><Loader2 v-if="add.isPending.value" class="animate-spin" /><Plus v-else /> Adicionar anotação</Button>
          <p v-if="!notesQ.data.value?.length" class="py-3 text-center text-sm text-muted-foreground">Nenhuma anotação ainda. Adicione a primeira!</p>
          <ul v-else class="space-y-2">
            <li v-for="n in notesQ.data.value" :key="n.id" class="rounded-lg border p-3"><div class="flex items-start justify-between gap-2"><p class="whitespace-pre-line break-words text-sm">{{ n.note_text }}</p><Button variant="ghost" size="icon" class="-mr-2 -mt-1 size-9 shrink-0 text-destructive" aria-label="Excluir anotação" @click="delNote.mutate(n.id)"><Trash2 class="size-4" /></Button></div><p class="mt-1 text-xs text-muted-foreground">{{ formatDate(n.created_at, "d MMM yyyy, HH:mm") }}</p></li>
          </ul>
        </div>
      </SectionCard>
    </div>
  </QueryState>
</template>
