export type FinancialChargeStatus =
  | 'pending'
  | 'paid'
  | 'cancelled'

export type FinancialTransactionType =
  | 'income'
  | 'expense'

export type FinancialTransactionSource =
  | 'monthly_fee'
  | 'inventory_purchase'
  | 'manual'
  | 'adjustment'
  | 'appointment'
  | 'horse_purchase'
  | 'horse_sale'

export type FinancialCharge = {
  id: string
  horseId: string
  clientId: string
  competenceMonth: string
  dueDate: string | null
  amount: number
  status: FinancialChargeStatus
  paidAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type FinancialChargeListItem =
  FinancialCharge & {
    horseName: string
    clientName: string
  }

export type FinancialTransaction = {
  id: string
  transactionType: FinancialTransactionType
  sourceType: FinancialTransactionSource
  chargeId: string | null
  horseId: string | null
  clientId: string | null
  description: string
  amount: number
  occurredAt: string
  notes: string | null
  createdAt: string
}

export type FinancialMonthSummary = {
  competenceMonth: string
  receivedAmount: number
  receivableAmount: number
  expenseAmount: number
  balanceAmount: number
  pendingChargesCount: number
}

export type EnsureMonthlyChargesResult = {
  generatedCompetence: string
  createdCount: number
}

export type ConfirmMonthlyChargeResult = {
  transactionId: string
  chargeId: string
  amount: number
  paidAt: string
  alreadyPaid: boolean
}

export const FINANCIAL_CHARGE_STATUS_LABELS:
  Record<
    FinancialChargeStatus,
    string
  > = {
    pending:
      'Pendente',

    paid:
      'Pago',

    cancelled:
      'Cancelado',
  }

export const FINANCIAL_TRANSACTION_TYPE_LABELS:
  Record<
    FinancialTransactionType,
    string
  > = {
    income:
      'Receita',

    expense:
      'Despesa',
  }

export const FINANCIAL_TRANSACTION_SOURCE_LABELS:
  Record<
    FinancialTransactionSource,
    string
  > = {
    monthly_fee:
      'Mensalidade',

    inventory_purchase:
      'Compra de estoque',

    manual:
      'Lançamento manual',

    adjustment:
      'Ajuste',

    appointment:
      'Serviço da agenda',

    horse_purchase:
      'Compra de cavalo',

    horse_sale:
      'Venda de cavalo',
  }