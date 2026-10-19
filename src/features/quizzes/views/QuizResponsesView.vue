<script setup lang="ts">
import { AlertCircle, BarChart3, Brain, Calendar, CheckCircle2, Clock, FileText, User } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { ATTEMPT_STATUS_MAP, QUESTION_TYPE_LABELS, quizTypeLabel } from '../status'
import { usePatientQuizResponses } from '../queries'

const route = useRoute()
const quizId = computed(() => Number(route.params.id))
const query = usePatientQuizResponses(quizId, () => Number(route.params.patientId))
const privacy = usePrivacyMode()
const data = computed(() => query.data.value)
/** Múltipla escolha: mostra o rótulo da opção escolhida (o backend guarda só o valor). */
const choiceLabel = (r: any) => r.answer_text || r.question?.options?.find((o: any) => o.value === r.answer_value)?.label || r.answer_value || 'N/A'
const stamp = (v?: string) => formatDate(v, 'dd/MM/yyyy HH:mm')
</script>

<template>
  <QueryState :query="query" loading-label="Carregando respostas...">
    <div v-if="data" class="space-y-6">
      <PageHeader title="Respostas do paciente" :back="`/dashboard/quizzes/${quizId}`" :description="`Respostas de ${data.patient?.name ? privacy.name(data.patient.name) : 'Paciente'} nesta avaliação`" />

      <div class="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Paciente" :icon="User">
          <dl class="grid gap-3 sm:grid-cols-2">
            <div><dt class="text-sm text-muted-foreground">Nome</dt><dd class="font-medium">{{ data.patient?.name ? privacy.name(data.patient.name) : 'N/A' }}</dd></div>
            <div class="min-w-0"><dt class="text-sm text-muted-foreground">E-mail</dt><dd class="truncate font-medium">{{ data.patient?.email ? privacy.email(data.patient.email) : 'N/A' }}</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Avaliação" :icon="Brain">
          <dl class="grid gap-3 sm:grid-cols-2">
            <div><dt class="text-sm text-muted-foreground">Título</dt><dd class="font-medium">{{ data.quiz?.title || 'N/A' }}</dd></div>
            <div><dt class="text-sm text-muted-foreground">Tipo</dt><dd class="font-medium">{{ data.quiz?.type ? quizTypeLabel(data.quiz.type) : 'N/A' }}</dd></div>
            <div><dt class="text-sm text-muted-foreground">Duração</dt><dd class="font-medium">{{ data.quiz?.duration_minutes || 0 }} minutos</dd></div>
            <div><dt class="text-sm text-muted-foreground">Perguntas</dt><dd class="font-medium">{{ data.quiz?.questions?.length || 0 }}</dd></div>
          </dl>
        </SectionCard>
      </div>

      <EmptyState v-if="!data.attempts?.length" :icon="FileText" title="Nenhuma tentativa encontrada" description="Este paciente ainda não iniciou este quiz." />
      <div v-else class="space-y-4">
        <Card v-for="(a, i) in data.attempts" :key="a.id" class="border-brand/30">
          <CardContent class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="flex items-center gap-2 text-lg font-semibold"><FileText class="size-5" />Tentativa {{ Number(i) + 1 }}</h3>
              <div class="flex items-center gap-2"><StatusBadge :status="a.status" :map="ATTEMPT_STATUS_MAP" /><Badge v-if="a.score != null" variant="outline">Score: {{ a.score }}%</Badge></div>
            </div>
            <div v-if="a.started_at" class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span class="inline-flex items-center gap-1"><Calendar class="size-4" />Iniciado em {{ stamp(a.started_at) }}</span>
              <span v-if="a.completed_at" class="inline-flex items-center gap-1"><CheckCircle2 class="size-4" />Concluído em {{ stamp(a.completed_at) }}</span>
              <span v-if="a.time_spent_seconds" class="inline-flex items-center gap-1"><Clock class="size-4" />{{ Math.max(1, Math.round(a.time_spent_seconds / 60)) }} min</span>
            </div>

            <div v-if="a.responses?.length" class="space-y-3">
              <h4 class="font-semibold">Respostas</h4>
              <div v-for="(r, ri) in a.responses" :key="r.id" class="space-y-2 rounded-lg border p-4">
                <div class="flex flex-wrap items-center gap-2"><Badge variant="outline">Pergunta {{ Number(ri) + 1 }}</Badge><Badge v-if="r.question" variant="secondary" class="text-xs">{{ QUESTION_TYPE_LABELS[r.question.question_type] }}</Badge></div>
                <p class="font-medium">{{ r.question?.question_text || 'Pergunta não encontrada' }}</p>
                <div class="rounded-lg border border-brand/30 bg-brand/5 p-3">
                  <div v-if="r.question?.question_type === 'scale'" class="flex items-center gap-2"><Badge variant="outline" class="text-lg font-bold">{{ r.answer_value || r.answer_text || 'N/A' }}</Badge><span class="text-sm text-muted-foreground">de 0 a 10</span></div>
                  <p v-else-if="r.question?.question_type === 'multiple_choice'" class="font-medium">{{ choiceLabel(r) }}</p>
                  <p v-else class="whitespace-pre-wrap">{{ r.answer_text || r.answer_value || 'Sem resposta' }}</p>
                </div>
                <div v-if="r.question?.question_type === 'multiple_choice' && r.question.options?.length" class="space-y-1">
                  <p class="text-xs text-muted-foreground">Opções disponíveis:</p>
                  <div class="flex flex-wrap gap-2"><Badge v-for="(o, oi) in r.question.options" :key="oi" :variant="o.value === r.answer_value ? 'default' : 'outline'" class="text-xs">{{ o.value }}: {{ o.label }}</Badge></div>
                </div>
              </div>
            </div>
            <p v-else class="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"><AlertCircle class="size-4" />Nenhuma resposta encontrada para esta tentativa.</p>

            <div v-if="a.score_interpretation" class="rounded-lg border border-brand/30 bg-brand/5 p-4">
              <h4 class="mb-2 flex items-center gap-2 font-semibold"><BarChart3 class="size-5 text-brand-600" />Interpretação do score</h4>
              <Badge v-if="a.score_interpretation.level" class="mb-2">{{ a.score_interpretation.level }}</Badge>
              <p v-if="a.score_interpretation.description" class="text-sm">{{ a.score_interpretation.description }}</p>
            </div>
            <div v-if="a.ai_feedback" class="rounded-lg border border-brand/30 bg-brand/5 p-4">
              <h4 class="mb-2 flex items-center gap-2 font-semibold"><Brain class="size-5 text-brand-600" />Análise</h4>
              <p class="whitespace-pre-wrap text-sm">{{ a.ai_feedback }}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </QueryState>
</template>
