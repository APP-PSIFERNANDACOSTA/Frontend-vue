import { useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import expenseService from './api'
import type { CreateExpenseData } from './types'

export const costKeys = { all: ['costs'] as const }

export function useExpenses() {
  return useQuery({ queryKey: [...costKeys.all, 'list'] as const, queryFn: () => expenseService.getAll() })
}

export function useExpense(id: MaybeRefOrGetter<number>) {
  return useQuery({
    queryKey: () => [...costKeys.all, 'detail', toValue(id)] as const,
    queryFn: () => expenseService.getById(toValue(id)),
    enabled: () => !!toValue(id),
  })
}

// custos entram no resumo do financeiro e no dashboard
const invalidate = [costKeys.all, ['financial'], ['dashboard']]

export function useCreateExpense(onSuccess?: () => void) {
  return useApiMutation((d: CreateExpenseData) => expenseService.create(d), { success: 'Custo cadastrado com sucesso.', error: 'Erro ao cadastrar custo', invalidate, onSuccess })
}

export function useUpdateExpense(id: MaybeRefOrGetter<number>, onSuccess?: () => void) {
  return useApiMutation((d: CreateExpenseData) => expenseService.update(toValue(id), d), { success: 'Custo atualizado com sucesso.', error: 'Erro ao atualizar custo', invalidate, onSuccess })
}

export function useDeleteExpense() {
  return useApiMutation((id: number) => expenseService.delete(id), { success: 'O lançamento foi excluído com sucesso.', error: 'Erro ao remover custo', invalidate })
}
