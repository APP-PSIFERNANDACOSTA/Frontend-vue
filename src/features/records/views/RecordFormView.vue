<script setup lang="ts">
import { Check, ChevronsUpDown, Loader2, Save, X } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import RichTextEditor from '@/shared/components/RichTextEditor.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { formatDate } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { usePatientSessionReports, useRecord, useSaveRecord } from '../queries'

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const goList = () => router.push('/medical-records')

const patientId = ref<number | null>(route.query.patient_id ? Number(route.query.patient_id) : null)
const form = reactive({ session_date: '', session_number: '', duration: '', session_type: 'individual' as 'individual' | 'casal' | 'familia' | 'grupo', diagnosis: '', complaints: '', observations: '', interventions: '', evolution: '', therapeutic_plan: '' })
const reportIds = ref<number[]>([])

const recordQ = useRecord(() => id.value ?? 0)
const loaded = ref(false)
watch(() => recordQ.data.value, (r) => {
  if (!id.value || loaded.value || !r) return
  patientId.value = r.patient_id
  Object.assign(form, { session_date: r.session_date?.slice(0, 10) ?? '', session_number: r.session_number ? String(r.session_number) : '', duration: r.duration ? String(r.duration) : '', session_type: r.session_type, diagnosis: r.diagnosis ?? '', complaints: r.complaints ?? '', observations: r.observations ?? '', interventions: r.interventions ?? '', evolution: r.evolution ?? '', therapeutic_plan: r.therapeutic_plan ?? '' })
  reportIds.value = (r.session_reports ?? (r.session_report ? [r.session_report] : [])).map((x) => x.id)
  loaded.value = true
}, { immediate: true })
const ready = computed(() => !id.value || loaded.value)

const reportsQ = usePatientSessionReports(patientId)
const reports = computed(() => reportsQ.data.value ?? [])
const selectedReports = computed(() => reports.value.filter((r) => reportIds.value.includes(r.id)))
const toggleReport = (rid: number) => (reportIds.value = reportIds.value.includes(rid) ? reportIds.value.filter((x) => x !== rid) : [...reportIds.value, rid])
const reportsOpen = ref(false)
watch(patientId, (_, old) => old !== null && !loaded.value && (reportIds.value = []))

