<script setup lang="ts">
import { AlertCircle, RotateCw } from '@lucide/vue'
import { Button } from '@/shared/ui/button'

withDefaults(defineProps<{ message?: string }>(), { message: 'Não foi possível carregar os dados.' })
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
    <AlertCircle class="size-8 text-destructive" />
    <p class="text-sm text-foreground">{{ message }}</p>
    <Button variant="outline" size="sm" @click="emit('retry')"><RotateCw /> Tentar novamente</Button>
  </div>
</template>
