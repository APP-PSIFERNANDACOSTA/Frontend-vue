<script setup lang="ts">
/**
 * Aba "Pagamentos" do paciente: cobranças em aberto (geradas pela agenda ou avulsas), envio do link
 * (copiar/WhatsApp), marcar como pago, editar/cancelar e o histórico de pagamentos recebidos.
 */
import { AlertTriangle, CheckCircle2, CircleDollarSign, Link2, MessageCircle, MoreHorizontal, Pencil, Plus, QrCode, Receipt, Settings2, XCircle } from '@lucide/vue'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { usePayments } from '@/features/payments/queries'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/features/payments/types'
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
import { useBillingSettings, useCancelPixCharge, useMercadoPagoStatus, usePixCharges } from '../queries'
import { whatsappPixLink } from '../share'
import { PIX_KIND_LABEL, PIX_STATUS } from '../status'
import type { PixCharge } from '../types'
import EditChargeDialog from './EditChargeDialog.vue'
import MarkPaidDialog from './MarkPaidDialog.vue'
import PixChargeDialog from './PixChargeDialog.vue'

const props = defineProps<{ patient: Patient }>()
const privacy = usePrivacyMode()
const { copy } = useClipboardToast()
const confirm = useConfirm()
const mp = useMercadoPagoStatus()
const billing = useBillingSettings()

const params = computed(() => ({ patient_id: props.patient.id, per_page: 50 }))
const list = usePixCharges(params)
const charges = computed(() => list.data.value?.data ?? [])
const open = computed(() => charges.value.filter((c) => c.status === 'pending'))
const closed = computed(() => charges.value.filter((c) => c.status !== 'pending').slice(0, 8))
const openTotal = computed(() => open.value.reduce((a, c) => a + Number(c.amount), 0))
const overdue = computed(() => open.value.filter((c) => c.overdue))

const payments = usePayments(() => ({ patient_id: props.patient.id }))
const history = computed(() => [...(payments.data.value ?? [])].sort((a, b) => +new Date(b.payment_date) - +new Date(a.payment_date)).slice(0, 12))

const plan = computed(() => {
  const p = props.patient
  const price = p.price_session ? `${privacy.money(p.price_session)} por sessão` : 'sem valor da sessão'
  if (p.payment_type === 'mensal') return { label: 'Mensal', detail: `${price} · vence todo dia ${p.payment_day ?? '— (defina o dia)'}` }
  if (p.payment_type === 'quinzenal') {
    const first = p.first_session_at ? formatDate(p.first_session_at, 'dd/MM/yyyy') : 'primeira sessão da agenda'
    return { label: 'Quinzenal', detail: `${price} · a cada 14 dias desde ${first}, vence no dia da sessão` }
  }
  return { label: 'Por sessão', detail: `${price} · cada sessão vence no dia do atendimento` }
})
const missing = computed(() => !Number(props.patient.price_session) || (props.patient.payment_type === 'mensal' && !props.patient.payment_day))

// diálogos
const pixOpen = ref(false)
const viewing = ref<PixCharge | null>(null)
const payOpen = ref(false)
const editOpen = ref(false)
const target = ref<PixCharge | null>(null)
const openNew = () => ((viewing.value = null), (pixOpen.value = true))
const openPix = (c: PixCharge) => ((viewing.value = c), (pixOpen.value = true))
const openPaid = (c: PixCharge) => ((target.value = c), (payOpen.value = true))
const openEdit = (c: PixCharge) => ((target.value = c), (editOpen.value = true))

const cancel = useCancelPixCharge()
async function cancelCharge(c: PixCharge) {
  if (await confirm({ title: 'Cancelar cobrança?', description: 'O paciente não verá mais esta cobrança e o link deixa de funcionar. A agenda não vai gerá-la de novo.', confirmText: 'Cancelar cobrança', destructive: true })) cancel.mutate(c.id)
}
const wa = (c: PixCharge) => whatsappPixLink(props.patient.phone, props.patient.name, c.amount, pixPaymentLink(c.token))
const dueLabel = (c: PixCharge) => (c.due_date ? `${c.overdue ? 'Venceu' : 'Vence'} em ${formatDate(c.due_date, 'dd/MM')}` : 'Sem vencimento')
const OTHER_METHODS: Record<string, string> = { cash: 'Dinheiro', transfer: 'Transferência', debit_card: 'Cartão de débito', other: 'Outro' }
const methodLabel = (m: string) => PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? OTHER_METHODS[m] ?? m
</script>

