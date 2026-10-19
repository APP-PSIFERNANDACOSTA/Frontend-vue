<script setup lang="ts">
import { Bell, X } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/features/auth/store'
import { usePushStore } from '@/features/notifications/push'
import { Button } from '@/shared/ui/button'
import { storage } from '@/shared/lib/storage'

const STORAGE_KEY = 'notification-prompt-dismissed'
const DISMISS_MS = 24 * 60 * 60 * 1000

const auth = useAuthStore()
const push = usePushStore()
const { isSupported, permission, isSubscribed, isLoading, error } = storeToRefs(push)

const dismissedAt = Number(storage.get(STORAGE_KEY) || 0)
const dismissed = ref(Date.now() - dismissedAt < DISMISS_MS)

onMounted(() => push.check())

const visible = computed(
  () => !!auth.user && isSupported.value && permission.value !== 'denied' && !isSubscribed.value && !dismissed.value,
)
const message = computed(() =>
  auth.user?.role === 'psychologist'
    ? 'Receba lembretes quando pacientes postarem diários, responderem quizzes e outras atualizações.'
    : 'Receba lembretes de sessão, mensagens da psicóloga e outras atualizações importantes.',
)

async function activate() {
  if (await push.subscribe()) storage.remove(STORAGE_KEY)
}
function dismiss() {
  storage.set(STORAGE_KEY, String(Date.now()))
  dismissed.value = true
}
</script>

<template>
  <div v-if="visible" class="relative rounded-xl border border-brand-200 bg-brand-50 p-4">
    <button type="button" class="absolute right-2 top-2 rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label="Agora não" @click="dismiss">
      <X class="size-4" />
    </button>
    <div class="flex items-start gap-3 pr-6">
      <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
        <Bell class="size-5 text-brand-700" />
      </div>
      <div class="space-y-3">
        <div>
          <p class="font-semibold">Ative as notificações</p>
          <p class="mt-0.5 text-sm text-muted-foreground">{{ message }}</p>
          <p v-if="error" class="mt-1 text-xs text-destructive">{{ error }}</p>
        </div>
        <Button size="sm" class="bg-brand-dark text-white hover:bg-brand-dark/90" :disabled="isLoading" @click="activate">
          Ativar notificações
        </Button>
      </div>
    </div>
  </div>
</template>
