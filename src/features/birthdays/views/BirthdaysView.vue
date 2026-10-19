<script setup lang="ts">
import { Cake, Calendar, Gift, Mail, Phone } from '@lucide/vue'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed, ref } from 'vue'
import { useUpcomingBirthdays } from '@/features/patients/queries'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const days = ref(60)
const query = useUpcomingBirthdays(days)
const privacy = usePrivacyMode()
const rows = computed(() => query.data.value ?? [])
const OPTIONS = [{ v: 30, l: '30 dias' }, { v: 60, l: '60 dias' }, { v: 90, l: '90 dias' }, { v: 180, l: '6 meses' }]
const longDate = (iso: string) => {
  const t = format(parseISO(iso), "EEEE, d 'de' MMMM", { locale: ptBR })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Aniversariantes" description="Só entram pacientes ativos com data de nascimento cadastrada.">
      <template #actions>
        <span class="text-sm text-muted-foreground">Próximos</span>
        <Select :model-value="String(days)" @update:model-value="(v) => (days = Number(v))">
          <SelectTrigger class="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem v-for="o in OPTIONS" :key="o.v" :value="String(o.v)">{{ o.l }}</SelectItem></SelectContent>
        </Select>
      </template>
    </PageHeader>

    <QueryState :query="query" :empty="rows.length === 0">
      <template #empty>
        <EmptyState :icon="Gift" title="Nenhum aniversário neste período" description="Cadastre a data de nascimento nos pacientes para aparecerem aqui." />
      </template>
        <div class="space-y-3">
          <Card v-for="row in rows" :key="`${row.patient_id}-${row.next_birthday}`" :class="cn('border-brand/30', row.days_until === 0 ? 'bg-brand/25' : row.days_until <= 7 ? 'bg-brand/15' : 'bg-brand/5')">
            <CardContent class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div class="min-w-0 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <RouterLink :to="`/dashboard/patients/${row.patient_id}`" class="truncate font-semibold hover:underline">{{ privacy.name(row.name) }}</RouterLink>
                  <Badge v-if="row.days_until === 0">Hoje</Badge>
                  <Badge v-else-if="row.days_until <= 7" variant="secondary">Em {{ row.days_until }} dia(s)</Badge>
                  <Badge v-else variant="outline">Em {{ row.days_until }} dias</Badge>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span class="inline-flex items-center gap-1.5"><Calendar class="size-3.5" />{{ longDate(row.next_birthday) }}</span>
                  <span class="inline-flex items-center gap-1.5"><Cake class="size-3.5" />Completa {{ row.age_turning }} anos</span>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span v-if="row.email" class="inline-flex max-w-full items-center gap-1.5 truncate"><Mail class="size-3 shrink-0" />{{ privacy.email(row.email) }}</span>
                  <span v-if="row.phone" class="inline-flex items-center gap-1.5"><Phone class="size-3 shrink-0" />{{ privacy.phone(row.phone) }}</span>
                </div>
              </div>
              <Button as-child variant="outline" size="sm" class="w-full shrink-0 sm:w-auto"><RouterLink :to="`/dashboard/patients/${row.patient_id}`">Ver paciente</RouterLink></Button>
            </CardContent>
          </Card>
        </div>
    </QueryState>
  </div>
</template>
