<script setup lang="ts">
import { MoreVertical, Plus, Share2, Smartphone, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { usePwaInstall } from '@/shared/composables/usePwaInstall'
import { Button } from '@/shared/ui/button'

const { platform, shouldShow, canPromptNative, install, dismiss } = usePwaInstall()
const guideOpen = ref(false)

const STEPS = {
  ios: [
    { icon: Share2, title: 'Toque em Compartilhar', text: 'Na barra do Safari, toque no ícone de compartilhar (quadrado com seta para cima).' },
    { icon: Plus, title: 'Adicionar à Tela de Início', text: 'Role o menu e toque em “Adicionar à Tela de Início”.' },
    { icon: Smartphone, title: 'Confirme', text: 'Toque em “Adicionar” no canto superior direito.' },
  ],
  android: [
    { icon: MoreVertical, title: 'Abra o menu do navegador', text: 'Toque nos três pontinhos no canto da tela.' },
    { icon: Plus, title: 'Instalar app', text: 'Toque em “Instalar app” ou “Adicionar à tela inicial”.' },
    { icon: Smartphone, title: 'Confirme', text: 'Na janela de confirmação, toque em “Instalar”.' },
  ],
}
const steps = computed(() => (platform === 'ios' ? STEPS.ios : STEPS.android))
const label = computed(() => (platform === 'ios' ? 'iPhone' : 'Android'))

/** Android/Chrome: abre o instalador nativo. Sem suporte (iOS etc.): mostra o passo a passo. */
async function onInstall() {
  if (canPromptNative.value) await install()
  else guideOpen.value = true
}
</script>

<template>
  <div v-if="shouldShow" class="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto w-full max-w-lg px-3">
    <div class="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-lg">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100"><Smartphone class="size-5 text-brand-700" /></span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold leading-tight">Instalar aplicativo</p>
        <p class="text-xs text-muted-foreground">Acesse mais rápido, direto da tela inicial do seu {{ label }}.</p>
      </div>
      <Button size="sm" class="h-9 shrink-0" @click="onInstall">{{ canPromptNative ? 'Instalar' : 'Como instalar' }}</Button>
      <button type="button" class="-mr-1 shrink-0 rounded-lg p-2 text-muted-foreground hover:text-foreground" aria-label="Agora não" @click="dismiss"><X class="size-4" /></button>
    </div>
  </div>

  <ResponsiveDialog v-model:open="guideOpen" :title="`Como instalar no ${label}`" description="Siga os passos para adicionar o app à tela inicial.">
    <ol class="space-y-5 py-2">
      <li v-for="(s, i) in steps" :key="i" class="flex gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><component :is="s.icon" class="size-5" /></span>
        <div><p class="font-medium">Passo {{ i + 1 }}: {{ s.title }}</p><p class="mt-0.5 text-sm text-muted-foreground">{{ s.text }}</p></div>
      </li>
    </ol>
  </ResponsiveDialog>
</template>
