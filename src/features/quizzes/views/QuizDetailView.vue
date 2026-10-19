<script setup lang="ts">
import { AlertCircle, BarChart3, Brain, Calendar, Clock, Eye, FileText, Pencil, Trash2, Users } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ASSIGNMENT_STATUS_MAP, ATTEMPT_STATUS_MAP, QUESTION_TYPE_LABELS, QUIZ_STATUS_MAP, quizTypeLabel } from '../status'
import { useDeleteQuiz, useQuiz, useQuizAssignments, useQuizAttempts } from '../queries'

const route = useRoute()
const router = useRouter()
const quizId = computed(() => Number(route.params.id))
const query = useQuiz(quizId)
const assignmentsQ = useQuizAssignments(quizId)
const attemptsQ = useQuizAttempts(quizId)
const quiz = computed(() => query.data.value)
const assignments = computed(() => assignmentsQ.data.value ?? [])
const privacy = usePrivacyMode()
const stamp = (v?: string) => formatDate(v, 'dd/MM/yyyy HH:mm')

// tentativas agrupadas por paciente (aba "Respostas")
const byPatient = computed(() => {
  const map = new Map<number, { patient: any; attempts: any[] }>()
  for (const a of attemptsQ.data.value ?? []) {
    const g = map.get(a.patient_id) ?? { patient: a.patient || { id: a.patient_id, name: 'Paciente', email: '' }, attempts: [] }
    g.attempts.push(a)
    map.set(a.patient_id, g)
  }
  return [...map.values()].map((g) => ({ ...g, latest: g.attempts.find((a) => a.status === 'completed') || g.attempts[0] }))
})
const completedCount = computed(() => (attemptsQ.data.value ?? []).filter((a: any) => a.status === 'completed').length)

