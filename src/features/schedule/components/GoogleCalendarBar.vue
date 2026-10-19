<script setup lang="ts">
import { Calendar, Download, Loader2, RefreshCw, Upload, XCircle } from '@lucide/vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { Button } from '@/shared/ui/button'
import { useConnectGoogle, useDisconnectGoogle, usePushSessionsToGoogle } from '../queries'

defineProps<{ connected: boolean; checking: boolean; loadingEvents: boolean; eventsError: boolean }>()
const emit = defineEmits<{ refresh: [] }>()
const confirm = useConfirm()
const connect = useConnectGoogle()
const disconnect = useDisconnectGoogle()
const push = usePushSessionsToGoogle()

async function askDisconnect() {
  const ok = await confirm({ title: 'Desconectar o Google Calendar?', description: 'As sessões futuras não serão sincronizadas automaticamente.', confirmText: 'Desconectar', destructive: true })
  if (ok) disconnect.mutate(undefined)
}
</script>

<template>
  <div v-if="!checking" class="flex flex-wrap items-center gap-2">
    <template v-if="connected">
      <Button v-if="!eventsError" variant="outline" size="icon" title="Atualizar eventos do Google Calendar" aria-label="Atualizar eventos do Google" :disabled="loadingEvents" @click="emit('refresh')">
        <Loader2 v-if="loadingEvents" class="animate-spin" /><RefreshCw v-else />
      </Button>
      <Button v-if="!eventsError" variant="outline" size="icon" title="Enviar ao Google as sessões que ainda não têm evento" aria-label="Enviar sessões ao Google" :disabled="push.isPending.value || loadingEvents" @click="push.mutate(undefined)">
        <Loader2 v-if="push.isPending.value" class="animate-spin" /><Upload v-else />
      </Button>
      <Button v-else variant="outline" :disabled="loadingEvents" @click="emit('refresh')"><Loader2 v-if="loadingEvents" class="animate-spin" /><Download v-else /> Repuxar eventos do Google</Button>
      <Button variant="outline" :disabled="disconnect.isPending.value" @click="askDisconnect"><XCircle /> <span class="hidden sm:inline">Desconectar Google</span></Button>
    </template>
    <Button v-else variant="outline" :disabled="connect.isPending.value" @click="connect.mutate(undefined)">
      <Loader2 v-if="connect.isPending.value" class="animate-spin" /><Calendar v-else /> Conectar Google Calendar
    </Button>
  </div>
</template>
