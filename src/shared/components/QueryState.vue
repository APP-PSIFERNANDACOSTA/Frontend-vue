<script lang="ts">
export interface QueryLike {
  isPending: { value: boolean }
  isError: { value: boolean }
  error: { value: unknown }
  refetch: () => unknown
}
</script>

<script setup lang="ts">
/**
 * Envelopa o resultado de um useQuery: mostra loading / erro / vazio / conteúdo.
 * Uso: <QueryState :query="q" :empty="!q.data.value?.length"> ... </QueryState>
 */
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'
import { getApiErrorMessage } from '@/shared/lib/api-client'

const props = defineProps<{
  query: QueryLike
  empty?: boolean
  loadingLabel?: string
}>()
</script>

<template>
  <slot v-if="props.query.isPending.value" name="loading">
    <LoadingState :label="loadingLabel" />
  </slot>
  <ErrorState
    v-else-if="props.query.isError.value"
    :message="getApiErrorMessage(props.query.error.value, 'Não foi possível carregar os dados.')"
    @retry="props.query.refetch()"
  />
  <slot v-else-if="empty" name="empty" />
  <slot v-else />
</template>
