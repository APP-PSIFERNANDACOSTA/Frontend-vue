import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import './assets/styles/main.css'

import App from './App.vue'
import { router } from './app/router'
import { useAuthStore } from './features/auth/store'
import { useBranding } from './shared/composables/useBranding'
import { useTheme } from './shared/composables/useTheme'
import apiClient from './shared/lib/api-client'
import { registerServiceWorker } from './app/pwa'
import { initPwaInstall } from './shared/composables/usePwaInstall'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Refetch ao voltar para a aba + a cada minuto enquanto visível (substitui use-auto-refresh)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
  },
})
app.use(VueQueryPlugin, { queryClient })
app.use(router)

useBranding().load()
useTheme()

// 401 em qualquer request → limpa sessão e volta ao login
apiClient.setUnauthorizedHandler(() => {
  useAuthStore(pinia).clearSession()
  queryClient.clear()
  if (router.currentRoute.value.meta.requiresAuth) router.replace('/')
})

app.mount('#app')
initPwaInstall()
registerServiceWorker()