<template>
  <div class="space-y-4">
    <!-- forma de pagamento + cobrança automática -->
    <SectionCard title="Forma de pagamento" :icon="CircleDollarSign" :description="`${plan.label} · ${plan.detail}`">
      <template #actions>
        <Button variant="outline" size="sm" as-child><RouterLink :to="`/dashboard/patients/${patient.id}/edit`"><Pencil /> Alterar</RouterLink></Button>
      </template>
      <div class="space-y-2">
        <p v-if="billing.data.value && !billing.data.value.enabled" class="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          <Settings2 class="size-4" /> As cobranças automáticas estão desligadas.
          <RouterLink to="/settings/integrations" class="font-medium text-brand-700 underline">Ativar em Integrações</RouterLink>
        </p>
        <p v-else-if="billing.data.value?.enabled" class="text-xs text-muted-foreground">As cobranças são geradas sozinhas a partir da agenda (desde {{ formatDate(billing.data.value.starts_on) }}).</p>
        <p v-if="missing" class="flex items-start gap-1.5 rounded-lg bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle class="mt-0.5 size-4 shrink-0" /> {{ !Number(patient.price_session) ? 'Defina o valor da sessão' : 'Defina o dia de pagamento' }} para as cobranças serem geradas.
        </p>
      </div>
    </SectionCard>

    <!-- em aberto -->
    <SectionCard title="Em aberto" :icon="QrCode" :description="open.length ? `${privacy.money(openTotal)} a receber${overdue.length ? ` · ${overdue.length} vencida${overdue.length > 1 ? 's' : ''}` : ''}` : 'Nada pendente'">
      <template #actions>
        <Button size="sm" variant="outline" :disabled="!mp.data.value?.configured" :title="mp.data.value?.configured ? '' : 'Configure o Mercado Pago em Integrações'" @click="openNew"><Plus /> Cobrança avulsa</Button>
      </template>

      <QueryState :query="list" :empty="!open.length">
        <template #empty><EmptyState :icon="CheckCircle2" title="Tudo em dia" description="As próximas cobranças aparecem aqui assim que forem geradas pela agenda." /></template>
        <ul class="divide-y">
          <li v-for="c in open" :key="c.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <button type="button" class="min-w-0 flex-1 text-left" @click="openPix(c)">
              <p class="font-semibold tabular-nums">{{ privacy.money(c.amount) }} <span class="font-normal text-muted-foreground">· {{ c.description }}</span></p>
              <p class="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span :class="c.overdue && 'font-medium text-destructive'">{{ dueLabel(c) }}</span>
                <span>· {{ PIX_KIND_LABEL[c.kind] }}</span>
                <span v-if="c.locked">· ajustada à mão</span>
              </p>
            </button>
            <span v-if="c.overdue" class="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Vencida</span>
            <div class="flex items-center gap-1">
              <Button variant="outline" size="sm" @click="copy(pixPaymentLink(c.token), 'Link de pagamento copiado!', 'O paciente paga sem precisar de login')"><Link2 /> Copiar link</Button>
              <DropdownMenu>
                <DropdownMenuTrigger as-child><Button variant="ghost" size="icon" aria-label="Mais ações"><MoreHorizontal /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @select="openPix(c)"><QrCode /> Ver Pix</DropdownMenuItem>
                  <DropdownMenuItem v-if="wa(c)" as-child><a :href="wa(c)" target="_blank" rel="noopener"><MessageCircle /> Enviar no WhatsApp</a></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @select="openPaid(c)"><CheckCircle2 /> Marcar como pago</DropdownMenuItem>
                  <DropdownMenuItem @select="openEdit(c)"><Pencil /> Editar</DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive" @select="cancelCharge(c)"><XCircle /> Cancelar cobrança</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        </ul>
      </QueryState>

      <details v-if="closed.length" class="mt-3 border-t pt-3">
        <summary class="cursor-pointer text-sm font-medium text-muted-foreground">Cobranças encerradas ({{ closed.length }})</summary>
        <ul class="mt-2 divide-y">
          <li v-for="c in closed" :key="c.id" class="flex items-center gap-3 py-2 text-sm">
            <span class="min-w-0 flex-1 truncate">{{ privacy.money(c.amount) }} · {{ c.description }}</span>
            <span class="text-xs text-muted-foreground">{{ c.paid_at ? `pago ${formatDate(c.paid_at, 'dd/MM')}` : formatDate(c.created_at, 'dd/MM') }}</span>
            <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', PIX_STATUS[c.status].class]">{{ PIX_STATUS[c.status].label }}</span>
          </li>
        </ul>
      </details>
    </SectionCard>

    <!-- recebidos -->
    <SectionCard title="Pagamentos recebidos" :icon="Receipt">
      <template #actions><Button variant="ghost" size="sm" as-child><RouterLink :to="{ path: '/dashboard/payments', query: { q: patient.name } }">Ver todos</RouterLink></Button></template>
      <QueryState :query="payments" :empty="!history.length">
        <template #empty><EmptyState :icon="Receipt" title="Nenhum pagamento ainda" description="Os pagamentos deste paciente aparecem aqui, com recibo." /></template>
        <ul class="divide-y">
          <li v-for="p in history" :key="p.id" class="flex items-center gap-3 py-2.5 text-sm">
            <span class="w-14 shrink-0 tabular-nums text-muted-foreground">{{ formatDate(p.payment_date, 'dd/MM/yy') }}</span>
            <span class="min-w-0 flex-1 truncate">{{ p.description || 'Pagamento' }}</span>
            <span class="hidden text-xs text-muted-foreground sm:inline">{{ methodLabel(p.payment_method) }}</span>
            <span class="font-semibold tabular-nums">{{ privacy.money(p.amount) }}</span>
          </li>
        </ul>
      </QueryState>
    </SectionCard>

    <PixChargeDialog
      v-model:open="pixOpen" lock-patient :patient-id="patient.id" :existing="viewing"
      :amount="patient.price_session ? Number(patient.price_session) : undefined"
      :title="viewing ? 'Cobrança Pix' : `Cobrança avulsa · ${privacy.name(patient.name)}`"
    />
    <MarkPaidDialog v-model:open="payOpen" :charge="target" />
    <EditChargeDialog v-model:open="editOpen" :charge="target" />
  </div>
</template>
