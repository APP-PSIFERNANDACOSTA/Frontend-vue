<script setup lang="ts">
import { Check, Copy, FileText, Loader2, UserPlus } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { paymentTypeLabel } from '@/features/patients/constants'
import PatientSelect from '@/features/patients/components/PatientSelect.vue'
import { useActivePatients } from '@/features/patients/queries'
import FormField from '@/shared/components/FormField.vue'
import MoneyInput from '@/shared/components/MoneyInput.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import ContractText from '../components/ContractText.vue'
import { useCreateContract } from '../queries'
import { buildContractPreview, contractLink } from '../template'
import { CONTRACT_PAYMENT_TYPES, type Contract, type ContractPaymentType } from '../types'

const route = useRoute()
const router = useRouter()
const privacy = usePrivacyMode()
const { copy } = useClipboardToast()

const qPatient = Number(route.query.patientId)
const form = reactive({ patient_id: Number.isFinite(qPatient) && qPatient > 0 ? qPatient : (null as number | null), payment_type: 'por_sessao' as ContractPaymentType, price: undefined as number | undefined, internal_description: '' })
const patients = useActivePatients()
const patientName = computed(() => patients.data.value?.find((p) => p.id === form.patient_id)?.name)

const created = ref<Contract | null>(null)
const copied = ref(false)
const create = useCreateContract((c) => {
  created.value = c
  notify.success('Contrato criado!', form.patient_id ? 'O link leva à assinatura com os dados do paciente já carregados.' : 'Copie o link para enviar ao paciente.')
})

const preview = computed(() => buildContractPreview(form.payment_type, form.price ?? 0, form.patient_id != null))

function submit() {
  if (!form.price || form.price <= 0) return notify.error('Valor inválido', 'O valor da sessão deve ser maior que zero')
  create.mutate({ payment_type: form.payment_type, price_session: form.price, internal_description: form.internal_description || undefined, ...(form.patient_id != null ? { patient_id: form.patient_id } : {}) })
}
async function copyLink() {
  if (created.value && (await copy(contractLink(created.value.token), 'Link copiado!', 'O link do contrato foi copiado para a área de transferência'))) {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
}
function reset() {
  created.value = null
  Object.assign(form, { patient_id: null, payment_type: 'por_sessao', price: undefined, internal_description: '' })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="created ? 'Contrato criado' : 'Criar contrato'" :description="created ? 'Seu contrato foi gerado com sucesso' : 'Defina o tipo e o valor. O paciente assina por um link.'" back="/dashboard/contracts" />

    <template v-if="created">
      <Card class="border-success/40 bg-success/5">
        <CardHeader><CardTitle class="flex items-center gap-2 text-success"><FileText class="size-5" /> Contrato gerado</CardTitle></CardHeader>
        <CardContent class="space-y-5">
          <FormField label="Link para assinatura">
            <div class="flex gap-2"><Input :model-value="contractLink(created.token)" readonly class="font-mono text-xs" /><Button type="button" :variant="copied ? 'default' : 'outline'" @click="copyLink"><Check v-if="copied" /><Copy v-else /> {{ copied ? 'Copiado' : 'Copiar' }}</Button></div>
          </FormField>
          <dl class="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div v-if="created.patient || patientName"><dt class="text-xs text-muted-foreground">Paciente</dt><dd>{{ privacy.name(created.patient?.name ?? patientName) }}</dd></div>
            <div><dt class="text-xs text-muted-foreground">Tipo de pagamento</dt><dd>{{ paymentTypeLabel(created.payment_type) }}</dd></div>
            <div><dt class="text-xs text-muted-foreground">Valor da sessão</dt><dd class="font-medium">{{ privacy.money(created.price_session) }}</dd></div>
            <div><dt class="text-xs text-muted-foreground">Expira em</dt><dd>{{ formatDate(created.expires_at, 'dd/MM/yyyy') }}</dd></div>
            <div v-if="created.internal_description" class="sm:col-span-2"><dt class="text-xs text-muted-foreground">Descrição interna</dt><dd>{{ created.internal_description }}</dd></div>
          </dl>
          <div class="flex flex-col gap-2 sm:flex-row"><Button @click="router.push('/dashboard/contracts')">Ver contratos</Button><Button variant="outline" @click="reset">Criar outro contrato</Button></div>
        </CardContent>
      </Card>
    </template>

    <div v-else class="grid items-start gap-6 xl:grid-cols-2">
      <form @submit.prevent="submit">
        <Card>
          <CardHeader><CardTitle>Configurações do contrato</CardTitle></CardHeader>
          <CardContent class="space-y-5">
            <FormField label="Paciente" :hint="form.patient_id ? 'Renovação: o link já abre com os dados do paciente para conferência.' : 'Sem paciente: o cadastro é criado quando o paciente assinar.'">
              <PatientSelect v-model="form.patient_id" clearable clear-label="Novo paciente (cadastro na assinatura)" />
            </FormField>
            <FormField label="Tipo de pagamento" required>
              <Select v-model="form.payment_type">
                <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem v-for="t in CONTRACT_PAYMENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</SelectItem></SelectContent>
              </Select>
            </FormField>
            <FormField v-slot="{ id }" label="Valor da sessão (R$)" required><MoneyInput :id="id" v-model="form.price" required /></FormField>
            <FormField v-slot="{ id }" label="Descrição interna (opcional)" hint="Só você vê este texto."><Input :id="id" v-model="form.internal_description" placeholder="Ex.: Renovação de março" /></FormField>
            <Button type="submit" class="w-full sm:w-auto" :disabled="create.isPending.value"><Loader2 v-if="create.isPending.value" class="animate-spin" /><UserPlus v-else /> {{ create.isPending.value ? 'Gerando...' : 'Gerar contrato' }}</Button>
          </CardContent>
        </Card>
      </form>

      <SectionCard title="Pré-visualização do contrato" description="É assim que o paciente verá o texto" :icon="FileText">
        <div class="max-h-[70vh] overflow-y-auto rounded-lg border bg-muted/30 p-4"><ContractText :text="preview" /></div>
      </SectionCard>
    </div>
  </div>
</template>
