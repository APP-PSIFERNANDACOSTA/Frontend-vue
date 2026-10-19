<script setup lang="ts">
/** Liga/desliga notificações push do dispositivo. Reutilizado no portal e nas configurações da psicóloga. */
import { AlertCircle, Bell } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { notify } from '@/shared/lib/toast'
import { Switch } from '@/shared/ui/switch'
import { usePushStore } from '../push'

withDefaults(defineProps<{ description?: string }>(), {
  description: 'Receba avisos no celular sobre lembretes de sessão, mensagens e outras atualizações importantes.',
})
const push = usePushStore()
const { isSupported, permission, isSubscribed, isLoading, error } = storeToRefs(push)
onMounted(() => push.check())

async function toggle(on: boolean) {
  if (on) {
    if (await push.subscribe()) notify.success('Notificações ativadas', 'Você receberá avisos importantes neste dispositivo.')
    else notify.error('Erro ao ativar notificações', push.error ?? 'Não foi possível ativar as notificações push.')
  } else {
    await push.unsubscribe()
    notify.info('Notificações desativadas', 'Você não receberá mais notificações push neste dispositivo.')
  }
}
</script>

<template>
  <div class="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
    <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50"><Bell class="size-5 text-brand-600" /></span>
    <div class="min-w-0 flex-1 space-y-1">
      <p class="font-semibold">Notificações push</p>
      <p class="text-sm text-muted-foreground">{{ description }}</p>
      <p v-if="!isSupported" class="flex items-start gap-1 text-xs text-warning"><AlertCircle class="mt-0.5 size-3 shrink-0" /> {{ error || 'Notificações push não são suportadas neste navegador.' }}</p>
      <p v-else-if="permission === 'denied'" class="flex items-start gap-1 text-xs text-destructive"><AlertCircle class="mt-0.5 size-3 shrink-0" /> Permissão negada. Ative nas configurações do navegador.</p>
      <p v-else-if="error" class="flex items-start gap-1 text-xs text-destructive"><AlertCircle class="mt-0.5 size-3 shrink-0" /> {{ error }}</p>
    </div>
    <Switch :model-value="isSubscribed" :disabled="!isSupported || permission === 'denied' || isLoading" aria-label="Notificações push" @update:model-value="(v: boolean) => toggle(v)" />
  </div>
</template>
