<script setup lang="ts">
import { MOOD_ENABLED } from '@/features/mood/feature'
import { Heart } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/features/auth/store'
import PushPromptBanner from '@/features/notifications/components/PushPromptBanner.vue'
import PullToRefresh from '@/shared/components/PullToRefresh.vue'
import { firstName } from '@/shared/lib/format'
import MyMoodCalendar from '@/features/mood/components/MyMoodCalendar.vue'
import ActivityStats from '../components/ActivityStats.vue'
import LatestPostTherapyCard from '../components/LatestPostTherapyCard.vue'
import NextSessionCard from '../components/NextSessionCard.vue'
import PsiMessageCard from '../components/PsiMessageCard.vue'
import QuickLinks from '../components/QuickLinks.vue'

const auth = useAuthStore()
const qc = useQueryClient()
const refresh = () => qc.invalidateQueries()
</script>

<template>
  <PullToRefresh :on-refresh="refresh">
    <div class="space-y-4">
      <section class="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 p-5">
        <div>
          <p class="text-2xl font-semibold">Olá, {{ firstName(auth.user?.name) }}!</p>
          <p class="text-sm text-muted-foreground">Bem-vindo(a) ao seu espaço terapêutico</p>
        </div>
        <span class="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-white/10">
          <Heart class="size-7 text-brand-600" />
        </span>
      </section>

      <PushPromptBanner />
      <NextSessionCard />
      <MyMoodCalendar v-if="MOOD_ENABLED" />
      <PsiMessageCard />
      <LatestPostTherapyCard />
      <ActivityStats />
      <QuickLinks />
    </div>
  </PullToRefresh>
</template>
