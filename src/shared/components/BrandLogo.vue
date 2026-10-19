<script setup lang="ts">
import { useTheme } from '@/shared/composables/useTheme'

withDefaults(defineProps<{ variant?: 'full' | 'symbol'; class?: string }>(), { variant: 'full' })
const { isDark } = useTheme()
</script>

<template>
  <img v-if="variant === 'symbol'" src="/simbolo.png" alt="Psi Fernanda Costa" :class="['rounded-lg', $props.class]" />
  <img v-else :src="isDark ? '/logowhite.png' : '/logopdfrecibo.png'" alt="Psi Fernanda Costa" :class="['object-contain', $props.class]" />
</template>
