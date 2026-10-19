<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageHeader from '@/shared/components/PageHeader.vue'
import PaymentForm from '../components/PaymentForm.vue'
import { useCreatePayment } from '../queries'

const router = useRouter()
const create = useCreatePayment(() => router.push('/dashboard/payments'))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Cadastrar pagamento" description="Registre um novo pagamento e gere o recibo automaticamente" back="/dashboard/payments" />
    <PaymentForm :saving="create.isPending.value" @submit="create.mutate($event)" @cancel="router.push('/dashboard/payments')" />
  </div>
</template>
