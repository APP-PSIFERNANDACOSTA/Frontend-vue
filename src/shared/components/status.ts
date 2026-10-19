export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type StatusMap = Record<string, { label: string; tone: Tone }>
