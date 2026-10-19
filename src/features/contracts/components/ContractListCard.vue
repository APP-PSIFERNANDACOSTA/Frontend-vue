<script setup lang="ts">
import { Copy, Eye, FileText, Mail, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { paymentTypeLabel } from '@/features/patients/constants'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import { useClipboardToast } from '@/shared/composables/useClipboardToast'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { CONTRACT_STATUS_MAP } from '../status'
import { contractActions, contractLink } from '../template'
import type { Contract } from '../types'

const props = defineProps<{ contract: Contract }>()
const emit = defineEmits<{ resend: []; inactivate: []; delete: [] }>()
const privacy = usePrivacyMode()
const { copy } = useClipboardToast()

const flags = computed(() => contractActions(props.contract))
const status = computed(() => flags.value.status)
const canShare = computed(() => flags.value.canShare)
const canDelete = computed(() => flags.value.canDelete)
const dt = (iso: string) => formatDate(iso, 'dd/MM/yyyy HH:mm')
</script>

<template>
  <Card class="min-w-0 transition-shadow hover:shadow-md">
    <CardContent class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :status="status" :map="CONTRACT_STATUS_MAP" />
        <StatusBadge v-if="contract.status === 'signed' && contract.pdf_path" tone="info"><FileText class="size-3" /> PDF disponível</StatusBadge>
        <span class="ml-auto text-xs text-muted-foreground">#{{ contract.id }}</span>
      </div>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt class="text-xs text-muted-foreground">Tipo de pagamento</dt><dd>{{ paymentTypeLabel(contract.payment_type) }}</dd></div>
        <div><dt class="text-xs text-muted-foreground">Valor da sessão</dt><dd class="font-medium">{{ privacy.money(contract.price_session) }}</dd></div>
        <div v-if="contract.patient" class="col-span-2"><dt class="text-xs text-muted-foreground">Paciente</dt><dd class="truncate">{{ privacy.name(contract.patient.name) }}</dd></div>
        <div v-if="contract.internal_description" class="col-span-2"><dt class="text-xs text-muted-foreground">Descrição interna</dt><dd class="line-clamp-2">{{ contract.internal_description }}</dd></div>
        <div><dt class="text-xs text-muted-foreground">Criado em</dt><dd>{{ dt(contract.created_at) }}</dd></div>
        <div v-if="contract.signed_at"><dt class="text-xs text-muted-foreground">Assinado em</dt><dd>{{ dt(contract.signed_at) }}</dd></div>
      </dl>

      <div class="flex flex-wrap gap-2 border-t pt-3">
        <Button size="sm" variant="outline" as-child><RouterLink :to="`/dashboard/contracts/${contract.id}`"><Eye /> Ver</RouterLink></Button>
        <template v-if="canShare">
          <Button size="sm" variant="outline" @click="copy(contractLink(contract.token), 'Link copiado!', 'O link do contrato foi copiado para a área de transferência')"><Copy /> <span class="hidden sm:inline">Copiar link</span></Button>
          <Button size="sm" variant="outline" @click="emit('resend')"><Mail /> Reenviar</Button>
        </template>
        <Button v-if="canDelete" size="sm" variant="destructive" @click="emit('delete')"><Trash2 /> Excluir</Button>
        <Button v-if="contract.status === 'signed'" size="sm" variant="outline" @click="emit('inactivate')">Inativar</Button>
      </div>
    </CardContent>
  </Card>
</template>
