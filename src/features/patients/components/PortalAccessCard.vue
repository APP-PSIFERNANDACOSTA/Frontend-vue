<script setup lang="ts">
import { Check, Copy, Loader2, Lock, Send } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useClipboard } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/lib/api-client'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import FormField from '@/shared/components/FormField.vue'
import patientService from '../api'
import { patientKeys } from '../queries'
import type { Patient, PortalAccessCredentials } from '../types'

const props = defineProps<{ patient: Patient }>()
const privacy = usePrivacyMode()
const qc = useQueryClient()
const { copy, copied } = useClipboard({ legacy: true })
const copiedField = ref<'Email' | 'Senha' | null>(null)
const credentials = ref<PortalAccessCredentials | null>(null)

const hasAccess = computed(() => !!props.patient.user_id)
const loginEmail = computed(() => credentials.value?.email || props.patient.user?.email || props.patient.email || '')

async function copyValue(text: string, field: 'Email' | 'Senha') {
  await copy(text)
  copiedField.value = field
  notify.success('Copiado!', `${field} copiado para a área de transferência`)
  setTimeout(() => (copiedField.value = null), 2000)
}

const grant = useApiMutation(() => patientService.grantPortalAccess(props.patient.id), {
  success: 'Acesso criado. Credenciais enviadas para o paciente!',
  error: 'Erro ao criar acesso',
  invalidate: [patientKeys.all],
  onSuccess: (res) => (credentials.value = res.credentials),
})

// 400 "already has portal access" não é erro para o usuário
async function grantAccess() {
  try {
    await grant.mutateAsync(undefined)
  } catch (e: any) {
    const msg = String(e?.response?.data?.message ?? '')
    if (e?.response?.status === 400 && msg.toLowerCase().includes('already has portal access')) {
      notify.success('Acesso já existente', 'Este paciente já possui acesso ao portal.')
      qc.invalidateQueries({ queryKey: patientKeys.all })
    }
  }
}

const pw = reactive({ password: '', password_confirmation: '' })
const pwSaving = ref(false)
const pwError = ref('')

async function savePassword() {
  pwError.value = ''
  if (pw.password.length < 8) return (pwError.value = 'A senha deve ter no mínimo 8 caracteres.')
  if (pw.password !== pw.password_confirmation) return (pwError.value = 'A confirmação precisa ser igual à nova senha.')
  pwSaving.value = true
  try {
    await patientService.updatePortalPassword(props.patient.id, { ...pw })
    pw.password = pw.password_confirmation = ''
    notify.success('Senha atualizada', 'A nova senha do portal foi salva. Informe o paciente com segurança.')
  } catch (e) {
    pwError.value = getApiFieldErrors(e).password || getApiErrorMessage(e, 'Não foi possível alterar a senha.')
  } finally {
    pwSaving.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader><CardTitle class="flex items-center gap-2 text-lg"><Send class="size-5" /> Acesso ao portal do paciente</CardTitle></CardHeader>
    <CardContent class="space-y-4">
      <div v-if="!hasAccess && !credentials" class="py-4 text-center">
        <p class="mb-4 text-muted-foreground">Crie credenciais de acesso para o portal do paciente</p>
        <Button :disabled="grant.isPending.value" @click="grantAccess">
          <Loader2 v-if="grant.isPending.value" class="animate-spin" /><Send v-else />
          {{ grant.isPending.value ? 'Criando acesso...' : 'Enviar acesso ao portal' }}
        </Button>
      </div>

      <template v-else>
        <div class="rounded-lg border border-success/30 bg-success/10 p-4">
          <h4 class="mb-1 font-semibold text-success">{{ credentials ? 'Credenciais criadas com sucesso!' : 'Acesso ao portal já ativado' }}</h4>
          <p class="text-sm text-muted-foreground">
            {{ credentials ? 'As credenciais foram enviadas por e-mail para o paciente.' : 'Este paciente já possui acesso ao portal.' }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <FormField label="E-mail de acesso">
            <div class="flex gap-2">
              <Input :model-value="privacy.enabled.value ? privacy.email(loginEmail) : loginEmail" readonly class="bg-muted text-sm" />
              <Button type="button" variant="outline" size="icon" :disabled="privacy.enabled.value || !loginEmail" :title="privacy.enabled.value ? 'Desative o modo privacidade para copiar' : 'Copiar'" @click="copyValue(loginEmail, 'Email')">
                <Check v-if="copied && copiedField === 'Email'" /><Copy v-else />
              </Button>
            </div>
          </FormField>
          <FormField label="Senha temporária">
            <div class="flex gap-2">
              <Input
                :model-value="privacy.enabled.value && credentials?.temporary_password ? '••••••••' : credentials?.temporary_password || 'Já definida pelo paciente'"
                readonly
                class="bg-muted text-sm"
              />
              <Button type="button" variant="outline" size="icon" :disabled="privacy.enabled.value || !credentials?.temporary_password" :title="privacy.enabled.value ? 'Desative o modo privacidade para copiar' : 'Copiar'" @click="credentials && copyValue(credentials.temporary_password, 'Senha')">
                <Check v-if="copied && copiedField === 'Senha'" /><Copy v-else />
              </Button>
            </div>
          </FormField>
        </div>

        <div class="rounded-lg border border-info/30 bg-info/10 p-4 text-sm text-muted-foreground">
          <strong class="text-foreground">Importante:</strong> oriente o paciente a alterar a senha no primeiro acesso ao portal.
        </div>

        <form v-if="hasAccess" class="max-w-md space-y-3 border-t pt-4" @submit.prevent="savePassword">
          <div class="flex items-center gap-2 text-sm font-medium"><Lock class="size-4" /> Nova senha do portal (paciente)</div>
          <p class="text-xs text-muted-foreground">Defina uma nova senha para o login do paciente. Informe-o por um canal seguro (ex.: presencialmente).</p>
          <FormField v-slot="{ id }" label="Nova senha">
            <Input :id="id" v-model="pw.password" type="password" autocomplete="new-password" />
          </FormField>
          <FormField v-slot="{ id }" label="Confirmar nova senha" :error="pwError">
            <Input :id="id" v-model="pw.password_confirmation" type="password" autocomplete="new-password" />
          </FormField>
          <Button type="submit" variant="secondary" :disabled="pwSaving">
            <Loader2 v-if="pwSaving" class="animate-spin" /><Lock v-else />
            {{ pwSaving ? 'Salvando...' : 'Salvar nova senha' }}
          </Button>
        </form>
      </template>
    </CardContent>
  </Card>
</template>
