import { Cloud, CloudRain, Meh, Smile, Sun } from '@lucide/vue'
import type { Component } from 'vue'
import { MOOD_OPTIONS, type MoodType } from './types'

/** Visual de cada humor (as cores aqui são semânticas — um humor, uma cor — e não da marca). */
const UI: Record<MoodType, { icon: Component; text: string; bg: string }> = {
  great: { icon: Sun, text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/50' },
  good: { icon: Smile, text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50' },
  neutral: { icon: Meh, text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
  sad: { icon: Cloud, text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/50' },
  'very-sad': { icon: CloudRain, text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50' },
}

export const moodLabel = (m: string) => MOOD_OPTIONS.find((o) => o.value === m)?.label ?? m
export const moodUi = (m: string) => UI[m as MoodType] ?? UI.neutral

/** Tags podem chegar como array ou como string JSON. */
export function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}
