<script setup lang="ts">
import { Brain, GripVertical, Loader2, Plus, Save, Sparkles, Trash2 } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PatientMultiSelect from '@/features/patients/components/PatientMultiSelect.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { notify } from '@/shared/lib/toast'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import { quizTypeLabel } from '../status'
import { useGenerateQuestions, useGenerateQuiz, useQuiz, useQuizAssignments, useSaveQuiz } from '../queries'
import type { CreateQuizData, CreateQuizQuestionData } from '../types'

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))

const DEFAULT_OPTIONS = () => [
  { value: '0', label: 'Nunca' }, { value: '1', label: 'Raramente' }, { value: '2', label: 'Às vezes' }, { value: '3', label: 'Frequentemente' }, { value: '4', label: 'Sempre' },
]
const form = reactive({ title: '', description: '', type: '', duration_minutes: 5 })
const questions = ref<CreateQuizQuestionData[]>([])
const patientIds = ref<number[]>([])
const dueDate = ref('')
const notes = ref('')
const errors = ref<Record<string, string>>({})

// ---- edição: carrega quiz + atribuições existentes ----
const quizQ = useQuiz(() => id.value ?? 0)
const assignQ = useQuizAssignments(() => id.value ?? 0)
const loaded = ref(false)
watch([() => quizQ.data.value, () => assignQ.data.value], ([quiz, assigns]) => {
  if (!id.value || loaded.value || !quiz || !assigns) return
  Object.assign(form, { title: quiz.title, description: quiz.description || '', type: quizTypeLabel(quiz.type), duration_minutes: quiz.duration_minutes })
  questions.value = (quiz.questions ?? []).map((q) => ({ question_text: q.question_text, question_type: q.question_type, options: (q.options ?? []).map((o) => ({ ...o })), order: q.order, required: q.required }))
  patientIds.value = assigns.map((a) => a.patient_id)
  dueDate.value = assigns[0]?.due_date?.slice(0, 10) ?? ''
  notes.value = assigns[0]?.notes ?? ''
  loaded.value = true
}, { immediate: true })
const ready = computed(() => !id.value || loaded.value)

function addQuestion() {
  questions.value.push({ question_text: '', question_type: 'multiple_choice', options: DEFAULT_OPTIONS(), order: questions.value.length, required: true })
}
const toQuestions = (list: any[]): CreateQuizQuestionData[] => list.map((q, i) => ({ question_text: q.question_text || '', question_type: q.question_type || 'multiple_choice', options: q.options || [], order: questions.value.length + i, required: true }))

// ---- IA ----
const aiCount = ref('5')
const aiType = ref('mixed')
const genQuestions = useGenerateQuestions((list) => {
  questions.value.push(...toQuestions(list))
  notify.success('Perguntas geradas!', `${list.length} perguntas foram adicionadas ao quiz.`)
})
function generateQuestions() {
  if (!form.type.trim()) return notify.error('Informe o tipo/tema', 'Preencha o tipo/tema antes de gerar perguntas com IA.')
  genQuestions.mutate({ type: form.type, count: Number(aiCount.value), question_type: aiType.value })
}
const aiOpen = ref(false)
const aiTopic = ref('')
const aiQuizCount = ref(5)
const genQuiz = useGenerateQuiz((d) => {
  Object.assign(form, { title: d.title, description: d.description || '', type: aiTopic.value.trim() || d.type || 'Personalizado', duration_minutes: d.duration_minutes })
  questions.value = []
  questions.value = toQuestions(d.questions)
  notify.success('Quiz gerado com IA', `“${d.title}” gerado! Revise e ajuste antes de salvar.`)
  aiOpen.value = false
  aiTopic.value = ''
})
function generateQuiz() {
  if (!aiTopic.value.trim()) return notify.error('Digite um tema para o quiz')
  if (aiQuizCount.value < 3 || aiQuizCount.value > 20) return notify.error('A quantidade de perguntas deve ser entre 3 e 20')
  genQuiz.mutate({ topic: aiTopic.value.trim(), question_count: aiQuizCount.value })
}

