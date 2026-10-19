import { useMutation, useQueryClient, type QueryKey } from '@tanstack/vue-query'
import { getApiErrorMessage } from '@/shared/lib/api-client'
import { notify } from '@/shared/lib/toast'

/**
 * useMutation com o padrão do app: toast de sucesso/erro e invalidação de queries.
 * Substitui o bloco try/catch/toast repetido nas páginas antigas.
 */
export function useApiMutation<TVars, TData = unknown>(
  fn: (vars: TVars) => Promise<TData>,
  opts: {
    success?: string | ((data: TData) => string)
    error?: string
    invalidate?: QueryKey[]
    onSuccess?: (data: TData, vars: TVars) => void
  } = {},
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: async (data, vars) => {
      await Promise.all((opts.invalidate ?? []).map((queryKey) => qc.invalidateQueries({ queryKey })))
      if (opts.success) notify.success(typeof opts.success === 'function' ? opts.success(data) : opts.success)
      opts.onSuccess?.(data, vars)
    },
    onError: (err) => notify.error(opts.error ?? 'Erro', getApiErrorMessage(err)),
  })
}
