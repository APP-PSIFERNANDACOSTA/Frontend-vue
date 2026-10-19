import { BatteryLow, CloudRain, Flame, Frown, HandHeart, Leaf, Rocket, Scale, ShieldAlert, Smile, UserMinus, Zap } from '@lucide/vue'
import type { Component } from 'vue'
import { moodLabel, moodUi } from '@/features/diary/mood'
import type { MoodType } from '@/features/diary/types'

/** Do melhor para o pior — mesma escala do diário. */
export const MOODS: MoodType[] = ['great', 'good', 'neutral', 'sad', 'very-sad']
export const MOOD_SCORE: Record<MoodType, number> = { great: 5, good: 4, neutral: 3, sad: 2, 'very-sad': 1 }
/** Cor sólida para barras do gráfico (mesma família de cor do ícone do humor). */
export const MOOD_BAR: Record<MoodType, string> = {
  great: 'bg-yellow-400',
  good: 'bg-green-500',
  neutral: 'bg-blue-400',
  sad: 'bg-pink-400',
  'very-sad': 'bg-purple-500',
}
export { moodLabel, moodUi }

/** Média (1–5) → humor mais próximo, para descrever o período em palavras. */
export const moodFromAverage = (avg: number): MoodType => MOODS[Math.min(4, Math.max(0, 5 - Math.round(avg)))]

export type Emotion = 'anxiety' | 'anger' | 'sadness' | 'fear' | 'tiredness' | 'loneliness' | 'guilt' | 'frustration' | 'calm' | 'joy' | 'gratitude' | 'motivation'

/** Emoções do check-in (mesmas chaves do backend). `hard` = emoção difícil (entra em alertas e no resumo dos dias ruins). */
export const EMOTIONS: { key: Emotion; label: string; icon: Component; hard: boolean }[] = [
  { key: 'anxiety', label: 'Ansiedade', icon: Zap, hard: true },
  { key: 'anger', label: 'Raiva', icon: Flame, hard: true },
  { key: 'sadness', label: 'Tristeza', icon: CloudRain, hard: true },
  { key: 'fear', label: 'Medo', icon: ShieldAlert, hard: true },
  { key: 'tiredness', label: 'Cansaço', icon: BatteryLow, hard: true },
  { key: 'loneliness', label: 'Solidão', icon: UserMinus, hard: true },
  { key: 'guilt', label: 'Culpa', icon: Scale, hard: true },
  { key: 'frustration', label: 'Frustração', icon: Frown, hard: true },
  { key: 'calm', label: 'Calma', icon: Leaf, hard: false },
  { key: 'joy', label: 'Alegria', icon: Smile, hard: false },
  { key: 'gratitude', label: 'Gratidão', icon: HandHeart, hard: false },
  { key: 'motivation', label: 'Motivação', icon: Rocket, hard: false },
]
const BY_KEY = Object.fromEntries(EMOTIONS.map((e) => [e.key, e])) as Record<Emotion, (typeof EMOTIONS)[number]>
export const emotionInfo = (k: string) => BY_KEY[k as Emotion]
export const emotionLabel = (k: string) => BY_KEY[k as Emotion]?.label ?? k
