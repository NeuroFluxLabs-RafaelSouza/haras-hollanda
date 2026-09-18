import type {
  RegisterHorseTradeResult,
} from '../../domain/horseTrade.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

export type RegisterHorsePurchaseWithLineageInput = {
  horseId: string
  lineageId: string
  amount: number
  tradeAt: string
  counterpartyClientId: string | null
  counterpartyName: string | null
  paid: boolean
  paidAt: string | null
  notes: string | null
}

type RegisterHorsePurchaseWithLineageRow = {
  trade_id: string
  financial_transaction_id: string | null
  payment_status: RegisterHorseTradeResult['paymentStatus']
  paid_at: string | null
  horse_active: boolean
  horse_ownership_type: RegisterHorseTradeResult['horseOwnershipType']
}

export async function registerHorsePurchaseWithLineage(
  input: RegisterHorsePurchaseWithLineageInput,
): Promise<RegisterHorseTradeResult> {
  if (
    !input.lineageId
  ) {
    throw new Error(
      'Informe a linhagem do cavalo.',
    )
  }

  if (
    !Number.isFinite(
      input.amount,
    ) ||
    input.amount <=
      0
  ) {
    throw new Error(
      'Informe um valor de compra maior que zero.',
    )
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'register_horse_purchase_with_lineage',
    {
      p_horse_id:
        input.horseId,

      p_lineage_id:
        input.lineageId,

      p_amount:
        input.amount,

      p_trade_at:
        input.tradeAt,

      p_counterparty_client_id:
        input.counterpartyClientId,

      p_counterparty_name:
        input.counterpartyName
          ?.trim() ||
        null,

      p_paid:
        input.paid,

      p_paid_at:
        input.paid
          ? input.paidAt
          : null,

      p_notes:
        input.notes
          ?.trim() ||
        null,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao registrar compra: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | RegisterHorsePurchaseWithLineageRow
      | undefined

  if (!result) {
    throw new Error(
      'A compra foi processada, mas o banco não retornou o resultado esperado.',
    )
  }

  return {
    tradeId:
      result.trade_id,

    financialTransactionId:
      result.financial_transaction_id,

    paymentStatus:
      result.payment_status,

    paidAt:
      result.paid_at,

    horseActive:
      result.horse_active,

    horseOwnershipType:
      result.horse_ownership_type,
  }
}