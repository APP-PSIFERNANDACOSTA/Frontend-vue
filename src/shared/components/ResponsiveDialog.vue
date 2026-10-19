<script setup lang="ts">
/**
 * Dialog no desktop, bottom-sheet (Drawer) no mobile. Mesmo API para os dois.
 */
import { useBreakpoint } from '@/shared/composables/useBreakpoint'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer'

defineProps<{ title: string; description?: string; contentClass?: string }>()
const open = defineModel<boolean>('open', { default: false })
const { isDesktop } = useBreakpoint()
</script>

<template>
  <Dialog v-if="isDesktop" v-model:open="open">
    <DialogContent :class="['max-h-[90dvh] overflow-y-auto', contentClass]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription :class="!description && 'sr-only'">{{ description || title }}</DialogDescription>
      </DialogHeader>
      <slot />
      <DialogFooter v-if="$slots.footer"><slot name="footer" /></DialogFooter>
    </DialogContent>
  </Dialog>
  <Drawer v-else v-model:open="open">
    <DrawerContent class="max-h-[92dvh]">
      <DrawerHeader class="text-left">
        <DrawerTitle>{{ title }}</DrawerTitle>
        <DrawerDescription :class="!description && 'sr-only'">{{ description || title }}</DrawerDescription>
      </DrawerHeader>
      <div class="overflow-y-auto px-4 pb-2"><slot /></div>
      <DrawerFooter v-if="$slots.footer" class="safe-bottom"><slot name="footer" /></DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
