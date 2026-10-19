<script setup lang="ts">
import { Eye, EyeOff, LogOut, Menu, User } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import { usePrivacyMode } from '@/shared/composables/usePrivacyMode'
import ThemeToggle from '@/shared/components/ThemeToggle.vue'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { initials } from '@/shared/lib/format'

const emit = defineEmits<{ openMenu: [] }>()
const auth = useAuthStore()
const { user } = storeToRefs(auth)
const privacy = usePrivacyMode()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.replace('/')
}
</script>

<template>
  <header class="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
    <Button variant="ghost" size="icon" class="lg:hidden" aria-label="Abrir menu" @click="emit('openMenu')">
      <Menu class="size-5" />
    </Button>
    <div class="flex-1"><slot /></div>

    <Button
      variant="ghost"
      size="icon"
      :aria-pressed="privacy.enabled.value"
      :title="privacy.enabled.value ? 'Mostrar dados sensíveis' : 'Ocultar dados sensíveis'"
      @click="privacy.toggle"
    >
      <EyeOff v-if="privacy.enabled.value" class="size-5" />
      <Eye v-else class="size-5" />
    </Button>
    <ThemeToggle />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" class="h-10 gap-2 px-2">
          <span class="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {{ initials(user?.name) }}
          </span>
          <span class="hidden max-w-[140px] truncate text-sm font-medium sm:block">{{ privacy.name(user?.name) }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-56">
        <div class="px-2 py-1.5">
          <p class="text-sm font-medium">{{ privacy.name(user?.name) }}</p>
          <p class="truncate text-xs text-muted-foreground">{{ privacy.email(user?.email) }}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem as-child>
          <RouterLink to="/dashboard/profile"><User /> Meu perfil</RouterLink>
        </DropdownMenuItem>
        <DropdownMenuItem class="text-destructive focus:text-destructive" @click="logout"><LogOut /> Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
