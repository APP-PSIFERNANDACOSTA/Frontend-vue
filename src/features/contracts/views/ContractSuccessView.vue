<script setup lang="ts">
import { Clock, Heart, Mail, MessageCircle, Phone } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Card } from '@/shared/ui/card'

const renewal = computed(() => useRoute().query.renewal === '1')
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center p-4">
    <div :class="['w-full', renewal ? 'max-w-lg' : 'max-w-2xl']">
      <header class="mb-8 text-center">
        <img src="/contrato-assinado.png" alt="" aria-hidden="true" width="480" height="480" :class="['mx-auto mb-2 object-contain', renewal ? 'size-40' : 'size-48 sm:size-56']" />
        <template v-if="renewal">
          <h1 class="mb-3 text-2xl font-bold sm:text-3xl">Contrato assinado com sucesso</h1>
          <p class="leading-relaxed text-muted-foreground">Obrigada pela confiança. Seu novo contrato está registrado; se você alterou algum dado no formulário, ele já foi atualizado.</p>
        </template>
        <template v-else>
          <h1 class="mb-2 text-3xl font-bold">Seu contrato foi assinado com sucesso!</h1>
          <p class="text-lg text-muted-foreground">A partir de agora, você está oficialmente cadastrado(a) como meu/minha paciente, e fico feliz em te acompanhar nesse processo.</p>
        </template>
      </header>

      <Card class="mb-6 gap-4 p-6">
        <h2 v-if="!renewal" class="text-center text-2xl font-semibold text-brand-800 dark:text-brand">Próximos passos</h2>
        <div class="flex items-start gap-3 rounded-lg bg-brand-50 p-4">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100"><Mail class="size-5 text-brand-700" /></span>
          <div><h3 class="font-semibold">{{ renewal ? 'E-mail' : 'E-mail de confirmação' }}</h3><p class="mt-0.5 text-sm text-muted-foreground">{{ renewal ? 'Você receberá o PDF do contrato assinado por e-mail.' : 'Você receberá um e-mail com o PDF do contrato assinado e algumas informações importantes para te orientar ao longo do processo terapêutico.' }}</p></div>
        </div>
        <div class="flex items-start gap-3 rounded-lg bg-brand-50 p-4">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100"><MessageCircle class="size-5 text-brand-700" /></span>
          <div><h3 class="font-semibold">{{ renewal ? 'WhatsApp' : 'Contato pelo WhatsApp' }}</h3><p class="mt-0.5 text-sm text-muted-foreground">{{ renewal ? 'Para dúvidas ou alinhamentos, pode falar comigo pelo (44) 9 9910-3847.' : 'Caso precise falar comigo, tirar dúvidas ou alinhar qualquer detalhe, você pode entrar em contato pelo WhatsApp. Esse canal é nosso meio oficial de comunicação fora das sessões.' }}</p></div>
        </div>
        <div v-if="!renewal" class="flex items-start gap-3 rounded-lg bg-brand-50 p-4">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100"><Clock class="size-5 text-brand-700" /></span>
          <div><h3 class="font-semibold">Acesso ao portal do paciente</h3><p class="mt-0.5 text-sm text-muted-foreground">Em breve, você receberá suas credenciais para acessar o portal do paciente. Por lá, você poderá escrever no seu diário pessoal e acompanhar seu processo com mais clareza e organização.</p></div>
        </div>
      </Card>

      <Card v-if="!renewal" class="mb-6 gap-2 p-6 text-center">
        <h3 class="flex items-center justify-center gap-2 text-xl font-semibold text-brand-800 dark:text-brand"><Phone class="size-5" /> Informações de contato</h3>
        <div class="grid gap-3 text-sm md:grid-cols-2"><p><span class="font-medium">WhatsApp:</span> (44) 9 9910-3847</p><p><span class="font-medium">Instagram:</span> @psicfernandacosta</p></div>
      </Card>

      <Card class="gap-1 p-6 text-center">
        <p class="flex items-center justify-center gap-2 text-lg font-medium text-brand-800 dark:text-brand"><Heart class="size-5" /> Fernanda Gabriela Bezerra da Costa</p>
        <p class="text-sm text-muted-foreground">Psicóloga — CRP-08/43119</p>
        <p v-if="!renewal" class="text-sm text-muted-foreground">Este é o início de um processo de cuidado, autoconhecimento e construção.</p>
      </Card>
    </div>
  </div>
</template>
