import { useQuery, useQueryClient } from '@tanstack/vue-query'
import contractService from '@/features/contracts/api'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import googleService from './google.api'

export const settingsKeys = {
  signature: ['settings', 'signature'] as const,
  google: ['settings', 'google'] as const,
}

export function useSignature() {
  return useQuery({ queryKey: settingsKeys.signature, queryFn: () => contractService.getPsychologistSignature() })
}

export function useUploadSignature() {
  return useApiMutation((file: File) => contractService.uploadPsychologistSignature(file), { success: 'Assinatura enviada com sucesso!', error: 'Erro ao enviar assinatura', invalidate: [settingsKeys.signature] })
}

export function useDeleteSignature() {
  return useApiMutation(() => contractService.deletePsychologistSignature(), { success: 'Assinatura removida com sucesso!', error: 'Erro ao remover assinatura', invalidate: [settingsKeys.signature] })
}

export function useGoogleStatus() {
  return useQuery({ queryKey: settingsKeys.google, queryFn: () => googleService.getStatus() })
}

export function useDisconnectGoogle() {
  return useApiMutation(() => googleService.disconnect(), { success: 'Google Calendar desconectado', error: 'Erro ao desconectar', invalidate: [settingsKeys.google] })
}

export function useRefreshGoogleStatus() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: settingsKeys.google })
}
