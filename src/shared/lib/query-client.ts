import { QueryClient } from '@tanstack/vue-query'

/**
 * Cache único das telas. Limpo sempre que a sessão muda (login, logout, 401):
 * os dados de um usuário nunca podem aparecer para outro no mesmo navegador.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    // refetch ao voltar para a aba (substitui use-auto-refresh)
    queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
  },
})
