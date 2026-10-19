import type { Router } from 'vue-router'
import { homeForRole, useAuthStore } from '@/features/auth/store'

export function installGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.init()

    if (to.meta.requiresAuth && !auth.user) {
      return { path: '/', query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined }
    }
    // Rota de outro perfil → home do perfil logado
    if (to.meta.role && auth.user && to.meta.role !== auth.user.role) {
      return homeForRole(auth.user.role)
    }
    if (to.meta.guestOnly && auth.user) {
      return homeForRole(auth.user.role)
    }
  })

  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · Psi Fernanda Costa` : 'Psi Fernanda Costa'
  })
}
