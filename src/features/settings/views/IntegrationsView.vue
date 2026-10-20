<script setup lang="ts">
import { Calendar, CheckCircle2, Loader2, XCircle } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MercadoPagoIntegrationCard from '@/features/pix/components/MercadoPagoIntegrationCard.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { notify } from '@/shared/lib/toast'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import googleService from '../google.api'
import { useDisconnectGoogle, useGoogleStatus, useRefreshGoogleStatus } from '../queries'

const route = useRoute()
const router = useRouter()
const status = useGoogleStatus()
const disconnect = useDisconnectGoogle()
const refresh = useRefreshGoogleStatus()
const confirm = useConfirm()
const connecting = ref(false)

// retorno do OAuth do Google (?google_connected=true | ?google_error=...)
onMounted(() => {
  const { google_connected, google_error } = route.query
  if (google_connected === 'true') (notify.success('Google Calendar conectado!', 'Suas sessões serão sincronizadas automaticamente'), refresh())
  else if (google_error) notify.error('Erro ao conectar', String(google_error))
  if (google_connected || google_error) router.replace({ path: route.path })
})

async function connect() {
  connecting.value = true
  try {
    window.location.href = await googleService.getAuthUrl()
  } catch (e: any) {
    notify.error('Erro ao conectar', e?.message || 'Não foi possível conectar com o Google Calendar')
    connecting.value = false
  }
}
async function remove() {
  if (await confirm({ title: 'Desconectar Google Calendar?', description: 'As sessões futuras não serão mais sincronizadas automaticamente.', confirmText: 'Desconectar', destructive: true })) disconnect.mutate()
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Integrações" description="Conecte serviços externos para sincronizar automaticamente" back="/settings" />

    <SectionCard>
      <div class="space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex size-12 items-center justify-center rounded-xl bg-info/10"><Calendar class="size-6 text-info" /></span>
            <div><h2 class="text-lg font-semibold">Google Calendar</h2><p class="text-sm text-muted-foreground">Sincronize suas sessões com o Google Calendar e o Google Meet</p></div>
          </div>
          <Loader2 v-if="status.isPending.value" class="size-5 animate-spin text-muted-foreground" />
          <Badge v-else-if="status.data.value?.connected" class="bg-success text-white"><CheckCircle2 class="size-3" />Conectado</Badge>
          <Badge v-else variant="secondary"><XCircle class="size-3" />Desconectado</Badge>
        </div>

        <div class="space-y-2"><h3 class="font-semibold">Funcionalidades</h3>
          <ul class="list-inside list-disc space-y-1 text-sm text-muted-foreground"><li>Criação automática de eventos ao criar sessões</li><li>Atualização quando você edita ou remarca</li><li>Exclusão quando você deleta a sessão</li><li>Links do Google Meet gerados para cada sessão</li><li>Convites enviados para você e para o paciente</li></ul>
        </div>

        <p v-if="status.data.value?.expired" class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Sua conexão com o Google Calendar expirou. Reconecte para continuar sincronizando.</p>

        <div>
          <Button v-if="status.data.value?.connected" variant="destructive" :disabled="disconnect.isPending.value" @click="remove"><Loader2 v-if="disconnect.isPending.value" class="animate-spin" /><XCircle v-else /> Desconectar</Button>
          <Button v-else :disabled="connecting" @click="connect"><Loader2 v-if="connecting" class="animate-spin" /><Calendar v-else /> Conectar com Google Calendar</Button>
        </div>
        <p class="border-t pt-4 text-xs text-muted-foreground">Você será redirecionada ao Google para autorizar o acesso. O sistema precisa de permissão para criar, editar e excluir eventos em seu nome.</p>
      </div>
    </SectionCard>

    <MercadoPagoIntegrationCard />
  </div>
</template>
