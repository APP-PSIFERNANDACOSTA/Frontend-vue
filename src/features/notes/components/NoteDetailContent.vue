<script setup lang="ts">
/** Leitura da anotação. `portal` = visual mobile-first do paciente (uma coluna, texto maior). */
import { Link2 } from '@lucide/vue'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { computed } from 'vue'
import { cn } from '@/shared/lib/utils'
import type { Session } from '@/features/sessions/types'
import { formatSessionLine, getSessionMetaCompactLine } from '../helpers'
import { formatPostTherapyFieldLabel, SESSION_META_FIELD_KEYS, STRUCTURED_FIELDS_ORDER, type PatientNote } from '../types'

const props = withDefaults(defineProps<{ note: PatientNote; variant?: 'default' | 'portal' }>(), { variant: 'default' })
const portal = computed(() => props.variant === 'portal')
const sessionLine = computed(() => getSessionMetaCompactLine(props.note))
const fields = computed(() =>
  STRUCTURED_FIELDS_ORDER.filter((k) => !SESSION_META_FIELD_KEYS.has(k)).filter((k) => props.note.body_structured?.[k]?.trim()),
)
const updated = computed(() => format(parseISO(props.note.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }))
</script>

<template>
  <div :class="cn('min-w-0 space-y-4', portal && 'space-y-5')">
    <p class="text-xs text-muted-foreground" :class="portal && 'text-sm'">{{ note.session_id ? 'Sessão vinculada' : 'Anotação geral' }} · Atualizado {{ updated }}</p>

    <template v-if="note.kind === 'free_text'">
      <div v-if="note.session_id && note.session" class="flex items-start gap-2 rounded-xl border border-brand-200 bg-card px-3.5 py-3 text-sm leading-snug">
        <Link2 class="mt-0.5 size-4 shrink-0 text-muted-foreground" /> <span>{{ formatSessionLine(note.session as Session) }}</span>
      </div>
      <p v-if="note.body_text" :class="cn('whitespace-pre-wrap break-words rounded-xl border bg-card p-4 text-muted-foreground', portal && 'text-[15px] leading-relaxed')">{{ note.body_text }}</p>
    </template>

    <template v-else-if="note.body_structured">
      <div v-if="sessionLine" class="flex items-start gap-2 rounded-xl border border-brand-200 bg-card px-3.5 py-3 text-sm leading-snug">
        <Link2 class="mt-0.5 size-4 shrink-0 text-muted-foreground" /> <span>{{ sessionLine }}</span>
      </div>
      <div :class="cn('grid gap-3', !portal && 'sm:grid-cols-2')">
        <div v-for="k in fields" :key="k" :class="cn('rounded-xl border border-brand-200 bg-card p-4 shadow-xs', !portal && k === 'discussion_summary' && 'sm:col-span-2')">
          <p class="mb-2 text-sm font-medium text-brand-700 dark:text-brand">{{ formatPostTherapyFieldLabel(k) }}</p>
          <p :class="cn('whitespace-pre-wrap break-words text-sm text-foreground/90', portal && 'text-[15px] leading-relaxed')">{{ note.body_structured?.[k] }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
