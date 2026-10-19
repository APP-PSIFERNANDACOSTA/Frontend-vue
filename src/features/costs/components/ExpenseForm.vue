<script setup lang="ts">
import { Loader2, Save } from '@lucide/vue'
import { reactive, watch } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import MoneyInput from '@/shared/components/MoneyInput.vue'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/types'
import type { CreateExpenseData, Expense } from '../types'

const props = defineProps<{ expense?: Expense | null; saving?: boolean }>()
const emit = defineEmits<{ submit: [data: CreateExpenseData]; cancel: [] }>()

const form = reactive({ title: '', description: '', amount: undefined as number | undefined, payment_date: new Date().toISOString().split('T')[0], payment_method: 'pix' })
watch(
  () => props.expense,
  (e) => e && Object.assign(form, { title: e.title, description: e.description, amount: Number(e.amount), payment_date: e.payment_date?.slice(0, 10) ?? '', payment_method: e.payment_method || 'pix' }),
  { immediate: true },
)
const submit = () => emit('submit', { title: form.title, description: form.description, amount: Number(form.amount), payment_method: form.payment_method || 'pix', payment_date: form.payment_date || null })
</script>

<template>
  <form @submit.prevent="submit">
    <Card>
      <CardContent class="space-y-5">
        <FormField v-slot="{ id }" label="Título do custo" required><Input :id="id" v-model="form.title" required placeholder="Ex.: Aluguel da sala" /></FormField>
        <FormField v-slot="{ id }" label="Descrição do custo" required><Input :id="id" v-model="form.description" required placeholder="Detalhes do lançamento" /></FormField>
        <div class="grid gap-4 md:grid-cols-3">
          <FormField v-slot="{ id }" label="Valor (R$)" required><MoneyInput :id="id" v-model="form.amount" required /></FormField>
          <FormField v-slot="{ id }" label="Data da saída" required><Input :id="id" v-model="form.payment_date" type="date" required /></FormField>
          <FormField label="Forma de pagamento">
            <Select v-model="form.payment_method">
              <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem v-for="(label, value) in PAYMENT_METHOD_LABELS" :key="value" :value="value">{{ label }}</SelectItem></SelectContent>
            </Select>
          </FormField>
        </div>
        <div class="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row">
          <Button type="button" variant="outline" :disabled="saving" @click="emit('cancel')">Cancelar</Button>
          <Button type="submit" :disabled="saving"><Loader2 v-if="saving" class="animate-spin" /><Save v-else /> {{ saving ? 'Salvando...' : expense ? 'Salvar alterações' : 'Cadastrar custo' }}</Button>
        </div>
      </CardContent>
    </Card>
  </form>
</template>
