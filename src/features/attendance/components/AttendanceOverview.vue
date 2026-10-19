<script setup lang="ts">
import { TrendingDown } from '@lucide/vue'
import { computed, ref } from 'vue'
import { PERIODS } from '../rate'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { cn } from '@/shared/lib/utils'
import { useAttendance } from '../queries'
import { rateTone } from '../rate'
import AttendanceCard from './AttendanceCard.vue'

/** Visão geral (dashboard): taxa de todos os pacientes + quem está com menor frequência. */
const period = ref('90')
const periodLabel = computed(() => PERIODS.find((p) => p.value === period.value)?.label.toLowerCase() ?? '')
const privacy = usePrivacyMode()
const query = useAttendance(() => ({ days: PERIODS.find((p) => p.value === period.value)?.days ?? null })) // mesma chave do cartão: o cache é compartilhado
const lowest = computed(() => (query.data.value?.patients ?? []).filter((p) => p.total >= 2).slice(0, 5))
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <AttendanceCard v-model:period="period" title="Frequência geral dos pacientes" />

    <section class="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
      <h3 class="mb-4 flex items-center gap-2 font-semibold"><TrendingDown class="size-4 text-muted-foreground" /> Atenção à frequência</h3>
      <p v-if="!lowest.length" class="py-6 text-center text-sm text-muted-foreground">Sem pacientes com dados suficientes ainda (mínimo de 2 encontros).</p>
      <ul v-else class="divide-y">
        <li v-for="p in lowest" :key="p.patient_id">
          <RouterLink :to="`/dashboard/patients/${p.patient_id}`" class="flex items-center gap-3 py-2.5 hover:opacity-80">
            <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ privacy.name(p.name) }}</span><span class="text-xs text-muted-foreground">{{ p.completed }} realizada(s) · {{ p.no_show }} falta(s) · {{ p.patient_reschedules + p.patient_cancellations }} remarc./cancel.</span></span>
            <span :class="cn('rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums', rateTone(p.rate).bg, rateTone(p.rate).text)">{{ p.rate }}%</span>
          </RouterLink>
        </li>
      </ul>
      <p class="mt-3 text-xs text-muted-foreground">{{ periodLabel }}, do menor para o maior índice.</p>
    </section>
  </div>
</template>
