<script setup lang="ts">
import { AlertCircle, Download, Loader2, Pencil, Save, Upload, X } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import CopyField from '@/shared/components/CopyField.vue'
import ErrorState from '@/shared/components/ErrorState.vue'
import FileDropzone from '@/shared/components/FileDropzone.vue'
import FormField from '@/shared/components/FormField.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { digitsOnly, formatDate, formatMoney } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { RECEIPT_STATUS_MAP } from '../constants'
import { useDownloadReceiptProof, useHealthReceipt, useIssueHealthReceipt, useUpdateHealthReceipt } from '../queries'
import type { HealthReceiptStatus } from '../types'

const route = useRoute()
const privacy = usePrivacyMode()
const id = computed(() => Number(route.params.id))
const query = useHealthReceipt(id)
const r = computed(() => query.data.value)

const editMode = ref(false)
const form = reactive({ payer_cpf: '', service_date: '', status: 'pending' as HealthReceiptStatus })
const sync = () => r.value && Object.assign(form, { payer_cpf: r.value.payer_cpf || r.value.payment?.patient?.cpf || '', service_date: r.value.service_date.split('T')[0], status: r.value.status })
watch(r, sync, { immediate: true })

const isPending = computed(() => r.value?.status === 'pending')
const showEditForm = computed(() => isPending.value || editMode.value)
const patientCpf = computed(() => r.value?.payment?.patient?.cpf || r.value?.beneficiary_cpf || '')
const description = computed(() => r.value?.payment?.description || r.value?.description || '')
const payerIsPatient = computed(() => digitsOnly(form.payer_cpf) === '' || digitsOnly(form.payer_cpf) === digitsOnly(patientCpf.value))
// com privacidade ligada, os campos de copiar mostram máscara (e não permitem copiar o valor real)
const cpf = (v: string) => (privacy.enabled.value ? privacy.cpf(v) : v)

const update = useUpdateHealthReceipt(id, () => (editMode.value = false))
const proof = ref<File | null>(null)
const issue = useIssueHealthReceipt(id, () => (proof.value = null))
const downloadProof = useDownloadReceiptProof()

function save() {
  update.mutate({ payer_cpf: form.payer_cpf || null, service_date: form.service_date, status: form.status })
}
</script>

<template>
  <LoadingState v-if="query.isPending.value" />
  <ErrorState v-else-if="query.isError.value || !r" message="Recibo não encontrado." @retry="query.refetch()" />

  <div v-else class="space-y-6">
    <PageHeader title="Recibo Saúde" back="/dashboard/receipts">
      <template #description>{{ privacy.name(r.payment?.patient?.name) }} • {{ r.payment?.receipt_number }}</template>
      <template #actions>
        <StatusBadge :status="r.status" :map="RECEIPT_STATUS_MAP" />
        <Button v-if="!isPending" variant="outline" size="sm" @click="editMode = !editMode; sync()"><X v-if="editMode" /><Pencil v-else /> {{ editMode ? 'Cancelar' : 'Editar' }}</Button>
      </template>
    </PageHeader>

    <div v-if="r.missing_cpf && isPending" class="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
      <AlertCircle class="mt-0.5 size-5 shrink-0 text-warning" />
      <div><p class="font-medium">CPF ausente</p><p class="text-sm text-muted-foreground">Preencha o CPF do pagador e do beneficiário antes de emitir no Carnê-leão.</p></div>
    </div>

    <div class="grid items-start gap-6 lg:grid-cols-2">
      <SectionCard title="Dados para o Carnê-leão">
        <div class="space-y-3">
          <CopyField label="CPF do pagador" :value="cpf(form.payer_cpf)" />
          <CopyField label="Pagador é o beneficiário do serviço" :value="payerIsPatient ? 'Sim' : 'Não'" />
          <CopyField label="CPF do beneficiário do serviço" :value="cpf(patientCpf)" />
          <CopyField label="Valor (R$)" :value="formatMoney(r.amount)" />
          <CopyField label="Data do pagamento" :value="formatDate(r.payment_date)" />
          <CopyField label="Descrição" :value="description" />
          <CopyField label="Data do atendimento" :value="formatDate(form.service_date)" />
        </div>
      </SectionCard>

      <div class="space-y-6">
        <SectionCard v-if="showEditForm" title="Ajustar dados">
          <form class="space-y-4" @submit.prevent="save">
            <FormField v-slot="{ id: fid }" label="CPF do pagador" hint="Por padrão é o CPF do paciente. Altere apenas se outra pessoa pagou.">
              <Input :id="fid" v-model="form.payer_cpf" inputmode="numeric" placeholder="000.000.000-00" />
            </FormField>
            <FormField v-slot="{ id: fid }" label="CPF do beneficiário" :hint="`Sempre o paciente${r.payment?.patient?.name ? ` (${privacy.name(r.payment.patient.name)})` : ''}.`">
              <Input :id="fid" :model-value="cpf(patientCpf)" disabled />
            </FormField>
            <FormField v-slot="{ id: fid }" label="Data do atendimento"><Input :id="fid" v-model="form.service_date" type="date" /></FormField>
            <FormField label="Descrição" :hint="isPending ? undefined : 'Vem da descrição do pagamento.'">
              <p class="whitespace-pre-wrap rounded-md border bg-muted px-3 py-2 text-sm">{{ description || 'Sem descrição no pagamento' }}</p>
              <RouterLink v-if="isPending" :to="`/dashboard/payments/${r.payment_id}/edit`" class="text-xs text-brand-700 underline dark:text-brand">Editar pagamento</RouterLink>
            </FormField>
            <FormField v-if="!isPending && editMode" label="Status" :hint="form.status === 'pending' && r.status === 'issued' ? 'Voltar para pendente libera a edição do pagamento e o paciente deixa de ver o comprovante.' : undefined">
              <Select v-model="form.status">
                <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="issued">Emitido</SelectItem></SelectContent>
              </Select>
            </FormField>
            <Button type="submit" variant="outline" class="w-full" :disabled="update.isPending.value"><Loader2 v-if="update.isPending.value" class="animate-spin" /><Save v-else /> Salvar dados</Button>
          </form>
        </SectionCard>

        <SectionCard v-if="isPending" title="Subir comprovante do Carnê-leão" :icon="Upload" class="border-brand-300">
          <p class="mb-3 text-sm text-muted-foreground">Após emitir no gov.br, selecione o arquivo aqui. O paciente poderá baixá-lo no portal como <strong>Recibo de Saúde</strong>.</p>
          <FileDropzone v-model="proof" />
          <Button class="mt-4 w-full" :disabled="issue.isPending.value || !proof" @click="proof && issue.mutate(proof)">
            <Loader2 v-if="issue.isPending.value" class="animate-spin" /> Confirmar emissão e disponibilizar para o paciente
          </Button>
        </SectionCard>

        <SectionCard v-if="!isPending && r.proof_path" title="Comprovante emitido">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-muted-foreground">Emitido em {{ r.issued_at ? formatDate(r.issued_at) : '—' }}</p>
            <Button variant="outline" :disabled="downloadProof.isPending.value" @click="downloadProof.mutate(r.id)"><Download /> Baixar comprovante</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  </div>
</template>
