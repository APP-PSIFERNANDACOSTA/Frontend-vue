<script setup lang="ts">
import { Loader2, Save } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorState from '@/shared/components/ErrorState.vue'
import FormField from '@/shared/components/FormField.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import SafeHtml from '@/shared/components/SafeHtml.vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import sessionService from '../api'
import sessionReportService from '../report.api'
import { sessionKeys } from '../queries'

const route = useRoute()
const router = useRouter()
const patientId = computed(() => Number(route.params.id))
const sessionId = computed(() => Number(route.params.sessionId))
const back = computed(() => `/dashboard/patients/${patientId.value}?tab=sessions`)

// Sessão + relatório existente (se houver) numa única query
const data = useQuery({
  queryKey: () => ['session-report', patientId.value, sessionId.value],
  queryFn: async () => {
    const [session, { exists }] = await Promise.all([
      sessionService.getSession(patientId.value, sessionId.value),
      sessionReportService.exists(patientId.value, sessionId.value),
    ])
    const report = exists ? await sessionReportService.get(patientId.value, sessionId.value) : null
    return { session, report }
  },
  gcTime: 0,
})

const sessionDate = computed(() => (data.data.value?.session.session_date ? new Date(data.data.value.session.session_date) : null))
const dateLabel = computed(() => (sessionDate.value && !isNaN(+sessionDate.value) ? format(sessionDate.value, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'))
const isEditing = computed(() => !!data.data.value?.report)

const title = ref('')
const content = ref('')
watch(
  () => data.data.value,
  (d) => {
    if (!d) return
    title.value = d.report?.title ?? `Relatório da sessão${sessionDate.value && !isNaN(+sessionDate.value) ? ` - ${format(sessionDate.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}` : ''}`
    content.value = d.report?.content ?? ''
  },
  { immediate: true },
)

const save = useApiMutation(
  () => {
    const payload = { title: title.value.trim(), content: content.value }
    return isEditing.value
      ? sessionReportService.update(patientId.value, sessionId.value, payload)
      : sessionReportService.create(patientId.value, sessionId.value, payload)
  },
  {
    success: () => (isEditing.value ? 'Relatório atualizado com sucesso.' : 'Relatório criado com sucesso.'),
    error: 'Não foi possível salvar o relatório',
    invalidate: [['session-reports'], sessionKeys.all],
    onSuccess: () => router.push(back.value),
  },
)

function submit() {
  if (!title.value.trim()) return notify.error('Erro', 'O título é obrigatório.')
  if (!content.value.trim()) return notify.error('Erro', 'O conteúdo do relatório é obrigatório.')
  save.mutate(undefined)
}
</script>

<template>
  <LoadingState v-if="data.isPending.value" />
  <ErrorState v-else-if="data.isError.value" message="Não foi possível carregar os dados da sessão." @retry="data.refetch()" />

  <form v-else class="space-y-6" @submit.prevent="submit">
    <PageHeader :title="isEditing ? 'Editar relatório' : 'Criar relatório'" :description="`Sessão de ${dateLabel}`" :back="back">
      <template #actions>
        <Button type="submit" :disabled="save.isPending.value">
          <Loader2 v-if="save.isPending.value" class="animate-spin" /><Save v-else />
          {{ save.isPending.value ? 'Salvando...' : 'Salvar relatório' }}
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardHeader><CardTitle>Informações do relatório</CardTitle></CardHeader>
      <CardContent class="space-y-6">
        <FormField v-slot="{ id }" label="Título do relatório" required>
          <Input :id="id" v-model="title" placeholder="Ex: Relatório da sessão - 20/11/2025" />
        </FormField>
        <FormField label="Conteúdo do relatório" required hint="Use a barra de ferramentas para formatar o texto (negrito, itálico, listas, etc.)">
          <RichTextEditor v-model="content" placeholder="Escreva o relatório da sessão aqui..." />
        </FormField>
      </CardContent>
    </Card>

    <Card v-if="content.trim()">
      <CardHeader><CardTitle>Pré-visualização</CardTitle></CardHeader>
      <CardContent><SafeHtml :html="content" /></CardContent>
    </Card>
  </form>
</template>
