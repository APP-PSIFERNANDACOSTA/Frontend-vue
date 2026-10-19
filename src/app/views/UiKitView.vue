<script setup lang="ts">
/** Vitrine do design system — só existe em desenvolvimento (rota /_ui). */
import ThemeToggle from '@/shared/components/ThemeToggle.vue'
import StatusBadge from '@/shared/components/StatusBadge.vue'
import StatCard from '@/shared/components/StatCard.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import { Users } from '@lucide/vue'
import { notify } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { useConfirm } from '@/shared/composables/useConfirm'

const confirm = useConfirm()
const demoPromise = () =>
  notify.promise(new Promise((r) => setTimeout(r, 1500)), { loading: 'Salvando...', success: 'Salvo!', error: 'Falhou' })
const tones = ['brand', 'success', 'warning', 'danger', 'info', 'neutral'] as const
const ask = async () => notify.info('Resposta', (await confirm({ title: 'Excluir item?', description: 'Esta ação não pode ser desfeita.', destructive: true })) ? 'Confirmou' : 'Cancelou')
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8 p-6">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Design system</h1>
      <ThemeToggle />
    </header>

    <section class="space-y-3">
      <h2 class="font-semibold">Notificações</h2>
      <div class="flex flex-wrap gap-2">
        <Button @click="notify.success('Paciente cadastrado com sucesso!')">Sucesso</Button>
        <Button variant="secondary" @click="notify.info('Dica', 'Você pode arrastar para fechar.')">Info</Button>
        <Button variant="outline" @click="notify.warning('Atenção', 'Esta sessão já passou.')">Aviso</Button>
        <Button variant="destructive" @click="notify.error('Erro ao salvar', 'Tente novamente mais tarde')">Erro</Button>
        <Button variant="ghost" @click="demoPromise">Promise</Button>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="font-semibold">Botões</h2>
      <div class="flex flex-wrap gap-2">
        <Button>Primário</Button><Button variant="secondary">Secundário</Button><Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button><Button variant="destructive">Destrutivo</Button><Button @click="ask">Confirmação</Button>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="font-semibold">Badges</h2>
      <div class="flex flex-wrap gap-2"><StatusBadge v-for="t in tones" :key="t" :tone="t" :label="t" /></div>
    </section>

    <section class="grid gap-3 sm:grid-cols-2">
      <StatCard label="Pacientes ativos" :value="15" :icon="Users" hint="este mês" />
      <EmptyState :icon="Users" title="Nada por aqui" description="Estado vazio padrão" />
    </section>
  </div>
</template>
