<script setup lang="ts">
/** Recebido por fora do Pix do sistema (dinheiro, transferência, cartão...): fecha a cobrança e lança o pagamento. */
import { CheckCircle2, Loader2 } from '@lucide/vue'
import { reactive, watch } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { getBrazilWallDateKey, getSaoPauloTodayNoonDate } from '@/shared/lib/datetime-br'
import { formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { useMarkPixChargePaid } from '../queries'
import type { ManualPaymentMethod, PixCharge } from '../types'

const props = defineProps<{ charge: PixCharge | null }>()
const open = defineModel<boolean>('open', { default: false })
const today = () => getBrazilWallDateKey(getSaoPauloTodayNoonDate())
const form = reactive({ payment_method: 'pix' as ManualPaymentMethod, payment_date: today() })
const mark = useMarkPixChargePaid()
watch(open, (o) => o && Object.assign(form, { payment_method: 'pix', payment_date: today() }))

function submit() {
  if (!props.charge) return
  mark.mutate({ id: props.charge.id, ...form }, { onSuccess: () => (open.value = false) })
}
</script>

<template>
  <ResponsiveDialog v-model:open="open" title="Marcar como pago" :description="charge ? `${formatMoney(charge.amount)} · ${charge.description}` : undefined" content-class="sm:max-w-sm">
    <form class="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0" @submit.prevent="submit">
      <FormField label="Forma de pagamento">
        <Select v-model="form.payment_method">
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">Pix</SelectItem>
            <SelectItem value="credit_card">Cartão de crédito</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField v-slot="{ id }" label="Data do pagamento"><Input :id="id" v-model="form.payment_date" type="date" :max="today()" required /></FormField>
      <p class="text-xs text-muted-foreground">O pagamento entra em Pagamentos com recibo e Recibo Saúde, como os demais.</p>
      <Button type="submit" class="w-full" :disabled="mark.isPending.value"><Loader2 v-if="mark.isPending.value" class="animate-spin" /><CheckCircle2 v-else /> Confirmar pagamento</Button>
    </form>
  </ResponsiveDialog>
</template>
