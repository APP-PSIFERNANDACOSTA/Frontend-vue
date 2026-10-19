<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { Button } from '@/shared/ui/button'
import { useTheme } from '@/shared/composables/useTheme'

const { isDark, toggle } = useTheme()
</script>

<template>
  <Button variant="ghost" size="icon" :aria-label="isDark ? 'Tema claro' : 'Tema escuro'" @click="toggle">
    <Sun v-if="isDark" class="size-5" />
    <Moon v-else class="size-5" />
  </Button>
</template>
