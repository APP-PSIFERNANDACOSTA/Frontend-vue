<script setup lang="ts">
import { Calendar, FileText, Pencil, Plus, User } from '@lucide/vue'
import { computed, ref } from 'vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import SafeHtml from '@/shared/components/SafeHtml.vue'
import SearchInput from '@/shared/components/SearchInput.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useRecords } from '../queries'
import type { Record as MedicalRecord } from '../types'

const SESSION_TYPES: Record<string, string> = { individual: 'Individual', casal: 'Casal', familia: 'Família', grupo: 'Grupo' }
const search = ref('')
const query = useRecords(search)
const records = computed(() => query.data.value ?? [])
const privacy = usePrivacyMode()
const selected = ref<MedicalRecord | null>(null)
const open = computed({ get: () => !!selected.value, set: (v) => !v && (selected.value = null) })
const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const SECTIONS = [['diagnosis', 'Diagnóstico', false], ['complaints', 'Queixa principal', true], ['observations', 'Observações clínicas', true], ['interventions', 'Intervenções realizadas', true], ['evolution', 'Evolução do quadro', true], ['therapeutic_plan', 'Plano terapêutico', true]] as const
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Prontuários" description="Registros clínicos e evolução dos pacientes">
      <template #actions><Button as-child><RouterLink to="/medical-records/new"><Plus /> Novo prontuário</RouterLink></Button></template>
    </PageHeader>
    <Card><CardContent><SearchInput v-model="search" placeholder="Buscar por paciente ou conteúdo..." /></CardContent></Card>

    <QueryState :query="query" :empty="records.length === 0">
      <template #empty><EmptyState :icon="FileText" title="Nenhum prontuário encontrado" :description="search ? 'Tente buscar com outros termos' : 'Comece criando seu primeiro prontuário'" /></template>
      <div class="space-y-4">
        <Card v-for="r in records" :key="r.id" class="transition-shadow hover:shadow-md">
          <CardContent class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex min-w-0 flex-1 items-start gap-4">
              <span class="hidden size-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 sm:flex"><FileText class="size-6 text-brand-600" /></span>
              <div class="min-w-0 space-y-2">
                <h3 class="truncate text-lg font-semibold">{{ r.patient?.name ? privacy.name(r.patient.name) : 'Paciente' }}</h3>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span class="inline-flex items-center gap-1"><Calendar class="size-4" />{{ formatDate(r.session_date) }}</span>
                  <span v-if="r.session_number">Sessão #{{ r.session_number }}</span><span v-if="r.duration">{{ r.duration }} min</span>
                  <Badge variant="secondary" class="text-xs">{{ SESSION_TYPES[r.session_type] || r.session_type }}</Badge>
                </div>
                <p v-if="r.complaints" class="line-clamp-2 text-sm text-muted-foreground">{{ privacy.text(plain(r.complaints), 30) }}</p>
                <p v-if="r.session_report" class="flex items-center gap-1.5 text-xs text-muted-foreground"><FileText class="size-3.5" />Relatório vinculado: {{ r.session_report.title }}</p>
              </div>
            </div>
            <div class="flex shrink-0 gap-2"><Button variant="outline" size="sm" @click="selected = r">Ver completo</Button><Button as-child variant="outline" size="icon" class="size-8" aria-label="Editar"><RouterLink :to="`/medical-records/${r.id}/edit`"><Pencil class="size-4" /></RouterLink></Button></div>
          </CardContent>
        </Card>
      </div>
    </QueryState>

    <ResponsiveDialog v-model:open="open" title="Prontuário completo" content-class="sm:max-w-3xl">
      <div v-if="selected" class="max-h-[70dvh] space-y-5 overflow-y-auto pr-1">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/50 p-4">
          <div class="flex items-center gap-3"><span class="flex size-11 items-center justify-center rounded-full bg-brand-50"><User class="size-5 text-brand-600" /></span><div><h3 class="font-semibold">{{ selected.patient?.name ? privacy.name(selected.patient.name) : 'Paciente' }}</h3><p class="text-sm text-muted-foreground"><template v-if="selected.session_number">Sessão #{{ selected.session_number }} • </template>{{ formatDate(selected.session_date) }}<template v-if="selected.duration"> • {{ selected.duration }} min</template></p></div></div>
          <Badge variant="secondary">{{ SESSION_TYPES[selected.session_type] || selected.session_type }}</Badge>
        </div>
        <template v-for="[key, label, rich] in SECTIONS" :key="key">
          <section v-if="selected[key]" class="space-y-1">
            <h4 class="text-sm font-medium text-muted-foreground">{{ label }}</h4>
            <p v-if="!rich" class="text-sm">{{ privacy.text(selected[key], 40) }}</p>
            <p v-else-if="privacy.enabled.value" class="text-sm text-muted-foreground">Oculto no modo privacidade.</p>
            <SafeHtml v-else :html="selected[key]!" />
          </section>
        </template>
        <section v-if="selected.session_report" class="space-y-1"><h4 class="text-sm font-medium text-muted-foreground">Relatório de sessão vinculado</h4><p class="text-sm font-medium">{{ privacy.text(selected.session_report.title, 20) }}</p><p v-if="privacy.enabled.value" class="text-sm text-muted-foreground">Oculto no modo privacidade.</p><SafeHtml v-else :html="selected.session_report.content" /></section>
        <div class="flex flex-wrap items-end justify-between gap-2 border-t pt-4 text-xs text-muted-foreground"><div><p>Criado em: {{ formatDate(selected.created_at, "dd/MM/yyyy 'às' HH:mm") }}</p><p v-if="selected.updated_at !== selected.created_at">Última edição: {{ formatDate(selected.updated_at, "dd/MM/yyyy 'às' HH:mm") }}</p></div><Button as-child variant="outline"><RouterLink :to="`/medical-records/${selected.id}/edit`"><Pencil /> Editar</RouterLink></Button></div>
      </div>
    </ResponsiveDialog>
  </div>
</template>
