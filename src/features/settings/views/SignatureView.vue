<script setup lang="ts">
import { Check, FileText, Loader2, Trash2, Upload } from '@lucide/vue'
import { ref } from 'vue'
import FileDropzone from '@/shared/components/FileDropzone.vue'
import LoadingState from '@/shared/components/LoadingState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { useConfirm } from '@/shared/composables/useConfirm'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useDeleteSignature, useSignature, useUploadSignature } from '../queries'

const query = useSignature()
const upload = useUploadSignature()
const del = useDeleteSignature()
const confirm = useConfirm()
const file = ref<File | null>(null)

function send() {
  if (!file.value) return
  if (!file.value.type.startsWith('image/')) return void (file.value = null)
  upload.mutate(file.value, { onSuccess: () => (file.value = null) })
}
async function remove() {
  if (await confirm({ title: 'Remover assinatura?', description: 'Os próximos contratos assinados sairão sem a sua assinatura.', confirmText: 'Remover', destructive: true })) del.mutate()
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Assinatura digital" description="Gerencie a assinatura aplicada aos PDFs dos contratos" back="/settings" />
    <div class="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Enviar assinatura" :icon="Upload">
        <div class="space-y-4">
          <FileDropzone v-model="file" accept="image/*" :max-mb="2" hint="JPG, PNG ou GIF • máx. 2 MB" />
          <Button class="w-full" :disabled="!file || upload.isPending.value" @click="send"><Loader2 v-if="upload.isPending.value" class="animate-spin" /><Upload v-else /> Enviar assinatura</Button>
          <div class="text-sm text-muted-foreground"><p class="font-medium text-foreground">Dicas para uma boa assinatura:</p><ul class="mt-2 list-inside list-disc space-y-1"><li>Imagem de alta qualidade</li><li>Fundo transparente ou branco</li><li>Assinatura legível e clara</li><li>Formato horizontal funciona melhor</li></ul></div>
        </div>
      </SectionCard>

      <SectionCard title="Assinatura atual" :icon="FileText">
        <LoadingState v-if="query.isPending.value" />
        <div v-else-if="query.data.value" class="space-y-4">
          <div class="rounded-lg border bg-white p-4"><img :src="query.data.value" alt="Assinatura" class="mx-auto max-h-32 max-w-full" /></div>
          <p class="flex items-center gap-2 text-sm text-success"><Check class="size-4" />Assinatura configurada</p>
          <Button variant="destructive" class="w-full" :disabled="del.isPending.value" @click="remove"><Loader2 v-if="del.isPending.value" class="animate-spin" /><Trash2 v-else /> Remover assinatura</Button>
        </div>
        <div v-else class="py-8 text-center text-muted-foreground"><FileText class="mx-auto mb-3 size-12 opacity-40" /><p>Nenhuma assinatura configurada</p><p class="text-sm">Envie uma imagem para ela aparecer aqui</p></div>
      </SectionCard>
    </div>

    <Card>
      <CardContent class="grid gap-4 md:grid-cols-3">
        <div v-for="(s, i) in [['Envio', 'Faça upload de uma imagem da sua assinatura'], ['Aplicação', 'A assinatura é aplicada automaticamente nos PDFs dos contratos'], ['Validação', 'Os contratos assinados saem com a sua assinatura digital']]" :key="i" class="rounded-lg bg-brand-50 p-4 text-center"><div class="mb-1 text-2xl font-bold text-brand-700">{{ i + 1 }}</div><h3 class="font-semibold">{{ s[0] }}</h3><p class="text-sm text-muted-foreground">{{ s[1] }}</p></div>
      </CardContent>
    </Card>
  </div>
</template>
