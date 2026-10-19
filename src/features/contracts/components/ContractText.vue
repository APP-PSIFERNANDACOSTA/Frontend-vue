<script setup lang="ts">
/** Texto do contrato formatado: parágrafos, títulos numerados ("1. Pagamento") e itens ("- item"). */
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

type Block = { kind: 'title' | 'item' | 'p'; text: string }
const paragraphs = computed<Block[][]>(() => {
  const normalized = (props.text || '').replace(/\r\n?/g, '\n')
  return normalized
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((p) =>
      p
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map<Block>((l) => (/^\d+\.\s/.test(l) ? { kind: 'title', text: l } : l.startsWith('- ') ? { kind: 'item', text: l } : { kind: 'p', text: l })),
    )
})
</script>

<template>
  <div class="space-y-3">
    <div v-for="(para, i) in paragraphs" :key="i">
      <template v-for="(b, j) in para" :key="j">
        <h4 v-if="b.kind === 'title'" class="mb-2 mt-4 text-base font-semibold first:mt-0">{{ b.text }}</h4>
        <p v-else-if="b.kind === 'item'" class="mb-1 ml-4 text-sm leading-relaxed">{{ b.text }}</p>
        <p v-else class="mb-2 text-sm leading-relaxed">{{ b.text }}</p>
      </template>
    </div>
  </div>
</template>
