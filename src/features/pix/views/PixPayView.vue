<script setup lang="ts">
/** Link público de pagamento Pix (sem login): o paciente abre pelo WhatsApp e paga. Mobile-first. */
import { Lock, SearchX } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LoadingState from '@/shared/components/LoadingState.vue'
import { formatDate, formatMoney } from '@/shared/lib/format'
import PixPaymentPanel from '../components/PixPaymentPanel.vue'
import { usePublicPixCharge, useRenewPixCharge } from '../queries'

const route = useRoute()
const token = computed(() => String(route.params.token ?? ''))
const charge = usePublicPixCharge(token)
const renew = useRenewPixCharge()
const data = computed(() => charge.data.value)
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center px-4 py-8 sm:justify-center">
    <div class="w-full max-w-md">
      <header class="mb-6 text-center">
        <img src="/logo-login.png" alt="Fernanda Costa Psicóloga" class="mx-auto h-auto w-44 max-w-full dark:brightness-0 dark:invert" />
      </header>

      <LoadingState v-if="charge.isPending.value" />

      <div v-else-if="!data" class="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <SearchX class="mx-auto mb-3 size-10 text-muted-foreground" />
        <h1 class="text-lg font-semibold">Cobrança não encontrada</h1>
        <p class="mt-1 text-sm text-muted-foreground">O link pode estar incompleto. Peça um novo link à sua psicóloga.</p>
      </div>

      <main v-else class="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div class="mb-5 text-center">
          <p class="text-sm text-muted-foreground">{{ data.patient_first_name ? `Olá, ${data.patient_first_name}!` : 'Olá!' }} Pagamento para</p>
          <p class="font-semibold">{{ data.psychologist.name }}<span v-if="data.psychologist.crp" class="font-normal text-muted-foreground"> · CRP {{ data.psychologist.crp }}</span></p>
          <p class="mt-3 text-4xl font-bold tabular-nums text-brand-800 dark:text-brand">{{ formatMoney(data.amount) }}</p>
          <p class="text-sm text-muted-foreground">{{ data.description }}</p>
          <p v-if="data.status === 'pending' && data.due_date" :class="['mt-1 text-xs', data.overdue ? 'font-medium text-destructive' : 'text-muted-foreground']">{{ data.overdue ? 'Venceu em' : 'Vence em' }} {{ formatDate(data.due_date) }}</p>
        </div>
        <PixPaymentPanel
          :charge="data" hide-header hide-footer :refreshing="charge.isFetching.value" :renewing="renew.isPending.value"
          @refresh="charge.refetch()" @renew="renew.mutate(token)"
        />
      </main>

      <p class="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Lock class="size-3.5" /> Pagamento processado com segurança</p>
    </div>
  </div>
</template>
