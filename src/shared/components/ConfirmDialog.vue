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

// fechou sem confirmar (Esc, clique fora, Cancelar) = "não" — adiado para o @click do Confirmar resolver primeiro
function onOpenChange(v: boolean) {
  if (!v) setTimeout(() => store.resolve(false))
}
</script>

<template>
  <!-- fechar (Esc/fora/Cancelar) = "não". Adiado: o botão de confirmar fecha o diálogo ANTES do próprio @click;
       sem o adiamento, o "não" do fechamento chegava primeiro e toda confirmação virava recusa. -->
  <AlertDialog :open="open" @update:open="onOpenChange">
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
