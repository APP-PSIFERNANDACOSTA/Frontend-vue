<script setup lang="ts">
import { Clock, Eye, FileText, Shield, Tag, User } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import MoodBadge from '../components/MoodBadge.vue'
import { parseTags } from '../mood'
import { useDiaryEntry } from '../queries'

const route = useRoute()
const query = useDiaryEntry(() => Number(route.params.id))
const entry = computed(() => query.data.value)
const privacy = usePrivacyMode()
const tags = computed(() => parseTags(entry.value?.tags))
const stamp = (v?: string) => formatDate(v, 'dd/MM/yyyy HH:mm')
const edited = computed(() => entry.value && entry.value.updated_at !== entry.value.created_at)
</script>

<template>
  <div class="space-y-6">
    <QueryState :query="query" loading-label="Carregando entrada do diário...">
      <template v-if="entry">
        <PageHeader :title="`Análise clínica — ${entry.patient?.name ? privacy.name(entry.patient.name) : 'Paciente'}`" back="/dashboard/diary">
          <template #description><span class="first-letter:uppercase">{{ formatDate(entry.date, "EEEE, dd 'de' MMMM 'de' yyyy") }}</span></template>
          <template #actions><MoodBadge :mood="entry.mood" /></template>
        </PageHeader>

        <div class="grid gap-6 lg:grid-cols-3">
          <div class="min-w-0 space-y-6 lg:col-span-2">
            <Card class="border-l-4 border-l-brand">
              <CardContent class="space-y-3">
                <h2 class="flex items-center gap-2 text-lg font-semibold"><FileText class="size-5 text-brand-600" />{{ entry.title || 'Entrada do diário' }}</h2>
                <p class="whitespace-pre-wrap break-words leading-relaxed">{{ entry.content }}</p>
              </CardContent>
            </Card>

            <SectionCard v-if="tags.length" title="Análise automática de sentimentos" :icon="Tag">
              <div class="flex flex-wrap gap-2"><Badge v-for="t in tags" :key="t" variant="outline">{{ t }}</Badge></div>
              <p class="mt-3 text-xs italic text-muted-foreground">Tags geradas automaticamente pela IA com base no conteúdo emocional</p>
            </SectionCard>
          </div>

          <div class="min-w-0 space-y-6">
            <SectionCard title="Dados do paciente" :icon="User">
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-2"><dt class="text-muted-foreground">Nome</dt><dd class="text-right font-medium">{{ entry.patient?.name ? privacy.name(entry.patient.name) : 'N/A' }}</dd></div>
                <div class="flex justify-between gap-2"><dt class="text-muted-foreground">ID</dt><dd class="font-medium">#{{ entry.patient_id }}</dd></div>
              </dl>
              <RouterLink :to="`/dashboard/patients/${entry.patient_id}?tab=diary`" class="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline dark:text-brand">Ver paciente</RouterLink>
            </SectionCard>

            <SectionCard title="Análise de humor" :icon="Eye">
              <dl class="space-y-2 text-sm">
                <div class="flex items-center justify-between gap-2"><dt class="text-muted-foreground">Estado</dt><dd><MoodBadge :mood="entry.mood" /></dd></div>
                <div class="flex justify-between gap-2"><dt class="text-muted-foreground">Data</dt><dd class="text-right font-medium">{{ formatDate(entry.date) }}</dd></div>
              </dl>
            </SectionCard>

            <SectionCard title="Metadados" :icon="Clock">
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-2"><dt class="text-muted-foreground">Entrada</dt><dd class="font-medium">#{{ entry.id }}</dd></div>
                <div class="flex justify-between gap-2"><dt class="text-muted-foreground">Criada</dt><dd class="text-right">{{ stamp(entry.created_at) }}</dd></div>
                <div v-if="edited" class="flex justify-between gap-2"><dt class="text-muted-foreground">Editada</dt><dd class="text-right">{{ stamp(entry.updated_at) }}</dd></div>
                <div class="flex items-center justify-between gap-2"><dt class="text-muted-foreground">Privacidade</dt><dd><Badge variant="outline"><Shield class="size-3" />{{ entry.is_private ? 'Privado' : 'Público' }}</Badge></dd></div>
              </dl>
            </SectionCard>
          </div>
        </div>
      </template>
    </QueryState>
  </div>
</template>
