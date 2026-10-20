<script setup lang="ts">
/** Ajuste à mão de uma cobrança em aberto. Depois disso a agenda não altera mais esta cobrança. */
import { Loader2, Save } from '@lucide/vue'
import { reactive, watch } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import MoneyInput from '@/shared/components/MoneyInput.vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useUpdatePixCharge } from '../queries'
import type { PixCharge } from '../types'

const props = defineProps<{ charge: PixCharge | null }>()
const open = defineModel<boolean>('open', { default: false })
const form = reactive({ amount: undefined as number | undefined, due_date: '', description: '' })
const update = useUpdatePixCharge()
watch(open, (o) => o && props.charge && Object.assign(form, { amount: Number(props.charge.amount), due_date: props.charge.due_date ?? '', description: props.charge.description }))

function submit() {
  if (!props.charge) return
  if (!form.amount || form.amount <= 0) return notify.error('Valor inválido', 'Informe um valor maior que zero')
  update.mutate({ id: props.charge.id, amount: form.amount, due_date: form.due_date || null, description: form.description.trim() }, { onSuccess: () => (open.value = false) })
}
</script>

<template>
  <ResponsiveDialog v-model:open="open" title="Editar cobrança" content-class="sm:max-w-sm">
    <form class="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0" @submit.prevent="submit">
      <FormField v-slot="{ id }" label="Valor" required><MoneyInput :id="id" v-model="form.amount" required /></FormField>
      <FormField v-slot="{ id }" label="Vencimento"><Input :id="id" v-model="form.due_date" type="date" /></FormField>
      <FormField v-slot="{ id }" label="Descrição"><Input :id="id" v-model="form.description" maxlength="255" required /></FormField>
      <p v-if="charge?.kind !== 'manual'" class="rounded-lg bg-warning/10 p-3 text-xs text-warning">Depois de editada, esta cobrança não acompanha mais as mudanças da agenda.</p>
      <Button type="submit" class="w-full" :disabled="update.isPending.value"><Loader2 v-if="update.isPending.value" class="animate-spin" /><Save v-else /> Salvar</Button>
    </form>
  </ResponsiveDialog>
</template>
