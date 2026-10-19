<script setup lang="ts">
import { Edit3, Lock, Mail, Phone, Save, User, X } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import ChangePasswordForm from '@/features/auth/components/ChangePasswordForm.vue'
import PushToggleCard from '@/features/notifications/components/PushToggleCard.vue'
import { PATIENT_STATUS_MAP } from '@/features/patients/constants'
import { useMyProfile, useUpdateMyProfile } from '@/features/patients/queries'
import ErrorState from '@/shared/components/ErrorState.vue'
import FormField from '@/shared/components/FormField.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { formatDate, initials } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const query = useMyProfile()
const patient = computed(() => query.data.value)
const editing = ref(false)
const form = reactive({ email: '', phone: '', emergency_contact: '' })
const sync = () => patient.value && Object.assign(form, { email: patient.value.email || '', phone: patient.value.phone || '', emergency_contact: patient.value.emergency_contact || '' })
watch(patient, sync, { immediate: true })

const save = useUpdateMyProfile(() => (editing.value = false))
const cancel = () => (sync(), (editing.value = false))
</script>

<template>
  <LoadingState v-if="query.isPending.value" label="Carregando seus dados..." />
  <ErrorState v-else-if="query.isError.value || !patient" message="Não foi possível carregar seus dados." @retry="query.refetch()" />

  <div v-else class="space-y-4">
    <section class="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 p-4">
      <span class="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">{{ initials(patient.name) }}</span>
      <div class="min-w-0">
        <p class="truncate text-lg font-semibold">{{ patient.name }}</p>
        <p class="truncate text-sm text-muted-foreground">{{ patient.email }}</p>
        <StatusBadge class="mt-1" :status="patient.status" :map="PATIENT_STATUS_MAP" />
      </div>
    </section>

    <Tabs default-value="profile" class="space-y-4">
      <TabsList class="grid h-11 w-full grid-cols-3">
        <TabsTrigger value="profile">Dados</TabsTrigger>
        <TabsTrigger value="password">Senha</TabsTrigger>
        <TabsTrigger value="notifications">Avisos</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" class="space-y-4">
        <SectionCard title="Meus dados" description="Identificação e contato" :icon="User">
          <template #actions>
            <Button v-if="!editing" variant="outline" size="sm" class="h-9" @click="editing = true"><Edit3 /> Editar</Button>
          </template>
          <form class="space-y-4" @submit.prevent="save.mutate({ ...form })">
            <FormField v-slot="{ id }" label="Nome completo"><Input :id="id" :model-value="patient.name" disabled class="h-11" /></FormField>
            <FormField v-slot="{ id }" label="CPF"><Input :id="id" :model-value="patient.cpf ?? ''" disabled class="h-11" /></FormField>
            <FormField v-slot="{ id }" label="E-mail"><Input :id="id" v-model="form.email" type="email" inputmode="email" :disabled="!editing" class="h-11" /></FormField>
            <FormField v-slot="{ id }" label="Telefone"><Input :id="id" v-model="form.phone" type="tel" inputmode="tel" :disabled="!editing" class="h-11" placeholder="(11) 99999-9999" /></FormField>
            <FormField v-slot="{ id }" label="Contato de emergência"><Input :id="id" v-model="form.emergency_contact" :disabled="!editing" class="h-11" placeholder="Nome e telefone" /></FormField>
            <div v-if="editing" class="flex gap-2">
              <Button type="button" variant="outline" class="h-11 flex-1" :disabled="save.isPending.value" @click="cancel"><X /> Cancelar</Button>
              <Button type="submit" class="h-11 flex-1" :disabled="save.isPending.value"><Save /> {{ save.isPending.value ? 'Salvando...' : 'Salvar' }}</Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Status da terapia">
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between"><dt class="text-muted-foreground">Última sessão</dt><dd class="font-medium">{{ formatDate(patient.last_session_date) || 'Não informado' }}</dd></div>
            <div class="flex items-center justify-between"><dt class="text-muted-foreground">Próxima sessão</dt><dd class="font-medium">{{ formatDate(patient.next_session_date) || 'Não agendada' }}</dd></div>
          </dl>
        </SectionCard>

        <SectionCard v-if="patient.psychologist" title="Psicóloga responsável" :icon="User">
          <p class="font-medium">{{ patient.psychologist.name }}</p>
          <p v-if="patient.psychologist.crp" class="text-sm text-muted-foreground">CRP {{ patient.psychologist.crp }}</p>
          <div class="mt-3 space-y-2 border-t pt-3 text-sm">
            <p class="flex items-center gap-2"><Mail class="size-4 text-muted-foreground" /> <span class="min-w-0 break-all">{{ patient.psychologist.email }}</span></p>
            <p v-if="patient.psychologist.phone" class="flex items-center gap-2"><Phone class="size-4 text-muted-foreground" /> {{ patient.psychologist.phone }}</p>
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="password">
        <SectionCard title="Senha de acesso" description="Altere sua senha de acesso ao portal com segurança." :icon="Lock"><ChangePasswordForm /></SectionCard>
      </TabsContent>

      <TabsContent value="notifications"><PushToggleCard /></TabsContent>
    </Tabs>
  </div>
</template>
