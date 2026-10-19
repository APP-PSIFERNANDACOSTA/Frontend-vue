import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import authApi from './api'
import type { LoginCredentials, RegisterData, User, UserRole } from './types'

export const homeForRole = (role: UserRole) => (role === 'psychologist' ? '/dashboard' : '/portal')

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(authApi.getStoredUser())
  const isLoading = ref(false)
  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? null)

  /** Valida o token salvo uma única vez por carregamento da página. */
  function init() {
    if (!initPromise) {
      initPromise = (async () => {
        if (!authApi.getToken()) {
          user.value = null
          return
        }
        user.value = await authApi.getCurrentUser()
      })()
    }
    return initPromise
  }

  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    try {
      const response = await authApi.login(credentials)
      if (response.success && response.user) {
        try {
          sessionStorage.removeItem('mood-checkin-dismissed')
        } catch {
          /* storage indisponível */
        }
        user.value = response.user
        return { success: true as const, user: response.user }
      }
      return { success: false as const, message: response.message || 'Email ou senha inválidos' }
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterData) {
    isLoading.value = true
    try {
      const response = await authApi.register(data)
      if (response.success && response.user) {
        user.value = response.user
        return { success: true as const, user: response.user }
      }
      return { success: false as const, message: response.message || 'Erro ao criar conta', errors: response.errors }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    await authApi.logout()
    clearSession()
  }

  /** Limpa o estado local (usado também no 401 global). */
  function clearSession() {
    user.value = null
    initPromise = null
    try {
      sessionStorage.removeItem('mood-checkin-dismissed') // novo login → o "Como você está hoje?" volta a aparecer
    } catch {
      /* storage indisponível */
    }
  }

  async function refreshUser() {
    const current = await authApi.getCurrentUser()
    if (current) user.value = current
  }

  function setUser(next: User) {
    user.value = next
  }

  return { user, role, isLoading, isAuthenticated, init, login, register, logout, clearSession, refreshUser, setUser }
})
