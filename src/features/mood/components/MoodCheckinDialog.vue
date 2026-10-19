<script setup lang="ts">
/**
 * "Como você está hoje?" — aparece uma vez por acesso enquanto o paciente não responder no dia.
 * "Agora não" esconde até o próximo acesso (nova sessão do navegador/app); respondeu, só volta amanhã.
 */
import { BookHeart, Loader2, Phone } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { MoodType } from '@/features/diary/types'
import ResponsiveDialog from '@/shared/components/ResponsiveDialog.vue'
import { notify } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { useSaveMood, useTodayMood } from '../queries'
import { EMOTIONS, MOOD_SCORE, MOODS, moodLabel, moodUi, type Emotion } from '../ui'

const KEY = 'mood-checkin-dismissed'
const read = () => {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}
const write = (v: string) => {
  try {
    sessionStorage.setItem(KEY, v)
  } catch {
    /* sem storage: o modal só reaparece na próxima carga */
  }
}

const today = useTodayMood()
const open = ref(false)
const mood = ref<MoodType | null>(null)
const note = ref('')
const emotions = ref<Emotion[]>([])
const toggle = (e: Emotion) => (emotions.value = emotions.value.includes(e) ? emotions.value.filter((x) => x !== e) : [...emotions.value, e])
// em dia difícil, as emoções difíceis aparecem primeiro; em dia bom, as positivas
const ordered = computed(() => (mood.value && MOOD_SCORE[mood.value] >= 4 ? [...EMOTIONS.filter((e) => !e.hard), ...EMOTIONS.filter((e) => e.hard)] : EMOTIONS))
const done = ref(false)

// abre quando o servidor confirma que hoje ainda não há registro (e não foi dispensado neste acesso)
watch(() => today.data.value, (d) => {
  if (d && !d.checkin && read() !== d.date) open.value = true
}, { immediate: true })
// fechar sem responder = "agora não" (volta no próximo acesso)
watch(open, (o) => !o && !done.value && today.data.value && write(today.data.value.date))

const save = useSaveMood(() => {
  done.value = true
  open.value = false
  notify.success('Obrigada por compartilhar', 'Seu registro de hoje foi salvo.')
})
const submit = () => mood.value && save.mutate({ mood: mood.value, emotions: emotions.value, note: note.value.trim() || null })
const crisis = computed(() => mood.value === 'very-sad')
</script>

<template>
  <ResponsiveDialog v-model:open="open" title="Como você está se sentindo hoje?" description="Leva só um toque. Sua psicóloga acompanha esses registros.">
    <div class="space-y-5 pb-2">
      <div role="radiogroup" aria-label="Seu humor hoje" class="grid grid-cols-5 gap-2">
        <button
          v-for="m in MOODS" :key="m" type="button" role="radio" :aria-checked="mood === m"
          :class="cn('flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 transition-all', mood === m ? cn('scale-105 border-current', moodUi(m).bg, moodUi(m).text) : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted')"
          @click="mood = m"
        >
          <component :is="moodUi(m).icon" :class="cn('size-8', moodUi(m).text)" />
          <span class="text-[11px] font-medium leading-tight text-foreground">{{ moodLabel(m) }}</span>
        </button>
      </div>

      <div v-if="mood" class="space-y-2">
        <p class="text-sm font-medium">O que você está sentindo? <span class="font-normal text-muted-foreground">(opcional, pode marcar várias)</span></p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="e in ordered" :key="e.key" type="button" :aria-pressed="emotions.includes(e.key)"
            :class="cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors', emotions.includes(e.key) ? 'border-brand bg-brand-100 font-medium text-brand-900' : 'bg-background text-muted-foreground hover:bg-muted')"
            @click="toggle(e.key)"
          ><component :is="e.icon" class="size-3.5" />{{ e.label }}</button>
        </div>
      </div>

      <Textarea v-if="mood" v-model="note" rows="2" maxlength="280" placeholder="Quer contar em poucas palavras? (opcional)" aria-label="Comentário opcional" />

      <p v-if="crisis" class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
        <Phone class="mt-0.5 size-4 shrink-0 text-destructive" />
        <span>Sinto muito que hoje esteja difícil. Este não é um canal de emergência: se estiver em crise, ligue <strong>188 (CVV)</strong>, disponível 24h, ou <strong>192 (SAMU)</strong>.</span>
      </p>

      <div class="flex flex-col gap-2">
        <Button class="h-11" :disabled="!mood || save.isPending.value" @click="submit"><Loader2 v-if="save.isPending.value" class="animate-spin" />Salvar</Button>
        <Button v-if="mood" variant="ghost" class="h-10" as-child @click="submit"><RouterLink to="/portal/diary"><BookHeart /> Salvar e escrever no diário</RouterLink></Button>
        <Button variant="ghost" class="h-10 text-muted-foreground" @click="open = false">Agora não</Button>
      </div>
    </div>
  </ResponsiveDialog>
</template>
