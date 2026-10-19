<script setup lang="ts">
/** Renderiza HTML do editor rico depois de sanitizar (DOMPurify). Nunca use v-html direto com conteúdo de usuário. */
import DOMPurify from 'dompurify'
import { computed } from 'vue'

const props = defineProps<{ html: string }>()
const clean = computed(() => DOMPurify.sanitize(props.html || '', { USE_PROFILES: { html: true } }))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="rich-content" v-html="clean" />
</template>
