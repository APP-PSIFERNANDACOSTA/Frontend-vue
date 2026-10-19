<script setup lang="ts">
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'
import { isNavActive, psychologistNavGroups } from '@/app/navigation'
import BrandLogo from '@/shared/components/BrandLogo.vue'
import { cn } from '@/shared/lib/utils'

defineProps<{ collapsed: boolean; mobileOpen: boolean }>()
const emit = defineEmits<{ toggleCollapse: []; close: [] }>()
const route = useRoute()
// grupos sem nenhum item visível somem por inteiro
const groups = psychologistNavGroups.map((g) => ({ ...g, items: g.items.filter((i) => !i.hidden) })).filter((g) => g.items.length)
</script>

<template>
  <!-- Overlay mobile -->
  <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity" leave-active-class="transition-opacity">
    <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" @click="emit('close')" />
  </Transition>

  <aside
    :class="cn(
      'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-[transform,width] duration-300',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      collapsed && 'lg:w-20',
    )"
  >
    <div class="relative flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
      <RouterLink to="/dashboard" class="flex flex-1 items-center" :class="collapsed && 'lg:justify-center'">
        <BrandLogo v-if="collapsed" variant="symbol" class="hidden size-10 lg:block" />
        <BrandLogo :class="cn('max-h-11 w-auto', collapsed && 'lg:hidden')" />
      </RouterLink>
      <button class="rounded-lg p-2 hover:bg-sidebar-accent lg:hidden" aria-label="Fechar menu" @click="emit('close')">
        <X class="size-5" />
      </button>
      <button
        class="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-sidebar-border bg-sidebar p-1.5 shadow-md hover:bg-sidebar-accent lg:flex"
        :aria-label="collapsed ? 'Expandir menu' : 'Recolher menu'"
        @click="emit('toggleCollapse')"
      >
        <ChevronRight v-if="collapsed" class="size-4" />
        <ChevronLeft v-else class="size-4" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto p-3">
      <section v-for="(group, gi) in groups" :key="group.title ?? 'main'" :class="gi > 0 && 'mt-5'">
        <h2 v-if="group.title" :class="cn('mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground', collapsed && 'lg:hidden')">{{ group.title }}</h2>
        <!-- recolhido: o título some, então um traço separa os módulos -->
        <div v-if="group.title && collapsed" class="mx-3 mb-2 hidden border-t border-sidebar-border lg:block" />
        <div class="space-y-1">
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :title="collapsed ? item.name : undefined"
            :class="cn(
              'flex items-center gap-3 rounded-lg border-l-3 px-3 py-2.5 text-sm font-medium transition-colors',
              isNavActive(item, route.path)
                ? 'border-brand bg-brand-50 text-brand-800 dark:text-brand-700'
                : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent',
              collapsed && 'lg:justify-center lg:px-0',
            )"
            @click="emit('close')"
          >
            <component :is="item.icon" class="size-5 shrink-0" />
            <span :class="collapsed && 'lg:hidden'">{{ item.name }}</span>
          </RouterLink>
        </div>
      </section>
    </nav>
  </aside>
</template>
