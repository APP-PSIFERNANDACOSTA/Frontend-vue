<script setup lang="ts">
import { Loader2 } from '@lucide/vue'
import { reactive, watch } from 'vue'
import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import { useSaveTask } from '@/features/tasks/queries'
import type { Task, TaskCategory, TaskPriority } from '@/features/tasks/types'
import FormField from '@/shared/components/FormField.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../tasks-ui'

const props = defineProps<{ task: Task | null }>()
const open = defineModel<boolean>('open', { default: false })

const blank = () => ({ title: '', description: '', priority: 'medium' as TaskPriority, category: 'other' as TaskCategory, due_date: '', patient_id: null as number | null })
const form = reactive(blank())
// (re)preenche ao abrir: edição carrega a tarefa, criação limpa o formulário
watch(open, (o) => {
  if (!o) return
  const t = props.task
  Object.assign(form, t ? { title: t.title ?? t.task, description: t.description || '', priority: t.priority, category: t.category, due_date: t.due_date?.slice(0, 10) || '', patient_id: t.patient_id ?? null } : blank())
})

const save = useSaveTask(() => props.task?.id ?? null, () => (open.value = false))
function submit() {
  if (!form.title.trim()) return notify.error('Campos obrigatórios', 'O título da tarefa é obrigatório.')
  save.mutate(form)
}
</script>

<template>
  <ResponsiveDialog v-model:open="open" :title="task ? 'Editar tarefa' : 'Nova tarefa'" :description="task ? 'Atualize os dados da tarefa' : 'Adicione uma nova tarefa à sua lista'">
    <form class="space-y-4" @submit.prevent="submit">
      <FormField v-slot="{ id }" label="Título da tarefa" required><Input :id="id" v-model="form.title" placeholder="Ex: Atualizar prontuário" /></FormField>
      <FormField v-slot="{ id }" label="Descrição"><Textarea :id="id" v-model="form.description" rows="3" placeholder="Detalhes adicionais (opcional)" /></FormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField label="Prioridade"><Select v-model="form.priority"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="(l, k) in PRIORITY_LABELS" :key="k" :value="k">{{ l }}</SelectItem></SelectContent></Select></FormField>
        <FormField label="Categoria"><Select v-model="form.category"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="(l, k) in CATEGORY_LABELS" :key="k" :value="k">{{ l }}</SelectItem></SelectContent></Select></FormField>
      </div>
      <FormField v-slot="{ id }" label="Data de vencimento"><Input :id="id" v-model="form.due_date" type="date" /></FormField>
      <FormField label="Paciente (opcional)"><PatientSelect v-model="form.patient_id" clearable clear-label="Nenhum paciente" /></FormField>
      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" :disabled="save.isPending.value" @click="open = false">Cancelar</Button>
        <Button type="submit" :disabled="save.isPending.value"><Loader2 v-if="save.isPending.value" class="animate-spin" />{{ task ? 'Atualizar' : 'Criar tarefa' }}</Button>
      </div>
    </form>
  </ResponsiveDialog>
</template>
