import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { installGuards } from './guards'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    role?: 'psychologist' | 'patient'
    guestOnly?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

installGuards(router)
