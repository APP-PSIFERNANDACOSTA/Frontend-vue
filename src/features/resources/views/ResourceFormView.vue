<script setup lang="ts">
import { Image as ImageIcon, Link2, Loader2, Plus, Save, Upload, User, Users, X } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PatientMultiSelect from '@/features/patients/components/PatientMultiSelect.vue'
import FileDropzone from '@/shared/components/FileDropzone.vue'
import FormField from '@/shared/components/FormField.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import QueryState from '@/shared/components/QueryState.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import { notify } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { useCreateResource, useResource, useSharedPatients, useUpdateResource } from '../queries'
import { RESOURCE_CATEGORIES, SHARING_TYPES } from '../types'

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const goList = () => router.push('/dashboard/resources')

const form = reactive({ kind: 'file' as 'file' | 'video', video_url: '', title: '', description: '', category: 'outros', tags: [] as string[], sharing_type: 'public' as 'public' | 'selective', patient_ids: [] as number[] })
const file = ref<File | null>(null)
const cover = ref<File | null>(null)
const removeCover = ref(false)
const tagInput = ref('')

// ---- edição ----
const resourceQ = useResource(() => id.value ?? 0)
const sharedQ = useSharedPatients(() => id.value ?? 0, () => resourceQ.data.value?.sharing_type === 'selective')
const loaded = ref(false)
watch([() => resourceQ.data.value, () => sharedQ.data.value, () => sharedQ.isPending.value], ([r, shared, pending]) => {
  if (!id.value || loaded.value || !r || (r.sharing_type === 'selective' && pending)) return
  Object.assign(form, { title: r.title, description: r.description || '', category: r.category || 'outros', tags: Array.isArray(r.tags) ? [...r.tags] : [], sharing_type: r.sharing_type || 'public', patient_ids: (shared ?? []).map((p) => p.id) })
  loaded.value = true
}, { immediate: true })
const ready = computed(() => !id.value || loaded.value)
const currentCover = computed(() => (removeCover.value ? null : resourceQ.data.value?.cover_url))
const coverPreview = computed(() => (cover.value ? URL.createObjectURL(cover.value) : currentCover.value))

function addTag() {
  const t = tagInput.value.trim()
  if (t && !form.tags.includes(t)) form.tags.push(t)
  tagInput.value = ''
}
function pickCover(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (f.size > 5 * 1024 * 1024) return notify.error('Imagem muito grande', 'A capa deve ter no máximo 5 MB.')
  cover.value = f
  removeCover.value = false
}
function dropCover() {
  cover.value = null
  removeCover.value = true
}

const create = useCreateResource(goList)
const update = useUpdateResource(id.value ?? 0, goList)
const busy = computed(() => create.isPending.value || update.isPending.value)

