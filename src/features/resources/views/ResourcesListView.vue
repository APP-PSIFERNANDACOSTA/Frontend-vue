<script setup lang="ts">
import { Eye, FileText, Library, Pencil, Plus, Trash2, User, Users } from '@lucide/vue'
import { computed, ref } from 'vue'
import CardGrid from '@/shared/components/data/CardGrid.vue'
import FilterBar from '@/shared/components/data/FilterBar.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { categoryLabel, fileIcon, fileTypeLabel } from '../ui'
import { useDeleteResource, useResources } from '../queries'
import { RESOURCE_CATEGORIES, SHARING_TYPES, type Resource } from '../types'

const search = ref('')
const category = ref('all')
const sharing = ref('all')
const activeCount = computed(() => [category.value !== 'all', sharing.value !== 'all'].filter(Boolean).length)
const clear = () => ((search.value = ''), (category.value = 'all'), (sharing.value = 'all'))
const query = useResources(() => ({ search: search.value || undefined, category: category.value === 'all' ? undefined : category.value, sharing_type: sharing.value === 'all' ? undefined : sharing.value }))
const resources = computed(() => query.data.value ?? [])

const confirm = useConfirm()
const del = useDeleteResource()
async function remove(r: Resource) {
  if (await confirm({ title: 'Excluir recurso?', description: `“${r.title}” será removido da biblioteca.`, confirmText: 'Excluir', destructive: true })) del.mutate(r.id)
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Biblioteca de recursos" description="Gerencie seus recursos digitais e compartilhe com pacientes">
      <template #actions><Button as-child><RouterLink to="/dashboard/resources/create"><Plus /> Novo recurso</RouterLink></Button></template>
    </PageHeader>

    <FilterBar v-model:search="search" search-placeholder="Buscar recursos..." :active-count="activeCount" storage-key="resources-filters-open" @clear="clear">
      <FormField label="Categoria"><Select v-model="category"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem><SelectItem v-for="c in RESOURCE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</SelectItem></SelectContent></Select></FormField>
      <FormField label="Compartilhamento"><Select v-model="sharing"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem v-for="s in SHARING_TYPES" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent></Select></FormField>
    </FilterBar>

    <QueryState :query="query" :empty="resources.length === 0">
      <template #empty>
        <EmptyState :icon="Library" title="Nenhum recurso encontrado" :description="search || activeCount ? 'Tente ajustar seus filtros ou buscar por outros termos' : 'Comece criando seu primeiro recurso digital'">
          <Button as-child><RouterLink to="/dashboard/resources/create"><Plus /> Criar primeiro recurso</RouterLink></Button>
        </EmptyState>
      </template>
      <CardGrid :items="resources" item-key="id">
        <template #item="{ item: r }">
          <Card class="group h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-lg">
            <RouterLink :to="`/dashboard/resources/${r.id}`" class="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 to-background">
              <img v-if="r.cover_url" :src="r.cover_url" :alt="r.title" class="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div v-else class="flex flex-col items-center p-6 text-center"><span class="mb-2 rounded-full bg-brand-100 p-4"><component :is="fileIcon(r.file_type)" class="size-8 text-brand-700" /></span><p class="text-sm font-medium text-muted-foreground">{{ fileTypeLabel(r.file_type) }}</p></div>
              <Badge variant="secondary" class="absolute left-3 top-3 bg-white/90 text-foreground"><component :is="fileIcon(r.file_type)" class="size-3" />{{ fileTypeLabel(r.file_type) }}</Badge>
            </RouterLink>
            <div class="flex flex-1 flex-col gap-3 p-4">
              <div><RouterLink :to="`/dashboard/resources/${r.id}`" class="line-clamp-2 font-semibold leading-tight hover:underline">{{ r.title }}</RouterLink><p v-if="r.description" class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ r.description }}</p></div>
              <div class="flex flex-wrap items-center gap-2"><Badge variant="outline" class="text-xs">{{ categoryLabel(r.category) }}</Badge><Badge v-if="r.sharing_type === 'public'" class="text-xs"><Users class="size-3" />Público</Badge><Badge v-else variant="secondary" class="text-xs"><User class="size-3" />Seletivo</Badge></div>
              <div class="mt-auto flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground"><span class="inline-flex items-center gap-1"><Eye class="size-3.5" />{{ r.progress_count || 0 }}</span><span class="inline-flex items-center gap-1"><FileText class="size-3.5" />{{ r.notes_count || 0 }}</span><span v-if="r.formatted_file_size" class="ml-auto">{{ r.formatted_file_size }}</span></div>
              <div class="flex gap-2">
                <Button as-child size="sm" class="flex-1"><RouterLink :to="`/dashboard/resources/${r.id}`"><Eye /> Ver</RouterLink></Button>
                <Button as-child variant="outline" size="icon" class="size-8" aria-label="Editar"><RouterLink :to="`/dashboard/resources/${r.id}/edit`"><Pencil class="size-4" /></RouterLink></Button>
                <Button variant="outline" size="icon" class="size-8 text-destructive" aria-label="Excluir" @click="remove(r)"><Trash2 class="size-4" /></Button>
              </div>
            </div>
          </Card>
        </template>
      </CardGrid>
    </QueryState>
  </div>
</template>
