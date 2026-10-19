import { computed, ref, watch, type Ref } from 'vue'

/** Paginação no cliente para listas que a API devolve inteiras (pagamentos, custos...). Volta à página 1 quando a lista muda. */
export function useClientPagination<T>(items: Ref<T[]>, initialPerPage = 10) {
  const page = ref(1)
  const perPage = ref(initialPerPage)
  const total = computed(() => items.value.length)
  const pageItems = computed(() => items.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
  watch([total, perPage], () => {
    if ((page.value - 1) * perPage.value >= total.value) page.value = 1
  })
  return { page, perPage, total, pageItems }
}
