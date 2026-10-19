<script setup lang="ts">
/** Seleção de arquivo (clique ou arrastar). v-model = File | null. */
import { FileCheck, Upload, X } from '@lucide/vue'
import { ref } from 'vue'
import { notify } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'

const props = withDefaults(defineProps<{ accept?: string; maxMb?: number; hint?: string }>(), { accept: '.pdf,.jpg,.jpeg,.png', maxMb: 10 })
const file = defineModel<File | null>({ default: null })
const input = ref<HTMLInputElement | null>(null)
const over = ref(false)

function take(f: File | undefined | null) {
  if (!f) return
  if (f.size > props.maxMb * 1024 * 1024) return notify.error('Arquivo muito grande', `O limite é ${props.maxMb} MB.`)
  file.value = f
}
const clear = () => ((file.value = null), input.value && (input.value.value = ''))
</script>

<template>
  <div>
    <div
      role="button"
      tabindex="0"
      :class="cn('flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:bg-muted/40', over && 'border-brand-400 bg-brand-50', file && 'border-success/40 bg-success/5')"
      @click="input?.click()"
      @keydown.enter="input?.click()"
      @dragover.prevent="over = true"
      @dragleave="over = false"
      @drop.prevent="((over = false), take($event.dataTransfer?.files?.[0]))"
    >
      <template v-if="file">
        <FileCheck class="mb-2 size-8 text-success" />
        <p class="break-all text-sm font-medium">{{ file.name }}</p>
        <button type="button" class="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" @click.stop="clear"><X class="size-3" /> Remover</button>
      </template>
      <template v-else>
        <Upload class="mb-2 size-8 text-brand-600" />
        <p class="text-sm font-medium">Clique ou arraste o arquivo aqui</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ hint ?? `PDF, JPG ou PNG • máx. ${maxMb} MB` }}</p>
      </template>
    </div>
    <input ref="input" type="file" class="sr-only" :accept="accept" @change="take(($event.target as HTMLInputElement).files?.[0])" />
  </div>
</template>
