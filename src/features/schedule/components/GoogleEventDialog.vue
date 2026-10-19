<script setup lang="ts">
import { Clock, ExternalLink, Video } from '@lucide/vue'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import type { GoogleCalendarEvent } from '@/features/settings/google.api'
import { Button } from '@/shared/ui/button'

defineProps<{ event: GoogleCalendarEvent | null }>()
const open = defineModel<boolean>('open', { default: false })
const hm = (iso: string) => format(new Date(iso), 'HH:mm', { locale: ptBR })
</script>

<template>
  <ResponsiveDialog v-model:open="open" title="Evento do Google Calendar">
    <div v-if="event" class="space-y-4 pb-2">
      <div>
        <p class="text-lg font-semibold">{{ event.summary }}</p>
        <p class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock class="size-4" />
          <span class="first-letter:uppercase">{{ format(new Date(event.start), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) }}</span> · {{ hm(event.start) }} – {{ hm(event.end) }}
        </p>
      </div>
      <p v-if="event.description" class="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">{{ event.description }}</p>
      <div class="flex flex-wrap gap-2">
        <Button v-if="event.hangoutLink" size="sm" as-child><a :href="event.hangoutLink" target="_blank" rel="noopener noreferrer"><Video /> Entrar na chamada</a></Button>
        <Button v-if="event.htmlLink" size="sm" variant="outline" as-child><a :href="event.htmlLink" target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir no Google Calendar</a></Button>
      </div>
    </div>
  </ResponsiveDialog>
</template>
