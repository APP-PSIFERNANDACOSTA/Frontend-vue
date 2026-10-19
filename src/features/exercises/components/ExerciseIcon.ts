import { Brain, Sparkles, Target, Wind } from '@lucide/vue'
import type { Component } from 'vue'

/** Ícone pela categoria do exercício (respiração, mindfulness, relaxamento...). */
export function exerciseIcon(category: string | null | undefined): Component {
  const c = (category || '').toLowerCase()
  if (c.includes('respir')) return Wind
  if (c.includes('mind') || c.includes('atenção') || c.includes('atencao')) return Brain
  if (c.includes('relax')) return Sparkles
  return Target
}
