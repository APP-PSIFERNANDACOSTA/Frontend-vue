<script setup lang="ts">
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from '@lucide/vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { homeForRole, useAuthStore } from '@/features/auth/store'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  const result = await auth.login({ email: email.value, password: password.value })
  if (!result.success) {
    error.value = result.message || 'E-mail ou senha incorretos'
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  router.replace(redirect ?? homeForRole(result.user.role))
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center p-4">
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader class="space-y-3 text-center">
        <img src="/logo-login.png" alt="Psi Fernanda Costa" class="mx-auto h-auto w-56 max-w-full" />
        <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="submit">
          <div v-if="error" role="alert" class="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle class="size-4 shrink-0" /> {{ error }}
          </div>

          <div class="space-y-2">
            <Label for="email">E-mail</Label>
            <div class="relative">
              <Mail class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" v-model="email" type="email" inputmode="email" autocomplete="email" placeholder="seu@email.com" class="h-11 pl-10" required />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="password">Senha</Label>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="h-11 pl-10 pr-11"
                required
              />
              <button
                type="button"
                class="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-5" />
                <Eye v-else class="size-5" />
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" class="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90" :disabled="auth.isLoading">
            <Loader2 v-if="auth.isLoading" class="animate-spin" />
            {{ auth.isLoading ? 'Entrando...' : 'Entrar' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
