export type HorseTradeType =
  | 'purchase'
  | 'sale'

export type HorseTradePaymentStatus =
  | 'pending'
  | 'paid'

export type HorseTrade = {
  id: string
  horseId: string
  tradeType: HorseTradeType
  amount: number
  tradeAt: string
  counterpartyClientId: string | null
  counterpartyName: string | null
  paymentStatus: HorseTradePaymentStatus
  paidAt: string | null
  keepsBoarding: boolean | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type RegisterHorseTradeInput = {
  horseId: string
  tradeType: HorseTradeType
  amount: number
  tradeAt: string
  counterpartyClientId?: string | null
  counterpartyName?: string | null
  paid: boolean
  paidAt?: string | null
  keepsBoarding?: boolean | null
  monthlyFee?: number | null
  notes?: string | null
}

export type RegisterHorseTradeResult = {
  tradeId: string
  financialTransactionId: string | null
  paymentStatus: HorseTradePaymentStatus
  paidAt: string | null
  horseActive: boolean
  horseOwnershipType:
    | 'client'
    | 'haras'
}

export type ConfirmHorseTradePaymentResult = {
  tradeId: string
  financialTransactionId: string
  amount: number
  paidAt: string
  alreadyPaid: boolean
}

export const HORSE_TRADE_TYPE_LABELS:
  Record<
    HorseTradeType,
    string
  > = {
    purchase:
      'Compra',

    sale:
      'Venda',
  }

export const HORSE_TRADE_PAYMENT_STATUS_LABELS:
  Record<
    HorseTradePaymentStatus,
    string
  > = {
    pending:
      'Pendente',

    paid:
      'Pago',
  }