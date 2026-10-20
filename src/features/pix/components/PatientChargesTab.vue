<script setup lang="ts">
/** Aba "Cobranças" do paciente: Pix gerados, link para enviar (copiar/WhatsApp) e nova cobrança. */
import { Link2, MessageCircle, MoreHorizontal, Plus, QrCode, XCircle } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Patient } from '@/features/patients/types'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { useConfirm } from '@/shared/composables/useConfirm'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { pixPaymentLink } from '../api'
import { useCancelPixCharge, useMercadoPagoStatus, usePixCharges } from '../queries'
import { whatsappPixLink } from '../share'
import { PIX_STATUS } from '../status'
import type { PixCharge } from '../types'
import PixChargeDialog from './PixChargeDialog.vue'

const props = defineProps<{ patient: Patient }>()
const privacy = usePrivacyMode()
const { copy } = useClipboardToast()
const confirm = useConfirm()
const mp = useMercadoPagoStatus()
const params = computed(() => ({ patient_id: props.patient.id }))
const list = usePixCharges(params)
const charges = computed(() => list.data.value?.data ?? [])
const pendingTotal = computed(() => charges.value.filter((c) => c.status === 'pending' && !c.can_renew).reduce((a, c) => a + Number(c.amount), 0))
const cancel = useCancelPixCharge()

const dialogOpen = ref(false)
const viewing = ref<PixCharge | null>(null)
const openNew = () => ((viewing.value = null), (dialogOpen.value = true))
const openCharge = (c: PixCharge) => ((viewing.value = c), (dialogOpen.value = true))

const isOpen = (c: PixCharge) => c.status === 'pending' || c.can_renew
const wa = (c: PixCharge) => whatsappPixLink(props.patient.phone, props.patient.name, c.amount, pixPaymentLink(c.token))
async function cancelCharge(c: PixCharge) {
  if (await confirm({ title: 'Cancelar cobrança?', description: 'O link deixa de funcionar e o paciente não consegue mais pagar este Pix.', confirmText: 'Cancelar cobrança', destructive: true })) cancel.mutate(c.id)
}
const statusOf = (c: PixCharge) => (c.can_renew ? PIX_STATUS.expired : PIX_STATUS[c.status])
</script>

<template>
  <SectionCard title="Cobranças Pix" :icon="QrCode" :description="pendingTotal ? `${privacy.money(pendingTotal)} aguardando pagamento` : 'Gere um Pix e envie o link para o paciente pagar'">
    <template #actions>
      <Button :disabled="!mp.data.value?.configured" @click="openNew"><Plus /> Nova cobrança</Button>
    </template>

    <p v-if="mp.data.value && !mp.data.value.configured" class="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
      O Mercado Pago ainda não está configurado. <RouterLink to="/settings/integrations" class="font-medium underline">Ver integrações</RouterLink>
    </p>

    <QueryState :query="list" :empty="!charges.length">
      <template #empty><EmptyState :icon="QrCode" title="Nenhuma cobrança ainda" description="As cobranças Pix deste paciente aparecem aqui. Quando ele pagar, o pagamento é lançado sozinho." /></template>
      <ul class="divide-y">
        <li v-for="c in charges" :key="c.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          <button type="button" class="min-w-0 flex-1 text-left" @click="openCharge(c)">
            <p class="font-semibold tabular-nums">{{ privacy.money(c.amount) }} <span class="font-normal text-muted-foreground">· {{ c.description }}</span></p>
            <p class="text-xs text-muted-foreground">
              Criada em {{ formatDate(c.created_at) }}
              <template v-if="c.status === 'paid' && c.paid_at"> · paga em {{ formatDate(c.paid_at, "dd/MM 'às' HH:mm") }}</template>
              <template v-else-if="c.status === 'pending' && !c.can_renew && c.expires_at"> · QR válido até {{ formatDate(c.expires_at, "dd/MM 'às' HH:mm") }}</template>
              <template v-else-if="c.can_renew"> · o paciente pode gerar um novo QR pelo link</template>
            </p>
          </button>
          <span :class="['rounded-full px-2.5 py-0.5 text-xs font-medium', statusOf(c).class]">{{ statusOf(c).label }}</span>
          <div class="flex items-center gap-1">
            <Button v-if="isOpen(c)" variant="outline" size="sm" @click="copy(pixPaymentLink(c.token), 'Link de pagamento copiado!', 'Envie para o paciente pagar sem login')"><Link2 /> Copiar link</Button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child><Button variant="ghost" size="icon" aria-label="Mais ações"><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @select="openCharge(c)"><QrCode /> Ver cobrança</DropdownMenuItem>
                <DropdownMenuItem v-if="isOpen(c) && wa(c)" as-child><a :href="wa(c)" target="_blank" rel="noopener"><MessageCircle /> Enviar no WhatsApp</a></DropdownMenuItem>
                <template v-if="c.status === 'pending'">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive" @select="cancelCharge(c)"><XCircle /> Cancelar cobrança</DropdownMenuItem>
                </template>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      </ul>
    </QueryState>

    <PixChargeDialog
      v-model:open="dialogOpen" lock-patient :patient-id="patient.id" :existing="viewing"
      :amount="patient.price_session ? Number(patient.price_session) : undefined"
      :title="viewing ? 'Cobrança Pix' : `Nova cobrança · ${privacy.name(patient.name)}`"
    />
  </SectionCard>
</template>
