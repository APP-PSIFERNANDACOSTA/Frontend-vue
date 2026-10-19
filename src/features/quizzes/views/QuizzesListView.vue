<script setup lang="ts">
import { BarChart3, Brain, CheckCircle2, Clock, Eye, Info, MoreHorizontal, Pencil, Plus, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import CardGrid from '@/shared/components/data/CardGrid.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import StatCard from '@/shared/components/StatCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { QUIZ_STATUS_MAP, quizTypeLabel } from '../status'
import { useDeleteQuiz, useQuizzes } from '../queries'
import type { Quiz } from '../types'

const query = useQuizzes()
const quizzes = computed(() => query.data.value ?? [])
const confirm = useConfirm()
const del = useDeleteQuiz()
const stat = computed(() => ({
  active: quizzes.value.filter((q) => q.status === 'active').length,
  draft: quizzes.value.filter((q) => q.status === 'draft').length,
  questions: quizzes.value.reduce((t, q) => t + (q.questions?.length || 0), 0),
}))
async function remove(q: Quiz) {
  if (await confirm({ title: 'Excluir quiz?', description: `“${q.title}” será excluído. Esta ação não pode ser desfeita.`, confirmText: 'Excluir', destructive: true })) del.mutate(q.id)
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Quizzes" description="Gerencie os quizzes dos seus pacientes">
      <template #actions><Button as-child><RouterLink to="/dashboard/quizzes/create"><Plus /> Novo quiz</RouterLink></Button></template>
    </PageHeader>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total de quizzes" :value="quizzes.length" :icon="Brain" :loading="query.isPending.value" />
      <StatCard label="Ativos" :value="stat.active" :icon="CheckCircle2" :loading="query.isPending.value" />
      <StatCard label="Rascunhos" :value="stat.draft" :icon="Pencil" :loading="query.isPending.value" />
      <StatCard label="Total de perguntas" :value="stat.questions" :icon="BarChart3" :loading="query.isPending.value" />
    </div>

    <QueryState :query="query" :empty="quizzes.length === 0">
      <template #empty>
        <EmptyState :icon="Brain" title="Nenhum quiz criado" description="Comece criando seu primeiro quiz.">
          <Button as-child><RouterLink to="/dashboard/quizzes/create"><Plus /> Criar primeiro quiz</RouterLink></Button>
        </EmptyState>
      </template>
      <CardGrid :items="quizzes" item-key="id">
        <template #item="{ item: q }">
          <Card class="h-full transition-shadow hover:shadow-md">
            <CardContent class="flex h-full flex-col gap-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <RouterLink :to="`/dashboard/quizzes/${q.id}`" class="block truncate text-lg font-semibold hover:underline">{{ q.title }}</RouterLink>
                  <p v-if="q.description" class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ q.description }}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child><Button variant="ghost" size="icon" class="size-8 shrink-0" aria-label="Ações"><MoreHorizontal /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem as-child><RouterLink :to="`/dashboard/quizzes/${q.id}`"><Eye /> Visualizar</RouterLink></DropdownMenuItem>
                    <DropdownMenuItem as-child><RouterLink :to="`/dashboard/quizzes/${q.id}/edit`"><Pencil /> Editar</RouterLink></DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive" @select="remove(q)"><Trash2 /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div class="flex flex-wrap items-center gap-2"><Badge variant="outline">{{ quizTypeLabel(q.type) }}</Badge><StatusBadge :status="q.status" :map="QUIZ_STATUS_MAP" /></div>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span class="inline-flex items-center gap-1"><Clock class="size-4" />{{ q.duration_minutes }} min</span>
                <span class="inline-flex items-center gap-1"><Brain class="size-4" />{{ q.questions?.length || 0 }} questões</span>
              </div>
              <div class="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                <span class="text-xs text-muted-foreground">Criado em {{ formatDate(q.created_at) }}</span>
                <div class="flex gap-2">
                  <Button as-child variant="outline" size="sm"><RouterLink :to="`/dashboard/quizzes/${q.id}`"><Eye /> Ver</RouterLink></Button>
                  <Button as-child variant="outline" size="sm"><RouterLink :to="`/dashboard/quizzes/${q.id}/edit`"><Pencil /> Editar</RouterLink></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </template>
      </CardGrid>
    </QueryState>

    <Card class="border-brand/30 bg-brand/5">
      <CardContent class="flex items-start gap-3">
        <Info class="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div class="text-sm"><p class="font-medium">Sobre os quizzes</p><p class="mt-1 text-muted-foreground">Crie questionários personalizados para acompanhar o progresso dos seus pacientes, sobre ansiedade, sono, humor, autoestima ou qualquer tema.</p></div>
      </CardContent>
    </Card>
  </div>
</template>
