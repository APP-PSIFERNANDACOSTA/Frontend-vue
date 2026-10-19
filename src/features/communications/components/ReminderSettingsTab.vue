<script setup lang="ts">
import { MOOD_ENABLED } from '@/features/mood/feature'
import { Bell, Clock, Info, Loader2, Plus, Save, Trash2, User, Users } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { notify } from '@/shared/lib/toast'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import { useNotificationTemplates, useSaveRules, useSaveTemplates, useSessionRules } from '../queries'
import type { NotificationTemplate, SessionReminderRule } from '../templates.api'

const TYPE_LABELS: Record<string, string> = { message_new: 'Nova mensagem', quiz_assigned: 'Quiz atribuído', quiz_updated: 'Quiz atualizado', quiz_response: 'Resposta de quiz', diary_new: 'Novo diário', post_therapy_note: 'Pós-terapia (nova nota)', push_test: 'Notificação de teste', mood_alert: 'Atenção ao humor' }
const RECIPIENT: Record<string, 'patient' | 'psychologist'> = { message_new: 'patient', quiz_assigned: 'patient', quiz_updated: 'patient', quiz_response: 'psychologist', diary_new: 'psychologist', post_therapy_note: 'patient', push_test: 'psychologist', mood_alert: 'psychologist' }
const PLACEHOLDERS: Record<string, string[]> = { message_new: ['{message_title}'], quiz_assigned: ['{quiz_title}'], quiz_updated: ['{quiz_title}'], quiz_response: ['{patient_name}', '{quiz_title}'], diary_new: ['{patient_name}'], post_therapy_note: ['{note_title}', '{patient_name}'], push_test: [], mood_alert: ['{patient_name}', '{reason}'] }
const SESSION_PLACEHOLDERS = ['{date}', '{time}', '{datetime}']
const OFFSETS = [[30, '30 minutos antes'], [60, '1 hora antes'], [120, '2 horas antes'], [180, '3 horas antes'], [360, '6 horas antes'], [720, '12 horas antes'], [1440, '1 dia antes (24h)'], [2880, '2 dias antes']] as const

function offsetLabel(min: number) {
  const hours = Math.floor(min / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} dia${days > 1 ? 's' : ''} antes`
  if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} antes`
  return `${min} minuto${min > 1 ? 's' : ''} antes`
}

// cópias locais editáveis dos dados do servidor
const templatesQ = useNotificationTemplates()
const rulesQ = useSessionRules()
const templates = ref<NotificationTemplate[]>([])
const rules = ref<SessionReminderRule[]>([])
watch(() => templatesQ.data.value, (d) => d && (templates.value = d.map((t) => ({ ...t }))), { immediate: true })
watch(() => rulesQ.data.value, (d) => d && (rules.value = d.map((r) => ({ ...r }))), { immediate: true })
const sortedRules = computed(() => [...rules.value].sort((a, b) => b.offset_minutes - a.offset_minutes))
const byRecipient = (who: 'patient' | 'psychologist') => templates.value.filter((t) => (MOOD_ENABLED || t.type !== 'mood_alert') && (RECIPIENT[t.type] ?? 'psychologist') === who)

const saveTemplates = useSaveTemplates()
const saveRules = useSaveRules()
const addRule = useSaveRules('Regra de lembrete adicionada')

const adding = ref(false)
const blank = (): SessionReminderRule => ({ channel: 'push', offset_minutes: 60, title_template: '', body_template: '', enabled: true, window_minutes: 60 })
const draft = reactive<SessionReminderRule>(blank())
watch(adding, (o) => o && Object.assign(draft, blank()))
function submitRule() {
  if (!draft.title_template.trim()) return notify.error('Erro', 'O título do lembrete é obrigatório')
  addRule.mutate([...rules.value, { ...draft }], { onSuccess: () => (adding.value = false) })
}
</script>

