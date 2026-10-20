<script setup lang="ts">
/** Portal (início): aviso discreto quando há cobrança Pix em aberto. */
import { ChevronRight, QrCode } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatMoney } from '@/shared/lib/format'
import { useMyPixCharges } from '../queries'

const mine = useMyPixCharges()
const open = computed(() => (mine.data.value ?? []).filter((c) => c.status === 'pending' || c.can_renew))
const total = computed(() => open.value.reduce((a, c) => a + Number(c.amount), 0))
</script>

<template>
  <RouterLink v-if="open.length" to="/portal/financial" class="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 transition-colors hover:bg-brand-100">
    <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background"><QrCode class="size-5 text-brand-700" /></span>
    <span class="min-w-0 flex-1">
      <span class="block font-semibold">{{ open.length === 1 ? 'Você tem um pagamento em aberto' : `Você tem ${open.length} pagamentos em aberto` }}</span>
      <span class="block text-sm text-muted-foreground">{{ formatMoney(total) }} · pague por Pix em segundos</span>
    </span>
    <ChevronRight class="size-5 text-brand-700" />
  </RouterLink>
</template>
