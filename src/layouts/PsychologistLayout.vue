<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './psychologist/AppSidebar.vue'
import AppTopbar from './psychologist/AppTopbar.vue'

const collapsed = useStorage('sidebarCollapsed', false)
const mobileOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => (mobileOpen.value = false))
</script>

<template>
  <div class="min-h-dvh bg-background">
    <AppSidebar :collapsed="collapsed" :mobile-open="mobileOpen" @toggle-collapse="collapsed = !collapsed" @close="mobileOpen = false" />
    <div :class="['flex min-h-dvh flex-col transition-[padding] duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-64']">
      <AppTopbar @open-menu="mobileOpen = true" />
      <main class="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <RouterView />
      </main>
      <footer class="hidden border-t px-8 py-4 text-right text-xs text-muted-foreground lg:block">
        © {{ new Date().getFullYear() }} Psicóloga Fernanda Costa. Todos os direitos reservados.
      </footer>
    </div>
  </div>
</template>
