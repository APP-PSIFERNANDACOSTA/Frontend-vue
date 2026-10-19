<script setup lang="ts">
import { File } from '@lucide/vue'
import { useMyContracts } from '@/features/contracts/queries'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'
import PortalContractCard from '../components/PortalContractCard.vue'

const query = useMyContracts()
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">Visualize seus contratos terapêuticos</p>
    <QueryState :query="query" :empty="!query.data.value?.length">
      <template #empty><EmptyState :icon="File" title="Nenhum contrato encontrado" description="Você ainda não possui contratos." /></template>
      <PortalContractCard v-for="c in query.data.value" :key="c.id" :contract="c" />
    </QueryState>
  </div>
</template>
