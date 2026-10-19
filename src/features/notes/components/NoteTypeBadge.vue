<script setup lang="ts">
import { FileText, LayoutTemplate } from '@lucide/vue'
import { Badge } from '@/shared/ui/badge'
import type { PatientNoteKind } from '../types'

defineProps<{ kind: PatientNoteKind }>()
</script>

<template>
  <Badge variant="secondary" class="gap-1 font-normal">
    <template v-if="kind === 'structured'"><LayoutTemplate /> Modelo</template>
    <template v-else><FileText /> Texto livre</template>
  </Badge>
</template>
