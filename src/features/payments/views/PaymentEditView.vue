<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { notify } from '@/shared/lib/toast'
import PaymentForm from '../components/PaymentForm.vue'
import { usePayment, useUpdatePayment } from '../queries'
import { isPaymentLockedByHealthReceipt } from '../types'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const query = usePayment(id)
const update = useUpdatePayment(id, () => router.push(`/dashboard/payments/${id.value}`))

// Recibo de Saúde emitido no Carnê-leão trava a edição
watchEffect(() => {
  if (query.data.value && isPaymentLockedByHealthReceipt(query.data.value)) {
    notify.error('Edição bloqueada', 'Este pagamento não pode ser editado porque o Recibo de Saúde já foi emitido no Carnê-leão.')
    router.replace(`/dashboard/payments/${id.value}`)
  }
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Editar pagamento" description="Atualize os dados do pagamento" :back="`/dashboard/payments/${id}`" />
    <LoadingState v-if="query.isPending.value" />
    <ErrorState v-else-if="query.isError.value" message="Pagamento não encontrado." @retry="query.refetch()" />
    <PaymentForm v-else :payment="query.data.value" :saving="update.isPending.value" @submit="update.mutate($event)" @cancel="router.push(`/dashboard/payments/${id}`)" />
  </div>
</template>
