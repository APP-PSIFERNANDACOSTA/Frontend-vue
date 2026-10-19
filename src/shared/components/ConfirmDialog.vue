<script setup lang="ts">
/** Instância única montada no App.vue; controlada por useConfirm(). */
import { storeToRefs } from 'pinia'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { buttonVariants } from '@/shared/ui/button'
import { useConfirmStore } from '@/shared/composables/useConfirm'

const store = useConfirmStore()
const { open, options } = storeToRefs(store)
</script>

<template>
  <AlertDialog :open="open" @update:open="(v) => !v && store.resolve(false)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ options.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="options.description">{{ options.description }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="store.resolve(false)">{{ options.cancelText }}</AlertDialogCancel>
        <AlertDialogAction
          :class="buttonVariants({ variant: options.destructive ? 'destructive' : 'default' })"
          @click="store.resolve(true)"
        >
          {{ options.confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
