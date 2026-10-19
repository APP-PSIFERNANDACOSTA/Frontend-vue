<script setup lang="ts">
import { Loader2, Plus, Save, Trash2 } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import { useExercises, useSaveExercise } from '../queries'
import type { ExerciseStep, ExerciseType } from '../types'

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const list = useExercises() // não existe endpoint de detalhe: busca na lista (igual ao app antigo)

const form = reactive({ title: '', description: '', category: '', type: 'timer' as ExerciseType, minutes: '5', reps: '', steps: [] as ExerciseStep[], is_active: true })
const loaded = ref(false)
watch(
  () => list.data.value,
  (all) => {
    if (!id.value || loaded.value || !all) return
    const e = all.find((x) => x.id === id.value)
    if (!e) {
      notify.error('Exercício não encontrado')
      return router.replace('/dashboard/exercises')
    }
    Object.assign(form, { title: e.title, description: e.description || '', category: e.category || '', type: e.type, minutes: e.duration_seconds ? String(Math.round(e.duration_seconds / 60)) : '', reps: e.target_reps ? String(e.target_reps) : '', steps: (e.steps ?? []).map((s) => ({ ...s })), is_active: e.is_active })
    loaded.value = true
  },
  { immediate: true },
)

const save = useSaveExercise(id.value, () => router.push('/dashboard/exercises'))
const total = computed(() => form.steps.reduce((a, s) => a + (s.duration_seconds || 0), 0))

function submit() {
  const fail = (m: string) => notify.error('Campos obrigatórios', m)
  if (!form.title.trim()) return fail('O título do exercício é obrigatório.')
  if (form.type === 'timer' && !form.minutes.trim()) return fail('Informe a duração em minutos para exercícios com tempo.')
  if (form.type === 'counter' && !form.reps.trim()) return fail('Informe o número de repetições para exercícios com contagem.')
  if (form.type === 'guided') {
    if (!form.steps.length) return fail('Adicione pelo menos um passo para exercícios guiados.')
    for (const [i, s] of form.steps.entries()) {
      if (!s.description.trim()) return fail(`A descrição do passo ${i + 1} é obrigatória.`)
      if (!s.duration_seconds || s.duration_seconds < 1) return fail(`O tempo do passo ${i + 1} deve ser pelo menos 1 segundo.`)
    }
  }
  save.mutate({
    title: form.title.trim(),
    description: form.description.trim() || null,
    category: form.category.trim() || null,
    type: form.type,
    duration_seconds: form.type === 'timer' ? Number(form.minutes) * 60 : null,
    target_reps: form.type === 'counter' ? Number(form.reps) : null,
    steps: form.type === 'guided' ? form.steps : null,
    is_active: form.is_active,
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="id ? 'Editar exercício' : 'Novo exercício'" :description="id ? 'Atualize os detalhes do exercício terapêutico.' : 'Defina os detalhes do exercício que ficará disponível para seus pacientes.'" back="/dashboard/exercises" />

    <QueryState v-if="id" :query="list" :empty="false"><span /></QueryState>
    <Card v-if="!id || loaded" class="max-w-3xl">
      <CardHeader><CardTitle>Informações do exercício</CardTitle><CardDescription>Preencha os dados básicos do exercício</CardDescription></CardHeader>
      <CardContent>
        <form class="space-y-5" @submit.prevent="submit">
          <FormField v-slot="{ id: fid }" label="Título" required><Input :id="fid" v-model="form.title" placeholder="Ex.: Respiração 4-7-8" /></FormField>
          <FormField v-slot="{ id: fid }" label="Descrição"><Textarea :id="fid" v-model="form.description" rows="4" placeholder="Explique brevemente como o exercício funciona e quando utilizá-lo." /></FormField>
          <FormField v-slot="{ id: fid }" label="Categoria"><Input :id="fid" v-model="form.category" placeholder="Ex.: respiração, mindfulness, relaxamento..." /></FormField>

          <div class="grid gap-4 md:grid-cols-2">
            <FormField label="Tipo" required>
              <Select v-model="form.type">
                <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="timer">Com tempo (minutos)</SelectItem>
                  <SelectItem value="counter">Com contagem (repetições)</SelectItem>
                  <SelectItem value="guided">Guiado (passos com tempos)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField v-if="form.type === 'timer'" v-slot="{ id: fid }" label="Duração recomendada (minutos)" required><Input :id="fid" v-model="form.minutes" type="number" min="1" max="120" inputmode="numeric" /></FormField>
            <FormField v-else-if="form.type === 'counter'" v-slot="{ id: fid }" label="Repetições recomendadas" required><Input :id="fid" v-model="form.reps" type="number" min="1" max="1000" inputmode="numeric" /></FormField>
          </div>

          <div v-if="form.type === 'guided'" class="space-y-4 border-t pt-5">
            <div class="flex items-center justify-between gap-3">
              <div><p class="font-semibold">Passos do exercício *</p><p class="text-sm text-muted-foreground">Cada passo com descrição e tempo em segundos</p></div>
              <Button type="button" variant="outline" size="sm" @click="form.steps.push({ description: '', duration_seconds: 10 })"><Plus /> Adicionar passo</Button>
            </div>
            <div class="space-y-3 rounded-lg border bg-muted/20 p-3 sm:p-4">
              <p v-if="!form.steps.length" class="py-8 text-center text-sm text-muted-foreground">Nenhum passo adicionado. Clique em “Adicionar passo” para começar.</p>
              <div v-for="(s, i) in form.steps" :key="i" class="space-y-2 rounded-lg border bg-background p-3">
                <span class="text-sm font-medium text-muted-foreground">Passo {{ i + 1 }}</span>
                <Input v-model="s.description" placeholder="Ex.: Inspire pelo nariz contando 4 segundos" />
                <div class="flex items-center gap-2">
                  <Input v-model.number="s.duration_seconds" type="number" min="1" max="600" inputmode="numeric" class="w-28" aria-label="Tempo em segundos" />
                  <span class="text-sm text-muted-foreground">segundos</span>
                  <Button type="button" variant="ghost" size="icon" class="ml-auto" aria-label="Remover passo" @click="form.steps.splice(i, 1)"><Trash2 class="size-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
            <p v-if="form.steps.length" class="text-sm text-muted-foreground">Total: {{ total }} segundos ({{ Math.round((total / 60) * 10) / 10 }} min)</p>
          </div>

          <div class="flex items-center gap-2 border-t pt-4">
            <Switch id="is_active" v-model="form.is_active" /><Label for="is_active" class="text-sm font-normal text-muted-foreground">Disponível no portal do paciente</Label>
          </div>

          <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" :disabled="save.isPending.value" @click="router.push('/dashboard/exercises')">Cancelar</Button>
            <Button type="submit" :disabled="save.isPending.value"><Loader2 v-if="save.isPending.value" class="animate-spin" /><Save v-else />{{ id ? 'Salvar alterações' : 'Criar exercício' }}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
