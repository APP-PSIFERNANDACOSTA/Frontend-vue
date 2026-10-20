import type { PixChargeStatus } from './types'

export const PIX_STATUS: Record<PixChargeStatus, { label: string; class: string }> = {
  pending: { label: 'Aguardando pagamento', class: 'bg-warning/15 text-warning' },
  paid: { label: 'Pago', class: 'bg-success/15 text-success' },
  expired: { label: 'Expirado', class: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelado', class: 'bg-muted text-muted-foreground' },
  rejected: { label: 'Recusado', class: 'bg-destructive/10 text-destructive' },
  refunded: { label: 'Estornado', class: 'bg-info/10 text-info' },
}
