<script setup lang="ts">
/**
 * Editor rico (Quill 2). v-model = HTML.  `<RichTextEditor v-model="html" placeholder="..." />`
 * Carregado sob demanda (import dinâmico) para não pesar o bundle principal.
 */
import { Loader2 } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type Quill from 'quill'
import 'quill/dist/quill.snow.css'

const props = withDefaults(defineProps<{ placeholder?: string; autofocus?: boolean }>(), { placeholder: 'Escreva aqui...' })
const model = defineModel<string>({ default: '' })

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
let quill: Quill | null = null
const BLANK = '<p><br></p>'

onMounted(async () => {
  const { default: QuillCtor } = await import('quill')
  if (!host.value) return
  quill = new QuillCtor(host.value, {
    theme: 'snow',
    placeholder: props.placeholder,
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link'],
        [{ color: [] }, { background: [] }],
        ['clean'],
      ],
    },
  })
  if (model.value && model.value !== BLANK) quill.root.innerHTML = model.value
  quill.on('text-change', () => {
    const html = quill!.root.innerHTML
    model.value = html === BLANK ? '' : html
  })
  loading.value = false
  if (props.autofocus) quill.focus()
})

// atualização externa (ex.: dados carregados depois do mount)
watch(model, (v) => {
  if (!quill) return
  const current = quill.root.innerHTML === BLANK ? '' : quill.root.innerHTML
  if ((v ?? '') !== current) quill.root.innerHTML = v || ''
})

onBeforeUnmount(() => {
  quill = null
})
</script>

<template>
  <div class="rich-editor relative overflow-hidden rounded-md border bg-card">
    <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-card/80"><Loader2 class="size-6 animate-spin text-brand" /></div>
    <div ref="host" />
  </div>
</template>
