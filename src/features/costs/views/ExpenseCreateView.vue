<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageHeader from '@/shared/components/PageHeader.vue'
import ExpenseForm from '../components/ExpenseForm.vue'
import { useCreateExpense } from '../queries'

const router = useRouter()
const create = useCreateExpense(() => router.push('/dashboard/costs'))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Novo custo" description="Registre um custo de saída" back="/dashboard/costs" />
    <ExpenseForm :saving="create.isPending.value" @submit="create.mutate($event)" @cancel="router.push('/dashboard/costs')" />
  </div>
</template>
