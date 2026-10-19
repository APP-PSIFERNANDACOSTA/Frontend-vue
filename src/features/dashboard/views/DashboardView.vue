<script setup lang="ts">
import { MOOD_ENABLED } from '@/features/mood/feature'
import { Calendar, DollarSign, TrendingUp, Users } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import PushPromptBanner from '@/features/notifications/components/PushPromptBanner.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import AttendanceOverview from '@/features/attendance/components/AttendanceOverview.vue'
import MoodOverviewCard from '@/features/mood/components/MoodOverviewCard.vue'
import { useAttendance } from '@/features/attendance/queries'
import StatCard from '@/shared/components/StatCard.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatMoney, firstName } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import MonthSessionsCard from '../components/MonthSessionsCard.vue'
import PendingTasksCard from '../components/PendingTasksCard.vue'
import RevenueCard from '../components/RevenueCard.vue'
import NextSessionCard from '../components/NextSessionCard.vue'
import { averagePerSession } from '../metrics'
import { useDashboard } from '../queries'

const auth = useAuthStore()
const privacy = usePrivacyMode()
const { patients, weekSessions, monthSessions, revenue, today, upcoming } = useDashboard()
const attendance30 = useAttendance({ days: 30 })

const hide = (v: string) => (privacy.enabled.value ? '•••' : v)
const average = computed(() => averagePerSession(revenue.data.value?.current ?? 0, monthSessions.data.value?.stats.completed ?? 0))
const kpis = computed(() => [
  {
    label: 'Pacientes ativos', icon: Users, loading: patients.isPending.value, to: '/dashboard/patients',
    value: hide(String(patients.data.value?.active ?? 0)),
    hint: privacy.enabled.value ? '' : (patients.data.value?.newThisMonth ? `+${patients.data.value.newThisMonth} este mês` : 'Sem novos pacientes'),
  },
  {
    label: 'Consultas na semana', icon: Calendar, loading: weekSessions.isPending.value, to: '/dashboard/schedule',
    value: hide(String(weekSessions.data.value ?? 0)), hint: privacy.enabled.value ? '' : 'Esta semana',
  },
  {
    label: 'Frequência dos pacientes', icon: TrendingUp, loading: attendance30.isPending.value,
    value: hide(attendance30.data.value?.summary.rate == null ? '—' : `${attendance30.data.value.summary.rate}%`),
    hint: privacy.enabled.value ? '' : 'Últimos 30 dias',
  },
  {
    label: 'Faturamento mensal', icon: DollarSign, loading: revenue.isPending.value, to: '/dashboard/payments',
    value: privacy.enabled.value ? 'R$ •••' : formatMoney(revenue.data.value?.current ?? 0), hint: privacy.enabled.value ? '' : 'Este mês',
  },
])
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="`Bem-vinda, Psi ${firstName(auth.user?.name)}!`" description="Aqui está um resumo da sua agenda e atividades de hoje">
      <template #actions>
        <Button size="lg" as-child><RouterLink to="/dashboard/schedule"><Calendar /> Ver agenda completa</RouterLink></Button>
      </template>
    </PageHeader>

    <PushPromptBanner />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard v-for="k in kpis" :key="k.label" v-bind="k" />
    </div>

    <div class="grid items-start gap-6 lg:grid-cols-5">
      <div class="lg:col-span-3"><NextSessionCard :sessions="today.data.value ?? []" :upcoming="upcoming.data.value ?? null" :loading="today.isPending.value" /></div>
      <div class="lg:col-span-2"><PendingTasksCard /></div>
    </div>

    <MoodOverviewCard v-if="MOOD_ENABLED" />

    <AttendanceOverview />

    <div class="grid gap-6 md:grid-cols-2">
      <MonthSessionsCard :stats="monthSessions.data.value?.stats" :loading="monthSessions.isPending.value" />
      <RevenueCard
        :current="revenue.data.value?.current" :previous="revenue.data.value?.previous" :change="revenue.data.value?.change"
        :average="average" :loading="revenue.isPending.value"
      />
    </div>
  </div>
</template>