function submit() {
  if (!form.title.trim()) return notify.error('Título é obrigatório')
  if (form.sharing_type === 'selective' && !form.patient_ids.length) return notify.error('Selecione pelo menos um paciente para compartilhamento seletivo')
  const common = { title: form.title.trim(), description: form.description.trim() || undefined, category: form.category, tags: form.tags, sharing_type: form.sharing_type, patient_ids: form.sharing_type === 'selective' ? form.patient_ids : undefined }
  if (id.value) return update.mutate({ ...common, cover_image: cover.value ?? undefined, remove_cover: removeCover.value } as never)
  if (form.kind === 'file' && !file.value) return notify.error('Selecione um arquivo')
  if (form.kind === 'video' && !form.video_url.trim()) return notify.error('Digite a URL do vídeo')
  create.mutate({ ...common, ...(form.kind === 'file' ? { file: file.value! } : { video_url: form.video_url.trim() }), cover_image: cover.value ?? undefined } as never)
}
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <PageHeader :title="id ? 'Editar recurso' : 'Novo recurso'" :description="id ? 'Atualize os dados do recurso' : 'Adicione um novo recurso à sua biblioteca'" back="/dashboard/resources" />
    <QueryState v-if="id" :query="resourceQ" :empty="false"><span /></QueryState>

    <form v-if="ready" class="space-y-6" @submit.prevent="submit">
      <SectionCard v-if="!id" title="Tipo de recurso" description="Como deseja adicionar o recurso">
        <div class="grid grid-cols-2 gap-3">
          <button v-for="o in [{ k: 'file' as const, icon: Upload, title: 'Upload de arquivo', hint: 'PDF, vídeos, docs, etc.' }, { k: 'video' as const, icon: Link2, title: 'Link de vídeo', hint: 'YouTube, Vimeo, etc.' }]" :key="o.k" type="button" :class="cn('rounded-xl border-2 p-4 text-center transition-all sm:p-6', form.kind === o.k ? 'border-brand bg-brand-50' : 'hover:border-brand-200')" @click="((form.kind = o.k), (file = null), (form.video_url = ''))">
            <component :is="o.icon" class="mx-auto mb-2 size-7 text-brand-700" /><p class="font-medium">{{ o.title }}</p><p class="mt-1 text-xs text-muted-foreground">{{ o.hint }}</p>
          </button>
        </div>
      </SectionCard>

      <SectionCard v-if="!id && form.kind === 'file'" title="Arquivo principal" description="O arquivo que será compartilhado">
        <FileDropzone v-model="file" accept=".pdf,.mp4,.avi,.mov,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp" :max-mb="100" hint="PDF, vídeos, apresentações, documentos, imagens • máx. 100 MB" />
      </SectionCard>
      <SectionCard v-if="!id && form.kind === 'video'" title="URL do vídeo" description="Cole o link do YouTube, Vimeo ou outro serviço">
        <Input v-model="form.video_url" type="url" placeholder="https://www.youtube.com/watch?v=..." aria-label="URL do vídeo" />
      </SectionCard>

      <SectionCard title="Capa (opcional)" description="Uma capa personalizada para o recurso">
        <div v-if="coverPreview" class="flex items-start gap-4">
          <div class="relative"><img :src="coverPreview" alt="Capa" class="h-32 w-24 rounded-lg border object-cover" /><Button type="button" variant="destructive" size="icon" class="absolute -right-2 -top-2 size-6 rounded-full" aria-label="Remover capa" @click="dropCover"><X class="size-3" /></Button></div>
          <p class="text-sm text-muted-foreground">{{ cover?.name ?? 'Capa atual' }}</p>
        </div>
        <label v-else class="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-6 text-center hover:bg-muted/40"><ImageIcon class="mb-2 size-8 text-brand-600" /><span class="text-sm font-medium">Clique para adicionar capa</span><span class="text-xs text-muted-foreground">JPG, PNG, WEBP • máx. 5 MB</span><input type="file" class="sr-only" accept=".jpg,.jpeg,.png,.webp" @change="pickCover" /></label>
      </SectionCard>

      <SectionCard title="Informações básicas">
        <div class="space-y-4">
          <FormField v-slot="{ id: fid }" label="Título" required><Input :id="fid" v-model="form.title" placeholder="Digite o título do recurso" /></FormField>
          <FormField v-slot="{ id: fid }" label="Descrição"><Textarea :id="fid" v-model="form.description" rows="3" placeholder="Descreva o conteúdo do recurso" /></FormField>
          <FormField label="Categoria" required><Select v-model="form.category"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="c in RESOURCE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</SelectItem></SelectContent></Select></FormField>
          <FormField label="Tags">
            <div class="flex gap-2"><Input v-model="tagInput" placeholder="Digite uma tag" @keydown.enter.prevent="addTag" /><Button type="button" variant="outline" size="icon" aria-label="Adicionar tag" @click="addTag"><Plus /></Button></div>
            <div v-if="form.tags.length" class="mt-2 flex flex-wrap gap-2"><Badge v-for="t in form.tags" :key="t" variant="secondary" class="gap-1">{{ t }}<button type="button" :aria-label="`Remover ${t}`" @click="form.tags.splice(form.tags.indexOf(t), 1)"><X class="size-3" /></button></Badge></div>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Compartilhamento" description="Como o recurso será compartilhado">
        <div class="space-y-3">
          <button v-for="s in SHARING_TYPES" :key="s.value" type="button" :class="cn('flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left', form.sharing_type === s.value ? 'border-brand bg-brand-50' : 'hover:border-brand-200')" @click="form.sharing_type = s.value">
            <component :is="s.value === 'public' ? Users : User" class="mt-0.5 size-5 text-brand-700" /><span><span class="block font-medium">{{ s.label }}</span><span class="text-sm text-muted-foreground">{{ s.description }}</span></span>
          </button>
          <div v-if="form.sharing_type === 'selective'" class="rounded-lg border p-3"><p class="mb-2 text-sm font-medium">Selecionar pacientes</p><PatientMultiSelect v-model="form.patient_ids" /></div>
        </div>
      </SectionCard>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" :disabled="busy" @click="goList">Cancelar</Button>
        <Button type="submit" :disabled="busy"><Loader2 v-if="busy" class="animate-spin" /><Save v-else />{{ id ? 'Salvar alterações' : 'Criar recurso' }}</Button>
      </div>
    </form>
  </div>
</template>
