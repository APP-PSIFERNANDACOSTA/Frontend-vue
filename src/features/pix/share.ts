import { formatMoney } from '@/shared/lib/format'

/** Link do WhatsApp com a mensagem de cobrança (null sem telefone válido). */
export function whatsappPixLink(phone: string | null | undefined, name: string | null | undefined, amount: string | number, link: string): string {
  let digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  if (digits.length < 12) return ''
  const first = String(name ?? '').trim().split(/\s+/)[0]
  const text = `Olá${first ? `, ${first}` : ''}! Segue o link para pagamento via Pix (${formatMoney(amount)}):\n${link}\n\nÉ só abrir, copiar o código ou ler o QR Code no app do seu banco.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
