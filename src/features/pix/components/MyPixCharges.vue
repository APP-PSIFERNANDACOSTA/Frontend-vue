<script setup lang="ts">
/** Portal: cobranças Pix em aberto do paciente, para pagar sem sair do app. */
import { QrCode } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { formatDate, formatMoney } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { pixKeys, useMyPixCharges, usePublicPixCharge, useRenewPixCharge } from '../queries'
import PixPaymentPanel from './PixPaymentPanel.vue'

const qc = useQueryClient()
const mine = useMyPixCharges()
const open = computed(() => (mine.data.value ?? []).filter((c) => c.status === 'pending' || c.can_renew))

const token = ref<string | null>(null)
const dialog = computed({ get: () => !!token.value, set: (v) => !v && (token.value = null) })
const charge = usePublicPixCharge(token)
const renew = useRenewPixCharge()

watch(() => charge.data.value?.status, (s, prev) => {
  if (s === 'paid' && prev && prev !== 'paid') {
    notify.success('Pagamento confirmado!', 'Obrigada! O recibo já está no seu histórico.')
    qc.invalidateQueries({ queryKey: pixKeys.mine })
    qc.invalidateQueries({ queryKey: ['payments'] })
  }
})
</script>

<template>
  <section v-if="open.length" class="space-y-2">
    <h2 class="font-semibold">A pagar</h2>
    <article v-for="c in open" :key="c.token" class="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background"><QrCode class="size-5 text-brand-700" /></span>
      <div class="min-w-0 flex-1">
        <p class="text-lg font-bold tabular-nums">{{ formatMoney(c.amount) }}</p>
        <p class="truncate text-sm text-muted-foreground">{{ c.description }}</p>
        <p v-if="c.can_renew" class="text-xs font-medium text-warning">Código expirado · toque para gerar um novo</p>
        <p v-else-if="c.created_at" class="text-xs text-muted-foreground">Enviada em {{ formatDate(c.created_at) }}</p>
      </div>
      <Button class="h-11 shrink-0" @click="token = c.token">Pagar com Pix</Button>
    </article>
  </section>

  <ResponsiveDialog v-model:open="dialog" title="Pagar com Pix">
    <div class="px-4 pb-6 sm:px-0 sm:pb-0">
      <PixPaymentPanel
        v-if="charge.data.value" :charge="charge.data.value" :refreshing="charge.isFetching.value" :renewing="renew.isPending.value"
        @refresh="charge.refetch()" @renew="token && renew.mutate(token)"
      />
      <p v-else class="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
    </div>
  </ResponsiveDialog>
</template>