<template>
  <div class="space-y-6">
    <SectionCard title="Modelos de notificação push" description="Personalize as mensagens enviadas quando eventos ocorrem" :icon="Bell">
      <template #actions><Button :disabled="saveTemplates.isPending.value || templatesQ.isPending.value" @click="saveTemplates.mutate(templates)"><Loader2 v-if="saveTemplates.isPending.value" class="animate-spin" /><Save v-else /> Salvar modelos</Button></template>
      <LoadingState v-if="templatesQ.isPending.value" />
      <p v-else-if="!templates.length" class="py-8 text-center text-muted-foreground">Nenhum modelo disponível</p>
      <div v-else class="space-y-8">
        <section v-for="grp in [{ who: 'patient' as const, title: 'Para o paciente', hint: 'Recebidas no app do paciente', icon: Users }, { who: 'psychologist' as const, title: 'Para a psicóloga', hint: 'Recebidas no seu painel', icon: User }]" :key="grp.who">
          <div class="mb-4 flex flex-wrap items-center gap-2"><component :is="grp.icon" class="size-5 text-brand-600" /><h3 class="font-semibold">{{ grp.title }}</h3><Badge variant="secondary" class="text-xs">{{ grp.hint }}</Badge></div>
          <div class="space-y-4">
            <div v-for="t in byRecipient(grp.who)" :key="t.id" class="space-y-3 rounded-lg border p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0"><h4 class="font-semibold">{{ TYPE_LABELS[t.type] || t.type }}</h4><p v-if="PLACEHOLDERS[t.type]?.length" class="mt-1 text-xs text-muted-foreground">Variáveis: {{ PLACEHOLDERS[t.type].join(', ') }}</p></div>
                <div class="flex shrink-0 items-center gap-2"><Label :for="`tpl-${t.id}`" class="text-sm font-normal text-muted-foreground">{{ t.enabled ? 'Ativa' : 'Inativa' }}</Label><Switch :id="`tpl-${t.id}`" v-model="t.enabled" /></div>
              </div>
              <FormField label="Título"><Input v-model="t.title_template" placeholder="Título da notificação" /></FormField>
              <FormField label="Corpo (opcional)"><Textarea v-model="t.body_template" rows="2" placeholder="Corpo da notificação (opcional)" /></FormField>
            </div>
          </div>
        </section>
      </div>
    </SectionCard>

    <SectionCard title="Lembretes de sessão" description="Quando os pacientes devem receber lembretes das sessões" :icon="Clock">
      <template #actions>
        <Button variant="outline" @click="adding = true"><Plus /> Adicionar regra</Button>
        <Button :disabled="saveRules.isPending.value || rulesQ.isPending.value" @click="saveRules.mutate(rules)"><Loader2 v-if="saveRules.isPending.value" class="animate-spin" /><Save v-else /> Salvar regras</Button>
      </template>
      <LoadingState v-if="rulesQ.isPending.value" />
      <p v-else-if="!rules.length" class="py-8 text-center text-muted-foreground">Nenhuma regra de lembrete configurada. Clique em “Adicionar regra” para criar uma.</p>
      <div v-else class="space-y-4">
        <div v-for="(r, i) in sortedRules" :key="r.id ?? `new-${i}`" class="space-y-3 rounded-lg border p-4">
          <div class="flex items-start justify-between gap-3">
            <div><Badge variant="outline"><Clock class="size-3" />{{ offsetLabel(r.offset_minutes) }}</Badge><p class="mt-1 text-xs text-muted-foreground">Janela de busca: {{ r.window_minutes || 60 }} minutos</p></div>
            <div class="flex items-center gap-1"><Switch v-model="r.enabled" :aria-label="`Regra ${offsetLabel(r.offset_minutes)}`" /><Button variant="ghost" size="icon" class="size-8" aria-label="Remover regra" @click="rules.splice(rules.indexOf(r), 1)"><Trash2 class="size-4 text-destructive" /></Button></div>
          </div>
          <FormField label="Título"><Input v-model="r.title_template" /></FormField>
          <FormField label="Corpo (opcional)"><Textarea v-model="r.body_template" rows="2" /></FormField>
          <p class="text-xs text-muted-foreground">Variáveis: {{ SESSION_PLACEHOLDERS.join(', ') }}</p>
        </div>
        <p class="text-xs text-muted-foreground">Remover uma regra só vale depois de clicar em “Salvar regras”.</p>
      </div>
    </SectionCard>

    <div class="flex gap-3 rounded-2xl border border-info/30 bg-info/5 p-4 text-sm">
      <Info class="mt-0.5 size-5 shrink-0 text-info" />
      <div class="space-y-2"><p class="font-semibold">Informações importantes</p>
        <ul class="list-inside list-disc space-y-1 text-muted-foreground"><li>Modelos desativados não enviam notificações, mesmo que o evento ocorra</li><li>As regras de lembrete rodam automaticamente a cada hora</li><li>Use as variáveis para personalizar as mensagens</li><li>Ao salvar, todos os modelos/regras são atualizados</li></ul></div>
    </div>

    <ResponsiveDialog v-model:open="adding" title="Nova regra de lembrete" description="Crie uma regra para enviar lembretes aos pacientes">
      <form class="space-y-4" @submit.prevent="submitRule">
        <FormField label="Enviar quanto tempo antes?"><Select :model-value="String(draft.offset_minutes)" @update:model-value="(v) => (draft.offset_minutes = Number(v))"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="[m, l] in OFFSETS" :key="m" :value="String(m)">{{ l }}</SelectItem></SelectContent></Select></FormField>
        <FormField v-slot="{ id }" label="Título" required><Input :id="id" v-model="draft.title_template" placeholder="Ex: Lembrete: sessão amanhã" /></FormField>
        <FormField v-slot="{ id }" label="Corpo (opcional)"><Textarea :id="id" v-model="draft.body_template" rows="2" placeholder="Ex: {datetime}" /></FormField>
        <p class="text-xs text-muted-foreground">Variáveis: {{ SESSION_PLACEHOLDERS.join(', ') }}</p>
        <div class="flex items-center justify-between rounded-lg border p-3"><Label for="rule-enabled" class="cursor-pointer font-normal">Ativar regra imediatamente</Label><Switch id="rule-enabled" v-model="draft.enabled" /></div>
        <div class="flex gap-2 pt-2"><Button type="button" variant="outline" class="flex-1" @click="adding = false">Cancelar</Button><Button type="submit" class="flex-1" :disabled="addRule.isPending.value"><Loader2 v-if="addRule.isPending.value" class="animate-spin" />Adicionar regra</Button></div>
      </form>
    </ResponsiveDialog>
  </div>
</template>
