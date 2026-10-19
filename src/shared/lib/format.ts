import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value)
  if (value === null || value === undefined || value === '' || Number.isNaN(n)) return ''
  return brl.format(n)
}

export function formatDate(value: string | Date | null | undefined, pattern = 'dd/MM/yyyy'): string {
  if (!value) return ''
  const d = typeof value === 'string' ? parseISO(value) : value
  return isValid(d) ? format(d, pattern, { locale: ptBR }) : ''
}

export const digitsOnly = (s: string) => s.replace(/\D/g, '')

export function formatPhone(value: string | null | undefined): string {
  const d = digitsOnly(value ?? '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function formatCpf(value: string | null | undefined): string {
  const d = digitsOnly(value ?? '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? ''
}
