<script setup lang="ts">
import { LogOut, Menu } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { isNavActive, patientMore, patientTabs } from '@/app/navigation'
import { useAuthStore } from '@/features/auth/store'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer'
import { cn } from '@/shared/lib/utils'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const moreOpen = ref(false)
const moreItems = patientMore.filter((i) => !i.hidden)
const moreActive = computed(() => moreItems.some((i) => isNavActive(i, route.path)))
watch(() => route.path, () => (moreOpen.value = false))

async function logout() {
  await auth.logout()
  router.replace('/')
}
</script>

<template>
  <nav class="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <ul class="mx-auto flex h-16 max-w-lg items-stretch">
      <li v-for="item in patientTabs" :key="item.to" class="flex-1">
        <RouterLink
          :to="item.to"
          :class="cn(
            'relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:bg-muted/60',
            isNavActive(item, route.path) ? 'text-brand-700 dark:text-brand' : 'text-muted-foreground',
          )"
        >
          <span v-if="isNavActive(item, route.path)" class="absolute top-0 h-0.5 w-10 rounded-full bg-brand" />
          <component :is="item.icon" class="size-6" />
          {{ item.name }}
        </RouterLink>
      </li>
      <li class="flex-1">
        <button
          type="button"
          :class="cn(
            'relative flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium active:bg-muted/60',
            moreActive ? 'text-brand-700 dark:text-brand' : 'text-muted-foreground',
          )"
          @click="moreOpen = true"
        >
          <span v-if="moreActive" class="absolute top-0 h-0.5 w-10 rounded-full bg-brand" />
          <Menu class="size-6" />
          Mais
        </button>
      </li>
    </ul>
  </nav>

  <Drawer v-model:open="moreOpen">
    <DrawerContent>
      <DrawerHeader class="text-left"><DrawerTitle>Menu</DrawerTitle></DrawerHeader>
      <div class="safe-bottom grid grid-cols-3 gap-2 px-4 pb-6">
        <RouterLink
          v-for="item in moreItems"
          :key="item.to"
          :to="item.to"
          :class="cn(
            'flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center text-xs font-medium active:scale-95 transition',
            isNavActive(item, route.path) ? 'border-brand bg-brand-50 text-brand-800' : 'bg-card',
          )"
        >
          <component :is="item.icon" class="size-6 text-brand-600" />
          {{ item.name }}
        </RouterLink>
        <button
          type="button"
          class="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-xs font-medium text-destructive active:scale-95 transition"
          @click="logout"
        >
          <LogOut class="size-6" />
          Sair
        </button>
      </div>
    </DrawerContent>
  </Drawer>
</template>
