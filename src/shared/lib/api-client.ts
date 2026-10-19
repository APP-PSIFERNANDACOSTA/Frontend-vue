import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { storage, TOKEN_KEY, USER_KEY } from './storage'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

type UnauthorizedHandler = () => void

class ApiClient {
  private client: AxiosInstance
  private onUnauthorized: UnauthorizedHandler | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      withCredentials: false,
    })

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      // FormData: deixa o browser definir o boundary do multipart
      if (config.data instanceof FormData && config.headers?.['Content-Type'] === 'application/json') {
        delete config.headers['Content-Type']
      }
      const token = storage.get(TOKEN_KEY)
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          storage.remove(TOKEN_KEY)
          storage.remove(USER_KEY)
          this.onUnauthorized?.()
        }
        return Promise.reject(error)
      },
    )
  }

  /** Registrado pelo auth store: limpa o estado e manda para o login. */
  setUnauthorizedHandler(handler: UnauthorizedHandler) {
    this.onUnauthorized = handler
  }

  setToken(token: string) {
    storage.set(TOKEN_KEY, token)
  }

  getAxiosInstance() {
    return this.client
  }

  async get<T = any>(url: string, config: AxiosRequestConfig = {}) {
    return (await this.client.get<T>(url, config)).data
  }
  async post<T = any>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}) {
    return (await this.client.post<T>(url, data, config)).data
  }
  async put<T = any>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}) {
    return (await this.client.put<T>(url, data, config)).data
  }
  async patch<T = any>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}) {
    return (await this.client.patch<T>(url, data, config)).data
  }
  async delete<T = any>(url: string, config: AxiosRequestConfig = {}) {
    return (await this.client.delete<T>(url, config)).data
  }
}

export const apiClient = new ApiClient()
export default apiClient

/** Extrai a mensagem de erro de uma resposta Laravel/axios. */
export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  const e = error as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message || fallback
}

/** Erros de validação (422) do Laravel → { campo: primeira mensagem }. */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  const e = error as { response?: { data?: { errors?: Record<string, string[] | string> } } }
  const errors = e?.response?.data?.errors
  if (!errors) return {}
  return Object.fromEntries(
    Object.entries(errors).map(([k, v]) => [k.split('.')[0], Array.isArray(v) ? v[0] : v]),
  )
}

/**
 * Em downloads (`responseType: 'blob'`) a mensagem de erro do servidor chega como Blob JSON.
 * Chame dentro de um catch para reaproveitar `getApiErrorMessage` no toast.
 */
export async function normalizeBlobError(error: unknown): Promise<never> {
  const e = error as { response?: { data?: unknown } }
  if (e?.response?.data instanceof Blob) {
    try {
      const parsed = JSON.parse(await e.response.data.text())
      e.response.data = parsed
    } catch {
      /* mantém o erro original */
    }
  }
  throw error
}
