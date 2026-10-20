<script setup lang="ts">
/**
 * Credenciais do Mercado Pago pelo painel. O token nunca volta inteiro da API:
 * campo vazio = manter o valor atual. O backend testa o token antes de salvar.
 */
import { Eye, EyeOff, Loader2, Save } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'
import FormField from '@/shared/components/FormField.vue'
import { getApiFieldErrors } from '@/shared/lib/api-client'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useSaveMercadoPagoSettings } from '../queries'
import type { MercadoPagoSettingsData, MercadoPagoStatus } from '../types'

const props = defineProps<{ status: MercadoPagoStatus }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const fromPanel = computed(() => props.status.source === 'panel')
const form = reactive({ access_token: '', public_key: props.status.source === 'panel' ? props.status.public_key ?? '' : '', webhook_secret: '' })
const show = reactive({ token: false, secret: false })
const removeSecret = ref(false)
const save = useSaveMercadoPagoSettings(() => emit('saved'))
const errors = computed(() => (save.error.value ? getApiFieldErrors(save.error.value) : {}))

function submit() {
  const data: MercadoPagoSettingsData = {}
  if (form.access_token.trim()) data.access_token = form.access_token.trim()
  data.public_key = form.public_key.trim()
  if (removeSecret.value) data.webhook_secret = ''
  else if (form.webhook_secret.trim()) data.webhook_secret = form.webhook_secret.trim()
  save.mutate(data)
}
</script>

<template>
  <form class="space-y-4 rounded-xl border bg-muted/30 p-4" autocomplete="off" @submit.prevent="submit">
    <FormField v-slot="{ id }" label="Access Token" :required="!fromPanel" :error="errors.access_token"
      :hint="fromPanel ? `Atual: ${status.access_token_hint}. Deixe vazio para manter.` : 'Credenciais → Access Token (começa com APP_USR-)'">
      <div class="flex gap-2">
        <Input :id="id" v-model="form.access_token" :type="show.token ? 'text' : 'password'" class="font-mono text-xs" :placeholder="fromPanel ? status.access_token_hint ?? '' : 'APP_USR-...'" spellcheck="false" />
        <Button type="button" variant="outline" size="icon" :aria-label="show.token ? 'Ocultar token' : 'Mostrar token'" @click="show.token = !show.token"><EyeOff v-if="show.token" /><Eye v-else /></Button>
      </div>
    </FormField>

    <FormField v-slot="{ id }" label="Public Key (opcional)" hint="Só será usada se um dia houver checkout com cartão no app.">
      <Input :id="id" v-model="form.public_key" class="font-mono text-xs" placeholder="APP_USR-..." spellcheck="false" />
    </FormField>

    <FormField v-slot="{ id }" label="Assinatura secreta do webhook (recomendado)" :error="errors.webhook_secret"
      :hint="status.webhook_signature && fromPanel ? 'Já configurada. Deixe vazio para manter.' : 'Suas integrações → Webhooks → Assinatura secreta'">
      <div class="flex gap-2">
        <Input :id="id" v-model="form.webhook_secret" :type="show.secret ? 'text' : 'password'" class="font-mono text-xs" :disabled="removeSecret" :placeholder="status.webhook_signature && fromPanel ? '••••••••' : ''" spellcheck="false" />
        <Button type="button" variant="outline" size="icon" :aria-label="show.secret ? 'Ocultar assinatura' : 'Mostrar assinatura'" @click="show.secret = !show.secret"><EyeOff v-if="show.secret" /><Eye v-else /></Button>
      </div>
      <label v-if="status.webhook_signature && fromPanel" class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground"><input v-model="removeSecret" type="checkbox" class="accent-brand-600" /> Remover a assinatura salva</label>
    </FormField>

    <div class="flex flex-wrap gap-2">
      <Button type="submit" :disabled="save.isPending.value"><Loader2 v-if="save.isPending.value" class="animate-spin" /><Save v-else /> {{ save.isPending.value ? 'Validando no Mercado Pago…' : 'Salvar e testar' }}</Button>
      <Button v-if="status.configured" type="button" variant="ghost" @click="emit('cancel')">Cancelar</Button>
    </div>
    <p class="text-xs text-muted-foreground">As credenciais ficam criptografadas no servidor e nunca aparecem inteiras na tela.</p>
  </form>
</template>
