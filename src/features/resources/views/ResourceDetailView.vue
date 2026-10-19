<script setup lang="ts">
import { BarChart3, Download, Pencil, Plus, Share2, Users, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PatientMultiSelect from '@/features/patients/components/PatientMultiSelect.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { categoryLabel, fileIcon, fileTypeLabel } from '../ui'
import { useResource, useShareResource, useSharedPatients, useUnshareResource } from '../queries'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const query = useResource(id)
const r = computed(() => query.data.value)
const selective = computed(() => r.value?.sharing_type === 'selective')
const sharedQ = useSharedPatients(id, selective)
const privacy = usePrivacyMode()

const dialog = ref(false)
const picked = ref<number[]>([])
const share = useShareResource(id.value, () => ((dialog.value = false), (picked.value = [])))
const unshare = useUnshareResource(id.value)
const fileHref = computed(() => r.value?.file_url)
</script>

<template>
  <QueryState :query="query" loading-label="Carregando recurso...">
    <div v-if="r" class="space-y-6">
      <PageHeader :title="r.title" description="Detalhes e compartilhamento do recurso" back="/dashboard/resources">
        <template #actions>
          <Button as-child variant="outline"><RouterLink :to="`/dashboard/resources/${r.id}/edit`"><Pencil /> Editar</RouterLink></Button>
          <Button v-if="fileHref" as-child><a :href="fileHref" target="_blank" rel="noopener"><Download /> Abrir arquivo</a></Button>
        </template>
      </PageHeader>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="min-w-0 space-y-6 lg:col-span-2">
          <SectionCard title="Pré-visualização">
            <div class="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted">
              <img v-if="r.cover_url" :src="r.cover_url" :alt="r.title" class="max-h-full max-w-full object-contain" />
              <div v-else class="text-center"><component :is="fileIcon(r.file_type)" class="mx-auto mb-3 size-10 text-muted-foreground" /><p class="font-medium">{{ r.title }}</p><p class="text-sm text-muted-foreground">{{ fileTypeLabel(r.file_type) }}</p></div>
            </div>
          </SectionCard>
          <SectionCard title="Detalhes do recurso">
            <dl class="grid gap-4 sm:grid-cols-2">
              <div><dt class="text-sm text-muted-foreground">Categoria</dt><dd class="text-sm">{{ categoryLabel(r.category) }}</dd></div>
              <div><dt class="text-sm text-muted-foreground">Tipo de arquivo</dt><dd class="text-sm">{{ fileTypeLabel(r.file_type) }}</dd></div>
              <div v-if="r.formatted_file_size"><dt class="text-sm text-muted-foreground">Tamanho</dt><dd class="text-sm">{{ r.formatted_file_size }}</dd></div>
              <div><dt class="text-sm text-muted-foreground">Criado em</dt><dd class="text-sm">{{ formatDate(r.created_at) }}</dd></div>
              <div><dt class="text-sm text-muted-foreground">Atualizado em</dt><dd class="text-sm">{{ formatDate(r.updated_at) }}</dd></div>
            </dl>
            <div v-if="r.description" class="mt-4"><p class="text-sm text-muted-foreground">Descrição</p><p class="mt-1 whitespace-pre-line text-sm">{{ r.description }}</p></div>
            <div v-if="r.tags?.length" class="mt-4"><p class="text-sm text-muted-foreground">Tags</p><div class="mt-1 flex flex-wrap gap-2"><Badge v-for="t in r.tags" :key="t" variant="outline">{{ t }}</Badge></div></div>
          </SectionCard>
        </div>

        <div class="min-w-0 space-y-6">
          <SectionCard title="Compartilhamento" :icon="Share2">
            <div class="space-y-4">
              <div class="flex items-center justify-between"><span class="text-sm font-medium">Tipo</span><Badge :variant="selective ? 'secondary' : 'default'">{{ selective ? 'Seletivo' : 'Público' }}</Badge></div>
              <p v-if="!selective" class="flex items-center gap-2 text-sm text-muted-foreground"><Users class="size-4" />Todos os pacientes têm acesso</p>
              <div v-else class="space-y-3">
                <div class="flex items-center justify-between"><span class="text-sm font-medium">Pacientes com acesso</span><Button size="sm" @click="dialog = true"><Plus /> Adicionar</Button></div>
                <p v-if="!sharedQ.data.value?.length" class="text-sm text-muted-foreground">Nenhum paciente selecionado</p>
                <ul v-else class="space-y-2"><li v-for="p in sharedQ.data.value" :key="p.id" class="flex items-center justify-between gap-2 rounded-lg bg-muted/50 p-2"><span class="min-w-0"><span class="block truncate text-sm font-medium">{{ privacy.name(p.name) }}</span><span class="block truncate text-xs text-muted-foreground">{{ privacy.email(p.email) }}</span></span><Button variant="ghost" size="icon" class="size-8 text-destructive" aria-label="Remover acesso" :disabled="unshare.isPending.value" @click="unshare.mutate(p.id, { onSuccess: () => sharedQ.refetch() })"><X class="size-4" /></Button></li></ul>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Estatísticas" :icon="BarChart3">
            <dl class="space-y-3 text-sm"><div class="flex justify-between"><dt class="text-muted-foreground">Visualizações</dt><dd class="font-medium">{{ r.progress_count || 0 }}</dd></div><div class="flex justify-between"><dt class="text-muted-foreground">Anotações</dt><dd class="font-medium">{{ r.notes_count || 0 }}</dd></div><div class="flex justify-between"><dt class="text-muted-foreground">Concluídos</dt><dd class="font-medium">{{ r.completed_count || 0 }}</dd></div></dl>
          </SectionCard>
        </div>
      </div>

      <ResponsiveDialog v-model:open="dialog" title="Compartilhar com pacientes" description="Selecione quem terá acesso a este recurso">
        <div class="space-y-4"><PatientMultiSelect v-model="picked" /><div class="flex justify-end gap-2"><Button variant="outline" @click="dialog = false">Cancelar</Button><Button :disabled="!picked.length || share.isPending.value" @click="share.mutate(picked, { onSuccess: () => sharedQ.refetch() })">Compartilhar</Button></div></div>
      </ResponsiveDialog>
    </div>
  </QueryState>
</template>
