<script setup lang="ts">
import { ChevronRight, NotebookPen } from '@lucide/vue'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { formatSessionLine, getPatientNoteDisplayTitle } from '@/features/notes/helpers'
import { useMyPostTherapyList } from '@/features/notes/queries'
import type { Session } from '@/features/sessions/types'
import AppPagination from '@/shared/components/AppPagination.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import QueryState from '@/shared/components/QueryState.vue'

const PER_PAGE = 15
const page = ref(1)
const perPage = ref(PER_PAGE)
const query = useMyPostTherapyList(page, PER_PAGE)
const notes = computed(() => query.data.value?.data ?? [])
const total = computed(() => query.data.value?.meta.total ?? 0)
const updated = (iso: string) => format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">Resumos após suas sessões. Toque em um item para ler o conteúdo completo.</p>

    <QueryState :query="query" :empty="notes.length === 0">
      <template #empty>
        <EmptyState :icon="NotebookPen" title="Nenhuma pós-terapia ainda" description="Quando sua psicóloga registrar um resumo após uma sessão, ele aparecerá aqui." />
      </template>

      <ul class="space-y-2.5">
        <li v-for="n in notes" :key="n.id">
          <RouterLink :to="`/portal/post-therapy/${n.id}`" class="flex min-h-16 items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-xs transition active:scale-[0.99] active:bg-muted/50">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50"><NotebookPen class="size-5 text-brand-600" /></span>
            <span class="min-w-0 flex-1">
              <span class="block break-words font-medium leading-snug">{{ getPatientNoteDisplayTitle(n) }}</span>
              <span v-if="n.session" class="mt-0.5 block text-xs text-muted-foreground">{{ formatSessionLine(n.session as Session) }}</span>
              <span class="mt-0.5 block text-[11px] text-muted-foreground">Atualizado {{ updated(n.updated_at) }}</span>
            </span>
            <ChevronRight class="size-5 shrink-0 text-muted-foreground" />
          </RouterLink>
        </li>
      </ul>

      <AppPagination v-if="total > PER_PAGE" v-model:page="page" v-model:per-page="perPage" :total="total" :sizes="[PER_PAGE]" />
    </QueryState>
  </div>
</template>
