import apiClient, { getApiErrorMessage } from '@/shared/lib/api-client'
import { storage, TOKEN_KEY, USER_KEY } from '@/shared/lib/storage'
import type { AuthResponse, LoginCredentials, RegisterData, UpdateProfilePayload, User } from '@/features/auth/types'

function saveAuthData(token: string, user: User) {
  storage.set(TOKEN_KEY, token)
  storage.set(USER_KEY, JSON.stringify(user))
}

function clearAuthData() {
  storage.remove(TOKEN_KEY)
  storage.remove(USER_KEY)
}

export const authApi = {
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data)
      if (response.success && response.token && response.user) saveAuthData(response.token, response.user)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Erro ao registrar usuário'),
        errors: error.response?.data?.errors,
      }
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
      if (response.success && response.token && response.user) saveAuthData(response.token, response.user)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Erro ao fazer login'),
        errors: error.response?.data?.errors,
      }
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      /* sessão já inválida no servidor */
    } finally {
      clearAuthData()
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me')
      const token = storage.get(TOKEN_KEY)
      if (response.user && token) saveAuthData(token, response.user)
      return response.user
    } catch {
      clearAuthData()
      return null
    }
  },

  async updateProfile(
    data: UpdateProfilePayload,
  ): Promise<{ success: boolean; user?: User; message?: string; errors?: Record<string, string[]> }> {
    try {
      const response = await apiClient.put<{ success: boolean; user: User; message?: string }>('/auth/profile', data)
      const token = storage.get(TOKEN_KEY)
      if (response.success && response.user && token) saveAuthData(token, response.user)
      return { success: true, user: response.user, message: response.message }
    } catch (error: any) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Não foi possível atualizar o perfil'),
        errors: error.response?.data?.errors,
      }
    }
  },

  async changePassword(data: { current_password: string; new_password: string; new_password_confirmation: string }): Promise<void> {
    await apiClient.post('/auth/change-password', data)
  },

  getToken: () => storage.get(TOKEN_KEY),
  getStoredUser: () => storage.getJSON<User>(USER_KEY),
}

export default authApi
