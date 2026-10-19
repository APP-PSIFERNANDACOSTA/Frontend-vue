<script setup lang="ts">
import { Loader2, Lock, User as UserIcon } from '@lucide/vue'
import { reactive, ref, watch } from 'vue'
import authApi from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { getApiErrorMessage } from '@/shared/lib/api-client'
import { formatCpf, formatPhone } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const auth = useAuthStore()
const form = reactive({ name: '', email: '', phone: '', cpf: '', crp: '' })
watch(() => auth.user, (u) => u && Object.assign(form, { name: u.name || '', email: u.email || '', phone: formatPhone(u.phone || ''), cpf: formatCpf(u.cpf || ''), crp: u.crp || '' }), { immediate: true })

const errors = ref<Record<string, string>>({})
const saving = ref(false)
async function saveProfile() {
  saving.value = true
  errors.value = {}
  const res = await authApi.updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null, cpf: form.cpf.trim() || null, crp: form.crp.trim() || null } as never)
  saving.value = false
  if (!res.success) {
    errors.value = Object.fromEntries(Object.entries(res.errors ?? {}).filter(([, v]) => v?.[0]).map(([k, v]) => [k, v[0]]))
    return notify.error('Não foi possível salvar', res.message || 'Verifique os campos.')
  }
  if (res.user) auth.setUser(res.user)
  notify.success('Perfil atualizado', 'Suas informações foram salvas.')
}

const pw = reactive({ current_password: '', new_password: '', new_password_confirmation: '' })
const changing = ref(false)
async function changePassword() {
  if (!pw.current_password || !pw.new_password) return notify.error('Campos obrigatórios', 'Preencha a senha atual e a nova senha.')
  if (pw.new_password !== pw.new_password_confirmation) return notify.error('Senhas', 'A nova senha e a confirmação precisam ser iguais.')
  changing.value = true
  try {
    await authApi.changePassword({ ...pw })
    Object.assign(pw, { current_password: '', new_password: '', new_password_confirmation: '' })
    notify.success('Senha alterada', 'Sua senha foi atualizada com sucesso.')
  } catch (e) {
    notify.error('Erro ao alterar senha', getApiErrorMessage(e, 'Verifique a senha atual.'))
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Meu perfil" description="Atualize seus dados profissionais e a senha de acesso." />
    <Tabs default-value="dados">
      <TabsList class="grid w-full grid-cols-2 sm:w-96">
        <TabsTrigger value="dados" class="gap-2"><UserIcon class="size-4" />Dados pessoais</TabsTrigger>
        <TabsTrigger value="senha" class="gap-2"><Lock class="size-4" />Senha</TabsTrigger>
      </TabsList>

      <TabsContent value="dados" class="mt-4">
        <Card class="max-w-3xl">
          <CardHeader><CardTitle>Informações</CardTitle><CardDescription>Nome, contato e registro profissional (CRP).</CardDescription></CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="saveProfile">
              <FormField id="name" label="Nome completo" :error="errors.name"><Input id="name" v-model="form.name" autocomplete="name" /></FormField>
              <FormField id="email" label="E-mail" :error="errors.email"><Input id="email" v-model="form.email" type="email" autocomplete="email" /></FormField>
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField id="phone" label="Telefone" :error="errors.phone"><Input id="phone" :model-value="form.phone" placeholder="Opcional" maxlength="16" autocomplete="tel" @update:model-value="(v) => (form.phone = formatPhone(String(v)))" /></FormField>
                <FormField id="cpf" label="CPF" :error="errors.cpf"><Input id="cpf" :model-value="form.cpf" placeholder="000.000.000-00" maxlength="14" @update:model-value="(v) => (form.cpf = formatCpf(String(v)))" /></FormField>
              </div>
              <FormField id="crp" label="CRP" :error="errors.crp"><Input id="crp" v-model="form.crp" placeholder="Registro no Conselho Regional de Psicologia" /></FormField>
              <Button type="submit" :disabled="saving" class="w-full sm:w-auto"><Loader2 v-if="saving" class="animate-spin" />{{ saving ? 'Salvando...' : 'Salvar alterações' }}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="senha" class="mt-4">
        <Card class="max-w-3xl">
          <CardHeader><CardTitle>Alterar senha</CardTitle><CardDescription>Informe a senha atual e escolha uma nova senha segura.</CardDescription></CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="changePassword">
              <FormField id="current_password" label="Senha atual"><Input id="current_password" v-model="pw.current_password" type="password" autocomplete="current-password" /></FormField>
              <FormField id="new_password" label="Nova senha"><Input id="new_password" v-model="pw.new_password" type="password" autocomplete="new-password" /></FormField>
              <FormField id="new_password_confirmation" label="Confirmar nova senha"><Input id="new_password_confirmation" v-model="pw.new_password_confirmation" type="password" autocomplete="new-password" /></FormField>
              <Button type="submit" variant="secondary" :disabled="changing" class="w-full sm:w-auto"><Loader2 v-if="changing" class="animate-spin" />{{ changing ? 'Alterando...' : 'Atualizar senha' }}</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