// ---- salvar ----
const save = useSaveQuiz(id.value, () => router.push('/dashboard/quizzes'))
function validate() {
  const e: Record<string, string> = {}
  if (!form.title.trim()) e.title = 'O título é obrigatório'
  if (!form.type.trim()) e.type = 'O tipo/tema é obrigatório'
  if (!questions.value.length) e.questions = 'Pelo menos uma pergunta é obrigatória'
  questions.value.forEach((q, i) => {
    if (!q.question_text.trim()) e[`q${i}`] = 'O texto da pergunta é obrigatório'
    if (q.question_type === 'multiple_choice') {
      if ((q.options?.length ?? 0) < 2) e[`q${i}o`] = 'Pelo menos 2 opções são obrigatórias'
      else if (q.options!.some((o) => !o.value.trim() || !o.label.trim())) e[`q${i}o`] = 'Valor e rótulo são obrigatórios em todas as opções'
    }
  })
  errors.value = e
  return !Object.keys(e).length
}
function submit(status: 'draft' | 'active') {
  if (!validate()) return notify.error('Erro de validação', 'Corrija os campos destacados antes de continuar.')
  const data: CreateQuizData = {
    title: form.title.trim(), description: form.description.trim() || undefined, type: form.type.trim() as CreateQuizData['type'], duration_minutes: form.duration_minutes || 5, status,
    questions: questions.value.map((q, order) => ({ ...q, order, options: q.question_type === 'multiple_choice' ? q.options : [] })),
  }
  save.mutate({ data, patientIds: patientIds.value, dueDate: dueDate.value, notes: notes.value })
}
const busy = computed(() => save.isPending.value)
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="id ? 'Editar quiz' : 'Criar novo quiz'" :description="id ? 'Atualize as informações, perguntas e atribuições.' : 'Monte o questionário e atribua aos seus pacientes.'" back="/dashboard/quizzes">
      <template #actions>
        <Button v-if="!id" variant="outline" @click="aiOpen = true"><Sparkles /> Gerar com IA</Button>
        <Button variant="outline" :disabled="busy" @click="submit('draft')"><Loader2 v-if="busy" class="animate-spin" /><Save v-else /> Salvar rascunho</Button>
        <Button :disabled="busy" @click="submit('active')"><Brain /> {{ id ? 'Salvar e publicar' : 'Publicar' }}</Button>
      </template>
    </PageHeader>

    <QueryState v-if="id" :query="quizQ" :empty="false"><span /></QueryState>

    <div v-if="ready" class="grid gap-6 lg:grid-cols-3">
      <div class="min-w-0 space-y-6 lg:col-span-2">
        <SectionCard title="Informações básicas" description="Título, tema e duração do quiz">
          <div class="space-y-4">
            <FormField v-slot="{ id: fid }" label="Título" required :error="errors.title"><Input :id="fid" v-model="form.title" placeholder="Ex: Avaliação de ansiedade semanal" /></FormField>
            <FormField v-slot="{ id: fid }" label="Descrição"><Textarea :id="fid" v-model="form.description" rows="3" placeholder="Descreva o objetivo do quiz..." /></FormField>
            <div class="grid gap-4 sm:grid-cols-2">
              <FormField v-slot="{ id: fid }" label="Tipo/tema" required :error="errors.type"><Input :id="fid" v-model="form.type" list="quiz-type-suggestions" placeholder="Ex: Ansiedade, Sono, Estresse..." /><datalist id="quiz-type-suggestions"><option>Ansiedade</option><option>Depressão</option><option>Sono</option><option>Humor</option><option>Autoestima</option><option>Estresse</option></datalist></FormField>
              <FormField v-slot="{ id: fid }" label="Duração (minutos)"><Input :id="fid" v-model.number="form.duration_minutes" type="number" min="1" max="60" inputmode="numeric" /></FormField>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Atribuição de pacientes" description="Quem poderá responder este quiz (opcional)">
          <div class="space-y-4">
            <PatientMultiSelect v-model="patientIds" />
            <div v-if="patientIds.length" class="grid gap-4 sm:grid-cols-2">
              <FormField v-slot="{ id: fid }" label="Prazo"><Input :id="fid" v-model="dueDate" type="date" /></FormField>
              <FormField v-slot="{ id: fid }" label="Observações"><Input :id="fid" v-model="notes" placeholder="Opcional" /></FormField>
            </div>
          </div>
        </SectionCard>

        <Card>
          <CardContent class="space-y-4">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><h2 class="font-semibold">Perguntas</h2><p class="text-sm text-muted-foreground">Adicione manualmente ou gere com IA a partir do tema</p></div>
              <div class="flex flex-wrap items-center gap-2">
                <Select v-model="aiCount"><SelectTrigger class="w-20" aria-label="Quantidade"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="n in ['3', '5', '7', '10']" :key="n" :value="n">{{ n }}</SelectItem></SelectContent></Select>
                <Select v-model="aiType"><SelectTrigger class="w-36" aria-label="Tipo de pergunta"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mixed">Misto</SelectItem><SelectItem value="multiple_choice">Múltipla escolha</SelectItem><SelectItem value="scale">Escala</SelectItem><SelectItem value="text">Texto livre</SelectItem></SelectContent></Select>
                <Button variant="outline" size="sm" :disabled="genQuestions.isPending.value" @click="generateQuestions"><Loader2 v-if="genQuestions.isPending.value" class="animate-spin" /><Sparkles v-else /> Gerar com IA</Button>
                <Button variant="outline" size="sm" @click="addQuestion"><Plus /> Adicionar</Button>
              </div>
            </div>
            <p v-if="errors.questions" class="text-sm text-destructive">{{ errors.questions }}</p>

            <EmptyState v-if="!questions.length" :icon="Brain" title="Nenhuma pergunta adicionada" description="Clique em “Adicionar” ou gere perguntas com IA." />
            <div v-else class="space-y-4">
              <div v-for="(q, i) in questions" :key="i" class="space-y-3 rounded-lg border border-brand/30 p-4">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2"><GripVertical class="size-4 text-muted-foreground" /><Badge variant="outline">Pergunta {{ i + 1 }}</Badge></div>
                  <div class="flex items-center gap-3">
                    <label class="flex items-center gap-2 text-xs text-muted-foreground"><Switch v-model="q.required" /> Obrigatória</label>
                    <Button variant="ghost" size="icon" class="size-8" aria-label="Remover pergunta" @click="questions.splice(i, 1)"><Trash2 class="size-4 text-destructive" /></Button>
                  </div>
                </div>
                <FormField v-slot="{ id: fid }" label="Texto da pergunta" required :error="errors[`q${i}`]"><Textarea :id="fid" v-model="q.question_text" rows="2" placeholder="Digite sua pergunta aqui..." /></FormField>
                <FormField label="Tipo de pergunta">
                  <Select v-model="q.question_type" @update:model-value="(v) => v === 'multiple_choice' && !q.options?.length && (q.options = DEFAULT_OPTIONS())">
                    <SelectTrigger class="w-full sm:w-64"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="multiple_choice">Múltipla escolha</SelectItem><SelectItem value="scale">Escala (0 a 10)</SelectItem><SelectItem value="text">Texto livre</SelectItem></SelectContent>
                  </Select>
                </FormField>
                <div v-if="q.question_type === 'multiple_choice'" class="space-y-2">
                  <div class="flex items-center justify-between"><p class="text-sm font-medium">Opções de resposta *</p><Button variant="outline" size="sm" @click="(q.options ??= []).push({ value: '', label: '' })"><Plus /> Opção</Button></div>
                  <div v-for="(o, oi) in q.options" :key="oi" class="flex items-center gap-2">
                    <Input v-model="o.value" class="w-20 shrink-0 sm:w-28" placeholder="Valor" aria-label="Valor" />
                    <Input v-model="o.label" class="min-w-0 flex-1" placeholder="Rótulo (ex: Nunca)" aria-label="Rótulo" />
                    <Button variant="ghost" size="icon" class="size-8 shrink-0" aria-label="Remover opção" @click="q.options!.splice(oi, 1)"><Trash2 class="size-4 text-destructive" /></Button>
                  </div>
                  <p v-if="errors[`q${i}o`]" class="text-xs text-destructive">{{ errors[`q${i}o`] }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="min-w-0 space-y-6">
        <SectionCard title="Pré-visualização" :icon="Brain">
          <h3 class="font-medium">{{ form.title || 'Título do quiz' }}</h3>
          <p v-if="form.description" class="mt-1 text-sm text-muted-foreground">{{ form.description }}</p>
          <div class="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{{ form.type || 'Sem tipo' }}</Badge><Badge variant="secondary">{{ form.duration_minutes }} min</Badge><Badge variant="secondary">{{ questions.length }} perguntas</Badge></div>
          <p class="mt-3 text-sm text-muted-foreground">{{ patientIds.length }} paciente(s) atribuído(s)</p>
        </SectionCard>
        <SectionCard title="Dicas">
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li>• O tipo/tema é livre: use o assunto que quiser avaliar.</li>
            <li>• Em escalas e múltipla escolha, o valor numérico define a pontuação.</li>
            <li>• Salve como rascunho para revisar antes de liberar aos pacientes.</li>
            <li>• Revise sempre o conteúdo gerado por IA.</li>
          </ul>
        </SectionCard>
      </div>
    </div>

    <ResponsiveDialog v-model:open="aiOpen" title="Gerar quiz com IA" description="Informe o tema e a quantidade de perguntas; você poderá revisar antes de salvar.">
      <div class="space-y-4">
        <FormField v-slot="{ id: fid }" label="Tema/nicho" required><Input :id="fid" v-model="aiTopic" placeholder="Ex: Ansiedade, Sono, Autoestima..." /></FormField>
        <FormField v-slot="{ id: fid }" label="Quantidade de perguntas (3 a 20)"><Input :id="fid" v-model.number="aiQuizCount" type="number" min="3" max="20" inputmode="numeric" /></FormField>
        <div class="flex justify-end gap-2"><Button variant="outline" @click="aiOpen = false">Cancelar</Button><Button :disabled="genQuiz.isPending.value" @click="generateQuiz"><Loader2 v-if="genQuiz.isPending.value" class="animate-spin" /><Sparkles v-else /> Gerar</Button></div>
      </div>
    </ResponsiveDialog>
  </div>
</template>
