<script setup lang="ts">
import { Bell, ChevronRight, Palette, PenLine, Plug, User } from '@lucide/vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { Card, CardContent } from '@/shared/ui/card'

const ITEMS = [
  { title: 'Personalizar cores', description: 'Cor principal e cor de destaque de todo o sistema', icon: Palette, to: '/settings/colors' },
  { title: 'Perfil e conta', description: 'Seus dados profissionais e a senha de acesso', icon: User, to: '/dashboard/profile' },
  { title: 'Notificações', description: 'Modelos de mensagens e lembretes de sessão', icon: Bell, to: '/communications?tab=settings' },
  { title: 'Assinatura digital', description: 'Imagem usada nos PDFs dos contratos', icon: PenLine, to: '/settings/signature' },
  { title: 'Integrações', description: 'Google Calendar e Google Meet', icon: Plug, to: '/settings/integrations' },
]
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Configurações" description="Gerencie as configurações do sistema e personalize sua experiência" />
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink v-for="i in ITEMS" :key="i.to" :to="i.to" class="group block">
        <Card class="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
          <CardContent class="flex items-center gap-4">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100"><component :is="i.icon" class="size-6 text-brand-700" /></span>
            <div class="min-w-0 flex-1"><h2 class="font-semibold">{{ i.title }}</h2><p class="text-sm text-muted-foreground">{{ i.description }}</p></div>
            <ChevronRight class="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </CardContent>
        </Card>
      </RouterLink>
    </div>
  </div>
</template>