const save = useSaveRecord(id.value, goList)
function submit() {
  if (!patientId.value) return notify.error('Erro', 'Selecione um paciente.')
  if (!form.session_date) return notify.error('Erro', 'A data da sessão é obrigatória.')
  const orNull = (v: string) => v || null
  save.mutate({
    ...(id.value ? {} : { patient_id: patientId.value, session_id: null, session_report_id: null }),
    session_report_ids: reportIds.value.length ? reportIds.value : undefined,
    session_date: form.session_date,
    session_number: form.session_number ? Number(form.session_number) : null,
    duration: form.duration ? Number(form.duration) : null,
    session_type: form.session_type,
    diagnosis: orNull(form.diagnosis), complaints: orNull(form.complaints), observations: orNull(form.observations), interventions: orNull(form.interventions), evolution: orNull(form.evolution), therapeutic_plan: orNull(form.therapeutic_plan),
  })
}
const RICH = [['observations', 'Observações clínicas', 'Estado emocional, comportamento, aspectos relevantes da sessão...'], ['interventions', 'Intervenções realizadas', 'Técnicas aplicadas, abordagens utilizadas, exercícios propostos...'], ['evolution', 'Evolução do quadro', 'Progresso observado, mudanças comportamentais, resposta ao tratamento...'], ['therapeutic_plan', 'Plano terapêutico', 'Objetivos para próximas sessões, tarefas para casa, encaminhamentos...']] as const
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <PageHeader :title="id ? 'Editar prontuário' : 'Novo prontuário'" :description="id ? 'Atualizar o registro de prontuário' : 'Criar um novo registro de prontuário'" back="/medical-records" />
    <QueryState v-if="id" :query="recordQ" :empty="false"><span /></QueryState>

    <form v-if="ready" class="space-y-6" @submit.prevent="submit">
      <SectionCard title="Informações básicas">
        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <FormField label="Paciente" required><PatientSelect v-model="patientId" :disabled="!!id" /></FormField>
            <FormField v-slot="{ id: fid }" label="Data da sessão" required><Input :id="fid" v-model="form.session_date" type="date" /></FormField>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <FormField v-slot="{ id: fid }" label="Número da sessão"><Input :id="fid" v-model="form.session_number" type="number" min="1" inputmode="numeric" placeholder="Ex: 12" /></FormField>
            <FormField v-slot="{ id: fid }" label="Duração (minutos)"><Input :id="fid" v-model="form.duration" type="number" min="1" inputmode="numeric" placeholder="Ex: 50" /></FormField>
            <FormField label="Tipo de sessão"><Select v-model="form.session_type"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="casal">Casal</SelectItem><SelectItem value="familia">Família</SelectItem><SelectItem value="grupo">Grupo</SelectItem></SelectContent></Select></FormField>
          </div>
          <FormField label="Vincular relatórios de sessão (opcional)">
            <p v-if="!patientId" class="text-sm text-muted-foreground">Selecione um paciente primeiro para ver os relatórios disponíveis.</p>
            <template v-else>
              <Popover v-model:open="reportsOpen">
                <PopoverTrigger as-child><Button type="button" variant="outline" role="combobox" class="w-full justify-between font-normal" :disabled="reportsQ.isPending.value">{{ reportIds.length ? `${reportIds.length} relatório(s) selecionado(s)` : 'Selecionar relatórios...' }}<ChevronsUpDown class="opacity-50" /></Button></PopoverTrigger>
                <PopoverContent class="w-(--reka-popover-trigger-width) p-0" align="start">
                  <Command><CommandInput placeholder="Buscar relatórios..." /><CommandList><CommandEmpty>{{ reports.length ? 'Nenhum relatório com esse termo' : 'Nenhum relatório para este paciente' }}</CommandEmpty>
                    <CommandGroup><CommandItem v-for="r in reports" :key="r.id" :value="`${r.title} ${formatDate(r.created_at)}`" @select="toggleReport(r.id)"><Check :class="cn('size-4', reportIds.includes(r.id) ? 'opacity-100' : 'opacity-0')" /><span class="min-w-0"><span class="block truncate font-medium">{{ r.title }}</span><span class="block text-xs text-muted-foreground">{{ formatDate(r.created_at, "dd 'de' MMMM 'de' yyyy") }}</span></span></CommandItem></CommandGroup>
                  </CommandList></Command>
                </PopoverContent>
              </Popover>
              <div v-if="selectedReports.length" class="mt-2 flex flex-wrap gap-2"><Badge v-for="r in selectedReports" :key="r.id" variant="secondary" class="gap-1">{{ r.title }}<button type="button" :aria-label="`Remover ${r.title}`" @click="toggleReport(r.id)"><X class="size-3" /></button></Badge></div>
            </template>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Informações clínicas">
        <div class="space-y-5">
          <FormField v-slot="{ id: fid }" label="Diagnóstico / CID-10"><Input :id="fid" v-model="form.diagnosis" placeholder="Ex: F41.1 - Transtorno de ansiedade generalizada" /></FormField>
          <FormField v-slot="{ id: fid }" label="Queixa principal"><Textarea :id="fid" v-model="form.complaints" rows="4" placeholder="Descreva a queixa principal apresentada pelo paciente..." /></FormField>
          <FormField v-for="[key, label, ph] in RICH" :key="key" :label="label"><RichTextEditor v-model="form[key]" :placeholder="ph" /></FormField>
        </div>
      </SectionCard>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" :disabled="save.isPending.value" @click="goList">Cancelar</Button><Button type="submit" :disabled="save.isPending.value"><Loader2 v-if="save.isPending.value" class="animate-spin" /><Save v-else />{{ id ? 'Salvar alterações' : 'Criar prontuário' }}</Button></div>
    </form>
  </div>
</template>
