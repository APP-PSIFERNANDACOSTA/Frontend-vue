<script setup lang="ts">
import { BookOpen, Brain, CheckCircle2, FileText, Heart, Sparkles, Video } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useCompleteResource, useMyResources } from '@/features/resources/queries'
import { categoryLabel, fileIcon, fileTypeLabel } from '@/features/resources/ui'
import EmptyState from '@/shared/components/EmptyState.vue'
import PullToRefresh from '@/shared/components/PullToRefresh.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SearchInput from '@/shared/components/SearchInput.vue'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: BookOpen }, { id: 'livros', label: 'Livros', icon: BookOpen }, { id: 'apresentacoes', label: 'Apresentações', icon: Sparkles },
  { id: 'artigos', label: 'Artigos', icon: FileText }, { id: 'exercicios', label: 'Exercícios', icon: Brain }, { id: 'videos', label: 'Vídeos', icon: Video }, { id: 'outros', label: 'Outros', icon: Heart },
]
const category = ref('all')
const search = ref('')
const query = useMyResources(() => ({ category: category.value === 'all' ? undefined : category.value, search: search.value || undefined }))
const resources = computed(() => query.data.value ?? [])
const complete = useCompleteResource()
</script>

<template>
  <PullToRefresh :on-refresh="() => query.refetch()">
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">Materiais selecionados para apoiar sua jornada.</p>
      <SearchInput v-model="search" placeholder="Buscar recursos..." />
      <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Button v-for="c in CATEGORIES" :key="c.id" size="sm" :variant="category === c.id ? 'default' : 'outline'" class="h-9 shrink-0 rounded-full" @click="category = c.id"><component :is="c.icon" />{{ c.label }}</Button>
      </div>

      <QueryState :query="query" :empty="resources.length === 0">
        <template #empty><EmptyState :icon="BookOpen" title="Nenhum recurso encontrado" description="Tente ajustar os filtros ou buscar por outros termos." /></template>
        <article v-for="r in resources" :key="r.id" class="overflow-hidden rounded-2xl border bg-card shadow-xs">
          <RouterLink :to="`/portal/resources/${r.id}`" class="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-brand-50 to-background">
            <img v-if="r.cover_url" :src="r.cover_url" :alt="r.title" class="size-full object-cover" loading="lazy" />
            <div v-else class="text-center"><component :is="fileIcon(r.file_type)" class="mx-auto mb-1 size-8 text-brand-600" /><p class="text-xs font-medium text-muted-foreground">{{ fileTypeLabel(r.file_type) }}</p></div>
            <span v-if="r.progress?.is_completed" class="absolute right-2 top-2 rounded-full bg-success p-1 text-white"><CheckCircle2 class="size-4" /></span>
          </RouterLink>
          <div class="space-y-3 p-4">
            <div><h3 class="font-semibold leading-snug">{{ r.title }}</h3><p v-if="r.description" class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ r.description }}</p></div>
            <div class="flex flex-wrap items-center gap-2"><Badge variant="outline" class="text-xs">{{ categoryLabel(r.category) }}</Badge><span v-if="r.file_size" class="text-xs text-muted-foreground">{{ r.formatted_file_size }}</span></div>
            <div v-if="typeof r.progress?.progress_percentage === 'number' && !r.progress.is_completed" class="space-y-1"><div class="flex justify-between text-xs"><span class="text-muted-foreground">Progresso</span><span class="font-medium">{{ r.progress.formatted_progress ?? `${r.progress.progress_percentage}%` }}</span></div><Progress :model-value="r.progress.progress_percentage" class="h-1.5" /></div>
            <div class="flex gap-2">
              <Button as-child class="h-11 flex-1"><RouterLink :to="`/portal/resources/${r.id}`">Abrir</RouterLink></Button>
              <Button v-if="!r.progress?.is_completed" variant="outline" :class="cn('h-11')" :disabled="complete.isPending.value" aria-label="Marcar como concluído" @click="complete.mutate(r.id)"><CheckCircle2 /></Button>
            </div>
          </div>
        </article>
      </QueryState>
    </div>
  </PullToRefresh>
</template>