const confirm = useConfirm()
const del = useDeleteQuiz(() => router.replace('/dashboard/quizzes'))
async function remove() {
  if (await confirm({ title: 'Excluir quiz?', description: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir', destructive: true })) del.mutate(quizId.value)
}
const viewResponses = (patientId: number) => router.push(`/dashboard/quizzes/${quizId.value}/responses/${patientId}`)
</script>

<template>
  <QueryState :query="query" loading-label="Carregando quiz...">
    <div v-if="quiz" class="space-y-6">
      <PageHeader :title="quiz.title" :description="quiz.description || 'Visualize as informações do quiz'" back="/dashboard/quizzes">
        <template #actions>
          <Button as-child variant="outline"><RouterLink :to="`/dashboard/quizzes/${quiz.id}/edit`"><Pencil /> Editar</RouterLink></Button>
          <Button variant="destructive" :disabled="del.isPending.value" @click="remove"><Trash2 /> Excluir</Button>
        </template>
      </PageHeader>

      <Tabs default-value="info">
        <TabsList class="grid w-full grid-cols-2 sm:w-96">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="responses" class="gap-2">Respostas <Badge v-if="completedCount" variant="secondary">{{ completedCount }}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="info" class="mt-4">
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="min-w-0 space-y-6 lg:col-span-2">
              <SectionCard title="Informações do quiz" :icon="Brain">
                <dl class="grid gap-4 sm:grid-cols-2">
                  <div><dt class="text-sm text-muted-foreground">Tipo</dt><dd class="mt-1"><Badge variant="outline">{{ quizTypeLabel(quiz.type) }}</Badge></dd></div>
                  <div><dt class="text-sm text-muted-foreground">Status</dt><dd class="mt-1"><StatusBadge :status="quiz.status" :map="QUIZ_STATUS_MAP" /></dd></div>
                  <div><dt class="text-sm text-muted-foreground">Duração</dt><dd class="mt-1 flex items-center gap-1"><Clock class="size-4 text-muted-foreground" />{{ quiz.duration_minutes }} minutos</dd></div>
                  <div><dt class="text-sm text-muted-foreground">Perguntas</dt><dd class="mt-1 flex items-center gap-1"><BarChart3 class="size-4 text-muted-foreground" />{{ quiz.questions?.length || 0 }} questões</dd></div>
                </dl>
              </SectionCard>

              <SectionCard title="Pacientes atribuídos" description="Pacientes que têm acesso a este quiz" :icon="Users">
                <EmptyState v-if="!assignments.length && !assignmentsQ.isPending.value" :icon="Users" title="Nenhum paciente atribuído" description="Este quiz ainda não foi atribuído a nenhum paciente.">
                  <Button as-child variant="outline" size="sm"><RouterLink :to="`/dashboard/quizzes/${quiz.id}/edit`"><Pencil /> Editar quiz</RouterLink></Button>
                </EmptyState>
                <div v-else class="space-y-4">
                  <div v-for="a in assignments" :key="a.id" class="space-y-3 rounded-lg border p-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div class="min-w-0">
                        <h4 class="truncate font-medium">{{ privacy.name(a.patient?.name) }}</h4>
                        <p class="truncate text-sm text-muted-foreground">{{ privacy.email(a.patient?.email) }}</p>
                        <div class="mt-1 flex flex-wrap items-center gap-2">
                          <StatusBadge :status="a.status" :map="ASSIGNMENT_STATUS_MAP" />
                          <span v-if="a.due_date" :class="['inline-flex items-center gap-1 text-xs', new Date(a.due_date) < new Date() && a.status !== 'completed' ? 'font-medium text-destructive' : 'text-muted-foreground']"><Calendar class="size-3" />Prazo: {{ stamp(a.due_date) }}</span>
                        </div>
                      </div>
                      <div class="shrink-0 space-y-2 text-xs text-muted-foreground sm:text-right">
                        <p>Atribuído em {{ stamp(a.assigned_at) }}</p>
                        <Button variant="outline" size="sm" @click="viewResponses(a.patient_id)"><Eye /> Ver respostas</Button>
                      </div>
                    </div>
                    <div class="border-t pt-3">
                      <p v-if="!a.attempts?.length" class="flex items-center gap-2 text-sm text-muted-foreground"><AlertCircle class="size-4" />Nenhuma tentativa realizada ainda</p>
                      <template v-else>
                        <h5 class="mb-2 text-sm font-medium text-muted-foreground">Tentativas ({{ a.attempts.length }})</h5>
                        <div class="space-y-2">
                          <div v-for="(t, i) in a.attempts" :key="t.id" class="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                            <div class="flex min-w-0 items-center gap-3">
                              <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium">{{ i + 1 }}</span>
                              <div class="min-w-0"><StatusBadge :status="t.status" :map="ATTEMPT_STATUS_MAP" /><p class="mt-0.5 text-xs text-muted-foreground">{{ t.started_at ? stamp(t.started_at) : 'Não iniciada' }}<template v-if="t.completed_at"> — {{ stamp(t.completed_at) }}</template></p></div>
                            </div>
                            <div v-if="t.status === 'completed'" class="flex shrink-0 flex-col items-end gap-1">
                              <Badge v-if="t.score != null" variant="secondary">{{ t.score }} pontos</Badge>
                              <Badge v-if="t.score_interpretation?.level" variant="outline" class="text-xs">{{ t.score_interpretation.level }}</Badge>
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Perguntas" description="Lista de perguntas do quiz">
                <EmptyState v-if="!quiz.questions?.length" :icon="Brain" title="Nenhuma pergunta encontrada" description="Este quiz não possui perguntas configuradas." />
                <div v-else class="space-y-4">
                  <Card v-for="(q, i) in quiz.questions" :key="q.id" class="border-brand/30">
                    <CardContent class="space-y-3">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">Pergunta {{ i + 1 }}</Badge>
                        <div class="flex items-center gap-2"><Badge variant="secondary" class="text-xs">{{ QUESTION_TYPE_LABELS[q.question_type] }}</Badge><Badge v-if="q.required" variant="destructive" class="text-xs">Obrigatória</Badge></div>
                      </div>
                      <p class="text-sm">{{ q.question_text }}</p>
                      <div v-if="q.question_type === 'multiple_choice' && q.options?.length" class="space-y-1.5">
                        <p class="text-sm font-medium">Opções de resposta</p>
                        <div v-for="(o, oi) in q.options" :key="oi" class="flex items-center gap-2 text-sm"><Badge variant="outline" class="text-xs">{{ o.value }}</Badge><span>{{ o.label }}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SectionCard>
            </div>

            <div class="min-w-0 space-y-6">
              <SectionCard title="Estatísticas">
                <dl class="space-y-3 text-sm">
                  <div class="flex justify-between"><dt class="text-muted-foreground">ID do quiz</dt><dd class="font-medium">{{ quiz.id }}</dd></div>
                  <div class="flex justify-between"><dt class="text-muted-foreground">Criado em</dt><dd class="font-medium">{{ formatDate(quiz.created_at) }}</dd></div>
                  <div class="flex justify-between"><dt class="text-muted-foreground">Última atualização</dt><dd class="font-medium">{{ formatDate(quiz.updated_at) }}</dd></div>
                  <div class="flex justify-between"><dt class="text-muted-foreground">Tentativas</dt><dd class="font-medium">{{ attemptsQ.data.value?.length ?? 0 }}</dd></div>
                </dl>
              </SectionCard>
              <SectionCard title="Dicas">
                <ul class="space-y-1 text-sm text-muted-foreground"><li>• Edite para fazer alterações</li><li>• Publique para disponibilizar aos pacientes</li><li>• Monitore as tentativas e analise os resultados</li></ul>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="responses" class="mt-4">
          <SectionCard title="Respostas dos pacientes" description="Visualize as respostas dos pacientes que responderam este quiz" :icon="FileText">
            <EmptyState v-if="!byPatient.length && !attemptsQ.isPending.value" :icon="FileText" title="Nenhuma resposta ainda" description="Nenhum paciente respondeu este quiz ainda." />
            <div v-else class="space-y-4">
              <Card v-for="g in byPatient" :key="g.patient.id" class="border-brand/30">
                <CardContent class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="min-w-0">
                    <h4 class="truncate text-lg font-semibold">{{ privacy.name(g.patient.name) }}</h4>
                    <p class="mb-3 truncate text-sm text-muted-foreground">{{ g.patient.email ? privacy.email(g.patient.email) : 'E-mail não disponível' }}</p>
                    <div class="flex flex-wrap items-center gap-2">
                      <StatusBadge :status="g.latest.status" :map="ATTEMPT_STATUS_MAP" />
                      <span v-if="g.latest.completed_at" class="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar class="size-3" />Concluído em {{ stamp(g.latest.completed_at) }}</span>
                      <Badge v-if="g.latest.ai_feedback" variant="outline"><Brain class="size-3" />Análise disponível</Badge>
                      <Badge variant="secondary" class="text-xs">{{ g.attempts.length }} {{ g.attempts.length === 1 ? 'tentativa' : 'tentativas' }}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" class="shrink-0" @click="viewResponses(g.patient.id)"><Eye /> Ver respostas</Button>
                </CardContent>
              </Card>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  </QueryState>
</template>
