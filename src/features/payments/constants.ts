import type { StatusMap } from '@/shared/components/status'
import { PAYMENT_METHOD_LABELS } from './types'

/** Método → badge. PIX = verde (dinheiro na hora), cartão = azul, boleto = marca. */
export const PAYMENT_METHOD_MAP: StatusMap = {
  pix: { label: PAYMENT_METHOD_LABELS.pix, tone: 'success' },
  credit_card: { label: PAYMENT_METHOD_LABELS.credit_card, tone: 'info' },
  boleto: { label: PAYMENT_METHOD_LABELS.boleto, tone: 'brand' },
}

export const LOCKED_MESSAGE = 'Este pagamento não pode ser editado ou excluído porque o Recibo de Saúde já foi emitido no Carnê-leão.'
