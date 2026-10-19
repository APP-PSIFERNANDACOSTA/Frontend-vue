<script setup lang="ts">
/** Puxar para atualizar (touch). Só ativa quando a página está no topo. */
import { Loader2, ArrowDown } from '@lucide/vue'
import { computed, ref } from 'vue'

const props = defineProps<{ onRefresh: () => Promise<unknown> | unknown }>()
const THRESHOLD = 70
const startY = ref<number | null>(null)
const pull = ref(0)
const refreshing = ref(false)

function onStart(e: TouchEvent) {
  if (window.scrollY > 0 || refreshing.value) return
  startY.value = e.touches[0].clientY
}
function onMove(e: TouchEvent) {
  if (startY.value === null) return
  const dy = e.touches[0].clientY - startY.value
  pull.value = dy > 0 ? Math.min(dy * 0.5, THRESHOLD * 1.4) : 0
}
async function onEnd() {
  if (startY.value === null) return
  startY.value = null
  if (pull.value >= THRESHOLD) {
    refreshing.value = true
    pull.value = THRESHOLD * 0.7
    try {
      await props.onRefresh()
    } finally {
      refreshing.value = false
    }
  }
  pull.value = 0
}
const ready = computed(() => pull.value >= THRESHOLD)
</script>

<template>
  <div @touchstart.passive="onStart" @touchmove.passive="onMove" @touchend="onEnd" @touchcancel="onEnd">
    <div class="flex items-end justify-center overflow-hidden text-muted-foreground transition-[height]" :style="{ height: `${pull}px` }">
      <Loader2 v-if="refreshing" class="mb-2 size-5 animate-spin text-brand" />
      <ArrowDown v-else-if="pull > 10" class="mb-2 size-5 transition-transform" :class="ready && 'rotate-180'" />
    </div>
    <slot />
  </div>
</template>
