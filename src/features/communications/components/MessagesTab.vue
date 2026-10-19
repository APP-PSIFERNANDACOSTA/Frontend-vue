<script setup lang="ts">
import { Loader2, MessageSquare, Plus, Users } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import FormField from '@/shared/components/FormField.vue'
import QueryState from '@/shared/components/QueryState.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useMessages, useSendMessage } from '../queries'

const privacy = usePrivacyMode()
const query = useMessages()
const messages = computed(() => query.data.value ?? [])

const open = ref(false)
const form = reactive({ title: '', body: '', target: 'all' as 'all' | 'patient', patient_id: null as number | null })
watch(open, (o) => o && Object.assign(form, { title: '', body: '', target: 'all', patient_id: null }))

const send = useSendMessage(() => (open.value = false))
function submit() {
  if (!form.title.trim() || !form.body.trim()) return notify.error('Campos obrigatórios', 'Preencha título e mensagem.')
  if (form.target === 'patient' && !form.patient_id) return notify.error('Campos obrigatórios', 'Selecione um paciente para enviar a mensagem.')
  send.mutate({ title: form.title.trim(), body: form.body.trim(), patient_id: form.target === 'all' ? 'all' : form.patient_id })
}
</script>

<template>
  <SectionCard title="Mensagens para pacientes">
    <template #actions><Button @click="open = true"><Plus /> Nova mensagem</Button></template>
    <QueryState :query="query" :empty="messages.length === 0" loading-label="Carregando mensagens...">
      <template #empty><EmptyState :icon="MessageSquare" title="Nenhuma mensagem criada ainda" description="Clique em “Nova mensagem” para começar." /></template>
      <div class="space-y-3">
        <Card v-for="m in messages" :key="m.id">
          <CardContent class="flex items-start gap-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50"><MessageSquare class="size-4 text-brand-600" /></span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium">{{ m.title }}</p>
                <Badge v-if="m.patient" variant="outline" class="text-xs">Para: {{ privacy.name(m.patient.name) }}</Badge>
                <Badge v-else variant="outline" class="text-xs"><Users class="size-3" />Todos os pacientes</Badge>
              </div>
              <p class="mt-1 whitespace-pre-line break-words text-sm text-muted-foreground">{{ privacy.text(m.body, 40) }}</p>
              <p v-if="m.sent_at" class="mt-2 text-xs text-muted-foreground">Enviada em {{ formatDate(m.sent_at) }}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </QueryState>
  </SectionCard>

  <ResponsiveDialog v-model:open="open" title="Criar mensagem" description="Envie uma mensagem geral para todos os pacientes ou uma mensagem específica.">
    <form class="space-y-4" @submit.prevent="submit">
      <FormField v-slot="{ id }" label="Título"><Input :id="id" v-model="form.title" placeholder="Ex.: Mensagem da semana sobre autocuidado" /></FormField>
      <FormField label="Enviar para"><Select v-model="form.target"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os pacientes</SelectItem><SelectItem value="patient">Paciente específico</SelectItem></SelectContent></Select></FormField>
      <FormField v-if="form.target === 'patient'" label="Paciente"><PatientSelect v-model="form.patient_id" /></FormField>
      <FormField v-slot="{ id }" label="Mensagem"><Textarea :id="id" v-model="form.body" rows="5" placeholder="Escreva uma mensagem acolhedora, com orientações e recomendações para a semana..." /></FormField>
      <div class="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" :disabled="send.isPending.value" @click="open = false">Cancelar</Button><Button type="submit" :disabled="send.isPending.value"><Loader2 v-if="send.isPending.value" class="animate-spin" />Enviar mensagem</Button></div>
    </form>
  </ResponsiveDialog>
</template>
