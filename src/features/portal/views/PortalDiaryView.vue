<script setup lang="ts">
import { CalendarDays, Heart, Loader2, Plus, Sparkles, X } from '@lucide/vue'
import { CalendarDate, type DateValue } from '@internationalized/date'
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import DiaryEntryCard from '@/features/diary/components/DiaryEntryCard.vue'
import { useCreateDiaryEntry, useMyDiary } from '@/features/diary/queries'
import { consecutiveDays } from '@/features/diary/streak'
import EmptyState from '@/shared/components/EmptyState.vue'
import PullToRefresh from '@/shared/components/PullToRefresh.vue'
import QueryState from '@/shared/components/QueryState.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Textarea } from '@/shared/ui/textarea'

const qc = useQueryClient()
const query = useMyDiary()
const entries = computed(() => query.data.value?.entries.data ?? [])
const streak = computed(() => consecutiveDays(entries.value.map((e) => e.date)))

// filtro por data (calendário em bottom-sheet) ou "últimas 5"
const LATEST = 5
const day = ref<DateValue | undefined>()
const showAll = ref(false)
const dayKey = computed(() => (day.value ? `${day.value.year}-${String(day.value.month).padStart(2, '0')}-${String(day.value.day).padStart(2, '0')}` : null))
const visible = computed(() => {
  if (dayKey.value) return entries.value.filter((e) => e.date.startsWith(dayKey.value!))
  return showAll.value ? entries.value : entries.value.slice(0, LATEST)
})
const calendarOpen = ref(false)
const pick = (v: DateValue | undefined) => ((day.value = v), (calendarOpen.value = false))
const today = new Date()
const todayValue = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())

const newOpen = ref(false)
const content = ref('')
const create = useCreateDiaryEntry(() => ((newOpen.value = false), (content.value = '')))
const submit = () => content.value.trim() && create.mutate(content.value.trim())
</script>

<template>
  <PullToRefresh :on-refresh="() => qc.invalidateQueries({ queryKey: ['diary'] })">
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">Acompanhe suas emoções e reflexões diárias</p>
        <Button class="h-11 shrink-0" @click="newOpen = true"><Plus /> Nova entrada</Button>
      </div>

      <div class="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50"><Sparkles class="size-5 text-brand-600" /></span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">Sequência atual</p>
          <p class="text-sm text-muted-foreground">{{ streak }} {{ streak === 1 ? 'dia consecutivo' : 'dias consecutivos' }}</p>
        </div>
        <Button variant="outline" size="sm" class="h-10" @click="calendarOpen = true"><CalendarDays /> Data</Button>
      </div>

      <div v-if="day" class="flex items-center justify-between gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm">
        <span><strong>Diário de {{ formatDate(new Date(day.year, day.month - 1, day.day)) }}</strong> · {{ visible.length }} entrada(s)</span>
        <Button variant="ghost" size="sm" class="h-8" @click="day = undefined"><X /> Limpar</Button>
      </div>

      <QueryState :query="query" :empty="visible.length === 0">
        <template #empty>
          <EmptyState :icon="Heart" :title="day ? 'Nenhuma entrada nesta data' : 'Nenhuma entrada ainda'" :description="day ? 'Não há entradas de diário para esta data' : 'Comece escrevendo sobre como você se sente hoje'">
            <Button @click="newOpen = true"><Plus /> {{ day ? 'Nova entrada' : 'Primeira entrada' }}</Button>
          </EmptyState>
        </template>
        <DiaryEntryCard v-for="e in visible" :key="e.id" :entry="e" />
        <Button v-if="!day && entries.length > LATEST" variant="ghost" class="h-11 w-full" @click="showAll = !showAll">
          {{ showAll ? 'Mostrar menos' : `Ver todas (${entries.length})` }}
        </Button>
      </QueryState>
    </div>
  </PullToRefresh>

  <ResponsiveDialog v-model:open="newOpen" title="Nova entrada no diário" description="Registre suas emoções e pensamentos do dia">
    <form class="space-y-3" @submit.prevent="submit">
      <p class="rounded-lg bg-muted p-3 text-xs text-muted-foreground">A data será hoje. O título e o humor são definidos automaticamente a partir do seu texto — seja honesto(a) consigo, este é um espaço seguro.</p>
      <Textarea v-model="content" rows="8" placeholder="Escreva sobre seus sentimentos, pensamentos e experiências do dia..." class="min-h-[200px] text-base" />
      <div class="flex gap-2 pb-2">
        <Button type="button" variant="outline" class="h-11 flex-1" :disabled="create.isPending.value" @click="newOpen = false">Cancelar</Button>
        <Button type="submit" class="h-11 flex-1" :disabled="!content.trim() || create.isPending.value">
          <Loader2 v-if="create.isPending.value" class="animate-spin" /><Heart v-else /> {{ create.isPending.value ? 'Salvando...' : 'Salvar entrada' }}
        </Button>
      </div>
    </form>
  </ResponsiveDialog>

  <ResponsiveDialog v-model:open="calendarOpen" title="Escolher data">
    <div class="flex justify-center pb-4">
      <Calendar :model-value="day" locale="pt-BR" :max-value="todayValue" @update:model-value="pick" />
    </div>
  </ResponsiveDialog>
</template>
