/** Cores do Google Calendar (colorId) — https://developers.google.com/workspace/calendar/api/v3/reference/colors */
const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '1': { bg: '#7986CB', text: '#fff', border: '#5c6bc0' },
  '2': { bg: '#33B679', text: '#fff', border: '#2e9d6a' },
  '3': { bg: '#8E24AA', text: '#fff', border: '#701e88' },
  '4': { bg: '#E67C73', text: '#fff', border: '#e04a3f' },
  '5': { bg: '#F6BF26', text: '#1a1a1a', border: '#d4a01f' },
  '6': { bg: '#F4511E', text: '#fff', border: '#d84315' },
  '7': { bg: '#039BE5', text: '#fff', border: '#0288d1' },
  '8': { bg: '#616161', text: '#fff', border: '#424242' },
  '9': { bg: '#3F51B5', text: '#fff', border: '#303f9f' },
  '10': { bg: '#0B8043', text: '#fff', border: '#06602e' },
  '11': { bg: '#D50000', text: '#fff', border: '#b71c1c' },
}
const DEFAULT = COLORS['5'] // Banana, padrão do Google

export function googleEventStyle(colorId?: string | null) {
  const c = (colorId && COLORS[colorId]) || DEFAULT
  return { backgroundColor: c.bg, color: c.text, borderColor: c.border }
}
