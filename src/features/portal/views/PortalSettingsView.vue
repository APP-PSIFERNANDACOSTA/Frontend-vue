<script setup lang="ts">
import { HelpCircle, Moon, Palette, Sun, User } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import PushToggleCard from '@/features/notifications/components/PushToggleCard.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useTheme } from '@/shared/composables/useTheme'
import { Switch } from '@/shared/ui/switch'
import { Button } from '@/shared/ui/button'

const { isDark, toggle } = useTheme()
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">Preferências do aplicativo neste dispositivo</p>

    <SectionCard title="Aparência" :icon="Palette">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <Moon v-if="isDark" class="size-5 text-muted-foreground" /><Sun v-else class="size-5 text-muted-foreground" />
          <div>
            <p class="text-sm font-medium">Modo escuro</p>
            <p class="text-xs text-muted-foreground">Mais confortável para usar à noite</p>
          </div>
        </div>
        <Switch :model-value="isDark" aria-label="Modo escuro" @update:model-value="toggle" />
      </div>
    </SectionCard>

    <PushToggleCard />

    <SectionCard title="Conta" :icon="User">
      <p class="mb-3 text-sm text-muted-foreground">Dados pessoais, senha e contato de emergência ficam no seu perfil.</p>
      <Button variant="outline" class="h-11 w-full" as-child><RouterLink to="/portal/profile">Abrir meu perfil</RouterLink></Button>
    </SectionCard>

    <SectionCard title="Ajuda e emergências" :icon="HelpCircle">
      <div class="rounded-xl bg-muted p-3 text-sm">
        <p class="font-medium">Emergências</p>
        <p class="mt-1 text-muted-foreground">Em caso de emergência, ligue para 188 (CVV) ou 192 (SAMU). Este aplicativo não é um canal de atendimento emergencial.</p>
      </div>
    </SectionCard>
  </div>
</template>
