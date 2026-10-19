<script setup lang="ts">
import { Pencil, Plus, Target } from '@lucide/vue'
import { computed } from 'vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import CardGrid from '@/shared/components/data/CardGrid.vue'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { exerciseIcon } from '../components/ExerciseIcon'
import { useExercises, useToggleExercise } from '../queries'
import type { Exercise } from '../types'

const query = useExercises()
const toggle = useToggleExercise()
const sorted = computed(() => [...(query.data.value ?? [])].sort((a, b) => a.title.localeCompare(b.title)))
const TYPE_LABEL = { timer: 'Com tempo', counter: 'Contagem', guided: 'Guiado' }
const totalSeconds = (e: Exercise) => (e.steps ?? []).reduce((a, s) => a + s.duration_seconds, 0)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Exercícios terapêuticos" description="Cadastre exercícios como respiração, mindfulness e outras práticas para seus pacientes.">
      <template #actions><Button as-child><RouterLink to="/dashboard/exercises/create"><Plus /> Novo exercício</RouterLink></Button></template>
    </PageHeader>

    <QueryState :query="query" :empty="sorted.length === 0" loading-label="Carregando exercícios...">
      <template #empty><EmptyState :icon="Target" title="Nenhum exercício cadastrado" description="Clique em “Novo exercício” para começar." /></template>
      <CardGrid :items="sorted" item-key="id">
        <template #item="{ item: e }">
          <Card :class="cn('h-full', e.is_active ? 'border-brand/30' : 'border-dashed')">
            <CardContent class="flex h-full flex-col gap-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-start gap-3">
                  <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50"><component :is="exerciseIcon(e.category)" class="size-5 text-brand-600" /></span>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ e.title }}</h2><Badge v-if="!e.is_active" variant="outline" class="text-xs">Inativo</Badge></div>
                    <p v-if="e.category" class="mt-0.5 text-xs text-muted-foreground">{{ e.category }}</p>
                    <p v-if="e.description" class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ e.description }}</p>
                  </div>
                </div>
                <Button as-child variant="outline" size="icon" class="size-8 shrink-0" aria-label="Editar"><RouterLink :to="`/dashboard/exercises/${e.id}/edit`"><Pencil class="size-4" /></RouterLink></Button>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{{ TYPE_LABEL[e.type] }}</Badge>
                <span v-if="e.type === 'timer' && e.duration_seconds">{{ Math.round(e.duration_seconds / 60) }} min recomendados</span>
                <span v-if="e.type === 'counter' && e.target_reps">{{ e.target_reps }} repetições recomendadas</span>
                <span v-if="e.type === 'guided' && e.steps?.length">{{ e.steps.length }} passos ({{ Math.round((totalSeconds(e) / 60) * 10) / 10 }} min)</span>
              </div>
              <div class="mt-auto flex items-center gap-2 border-t pt-3">
                <Switch :id="`active-${e.id}`" :model-value="e.is_active" :disabled="toggle.isPending.value" @update:model-value="toggle.mutate(e.id)" />
                <Label :for="`active-${e.id}`" class="text-xs font-normal text-muted-foreground">{{ e.is_active ? 'Visível no portal do paciente' : 'Oculto no portal do paciente' }}</Label>
              </div>
            </CardContent>
          </Card>
        </template>
      </CardGrid>
    </QueryState>
  </div>
</template>
