<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ErrorState from '@/shared/components/ErrorState.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import ExpenseForm from '../components/ExpenseForm.vue'
import { useExpense, useUpdateExpense } from '../queries'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const query = useExpense(id)
const update = useUpdateExpense(id, () => router.push('/dashboard/costs'))
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Editar custo" description="Atualize os dados do lançamento" back="/dashboard/costs" />
    <LoadingState v-if="query.isPending.value" />
    <ErrorState v-else-if="query.isError.value" message="Custo não encontrado." @retry="query.refetch()" />
    <ExpenseForm v-else :expense="query.data.value" :saving="update.isPending.value" @submit="update.mutate($event)" @cancel="router.push('/dashboard/costs')" />
  </div>
</template>
