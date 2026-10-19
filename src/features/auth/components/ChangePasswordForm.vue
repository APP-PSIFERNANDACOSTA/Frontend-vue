<script setup lang="ts">
import { Loader2, Lock } from '@lucide/vue'
import { reactive, ref } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import { useApiMutation } from '@/shared/composables/useApiMutation'
import { getApiFieldErrors } from '@/shared/lib/api-client'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import authApi from '../api'

const form = reactive({ current: '', next: '', confirm: '' })
const errors = ref<Record<string, string>>({})

const change = useApiMutation(
  () => authApi.changePassword({ current_password: form.current, new_password: form.next, new_password_confirmation: form.confirm }),
  { success: 'Sua senha foi alterada com sucesso.', error: 'Não foi possível alterar a senha', onSuccess: () => Object.assign(form, { current: '', next: '', confirm: '' }) },
)

function submit() {
  errors.value = {}
  if (!form.current || !form.next || !form.confirm) return (errors.value.current = 'Preencha todos os campos de senha.')
  if (form.next.length < 8) return (errors.value.new_password = 'A nova senha deve ter no mínimo 8 caracteres.')
  if (form.next !== form.confirm) return (errors.value.confirm = 'A nova senha e a confirmação precisam ser iguais.')
  change.mutate(undefined, { onError: (e) => (errors.value = getApiFieldErrors(e)) })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <FormField v-slot="{ id }" label="Senha atual" :error="errors.current">
      <Input :id="id" v-model="form.current" type="password" autocomplete="current-password" class="h-11" />
    </FormField>
    <FormField v-slot="{ id }" label="Nova senha" hint="Mínimo de 8 caracteres" :error="errors.new_password">
      <Input :id="id" v-model="form.next" type="password" autocomplete="new-password" class="h-11" />
    </FormField>
    <FormField v-slot="{ id }" label="Confirmar nova senha" :error="errors.confirm">
      <Input :id="id" v-model="form.confirm" type="password" autocomplete="new-password" class="h-11" />
    </FormField>
    <Button type="submit" class="h-11 w-full sm:w-auto" :disabled="change.isPending.value">
      <Loader2 v-if="change.isPending.value" class="animate-spin" /><Lock v-else /> {{ change.isPending.value ? 'Alterando...' : 'Alterar senha' }}
    </Button>
  </form>
</template>
