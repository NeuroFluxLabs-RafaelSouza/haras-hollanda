import type {
  HorseSex,
} from '../../domain/horse.ts'

import type {
  ConfirmHorseTradePaymentResult,
  HorseTrade,
  HorseTradePaymentStatus,
  HorseTradeType,
  RegisterHorseTradeInput,
  RegisterHorseTradeResult,
} from '../../domain/horseTrade.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

export type HorseOwnershipType =
  | 'client'
  | 'haras'

export type CreateHorseWithOptionalPurchaseInput = {
  name: string
  breed: string
  sex: HorseSex
  birthDate: string | null
  ownershipType: HorseOwnershipType
  clientId: string | null
  stallId: string | null
  monthlyFee: number | null
  registerPurchase: boolean
  purchaseAmount: number | null
  purchaseAt: string | null
  sellerClientId?: string | null
  sellerName: string | null
  purchasePaid: boolean
  purchasePaidAt: string | null
  purchaseNotes?: string | null
}

export type CreateHorseWithOptionalPurchaseResult = {
  horseId: string
  tradeId: string | null
  financialTransactionId: string | null
}

type HorseTradeRow = {
  id: string
  horse_id: string
  trade_type: HorseTradeType
  amount: number | string
  trade_at: string
  counterparty_client_id: string | null
  counterparty_name: string | null
  payment_status: HorseTradePaymentStatus
  paid_at: string | null
  keeps_boarding: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
}

type RegisterHorseTradeRow = {
  trade_id: string
  financial_transaction_id: string | null
  payment_status: HorseTradePaymentStatus
  paid_at: string | null
  horse_active: boolean
  horse_ownership_type:
    | 'client'
    | 'haras'
}

type ConfirmHorseTradePaymentRow = {
  trade_id: string
  financial_transaction_id: string
  amount: number | string
  paid_at: string
  already_paid: boolean
}

type CreateHorseWithOptionalPurchaseRow = {
  horse_id: string
  trade_id: string | null
  financial_transaction_id: string | null
}

const horseTradeSelect = `
  id,
  horse_id,
  trade_type,
  amount,
  trade_at,
  counterparty_client_id,
  counterparty_name,
  payment_status,
  paid_at,
  keeps_boarding,
  notes,
  created_at,
  updated_at
`

function mapHorseTrade(
  row: HorseTradeRow,
): HorseTrade {
  return {
    id:
      row.id,

    horseId:
      row.horse_id,

    tradeType:
      row.trade_type,

    amount:
      Number(
        row.amount,
      ),

    tradeAt:
      row.trade_at,

    counterpartyClientId:
      row.counterparty_client_id,

    counterpartyName:
      row.counterparty_name,

    paymentStatus:
      row.payment_status,

    paidAt:
      row.paid_at,

    keepsBoarding:
      row.keeps_boarding,

    notes:
      row.notes,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

function mapRegisterHorseTradeResult(
  row: RegisterHorseTradeRow,
): RegisterHorseTradeResult {
  return {
    tradeId:
      row.trade_id,

    financialTransactionId:
      row.financial_transaction_id,

    paymentStatus:
      row.payment_status,

    paidAt:
      row.paid_at,

    horseActive:
      row.horse_active,

    horseOwnershipType:
      row.horse_ownership_type,
  }
}

function mapConfirmHorseTradePaymentResult(
  row: ConfirmHorseTradePaymentRow,
): ConfirmHorseTradePaymentResult {
  return {
    tradeId:
      row.trade_id,

    financialTransactionId:
      row.financial_transaction_id,

    amount:
      Number(
        row.amount,
      ),

    paidAt:
      row.paid_at,

    alreadyPaid:
      row.already_paid,
  }
}

function mapCreateHorseWithOptionalPurchaseResult(
  row: CreateHorseWithOptionalPurchaseRow,
): CreateHorseWithOptionalPurchaseResult {
  return {
    horseId:
      row.horse_id,

    tradeId:
      row.trade_id,

    financialTransactionId:
      row.financial_transaction_id,
  }
}

function validateTradeInput(
  input: RegisterHorseTradeInput,
) {
  if (
    !Number.isFinite(
      input.amount,
    ) ||
    input.amount <=
      0
  ) {
    throw new Error(
      'Informe um valor maior que zero.',
    )
  }

  const tradeDate =
    new Date(
      input.tradeAt,
    )

  if (
    Number.isNaN(
      tradeDate.getTime(),
    )
  ) {
    throw new Error(
      'Informe uma data válida para a operação.',
    )
  }

  const counterpartyName =
    input.counterpartyName
      ?.trim() ??
    ''

  if (
    !input.counterpartyClientId &&
    !counterpartyName
  ) {
    throw new Error(
      'Informe com quem a operação foi realizada.',
    )
  }

  if (
    input.tradeType ===
      'sale' &&
    input.keepsBoarding ==
      null
  ) {
    throw new Error(
      'Informe se o cavalo continuará hospedado no Haras.',
    )
  }

  if (
    input.tradeType ===
      'sale' &&
    input.keepsBoarding ===
      true &&
    !input.counterpartyClientId
  ) {
    throw new Error(
      'Para continuar hospedado, selecione o comprador cadastrado como cliente.',
    )
  }

  if (
    input.monthlyFee !==
      undefined &&
    input.monthlyFee !==
      null &&
    (
      !Number.isFinite(
        input.monthlyFee,
      ) ||
      input.monthlyFee <
        0
    )
  ) {
    throw new Error(
      'Informe uma mensalidade válida.',
    )
  }
}

function validateHorseCreationInput(
  input: CreateHorseWithOptionalPurchaseInput,
) {
  if (
    !input.name.trim()
  ) {
    throw new Error(
      'Informe o nome do cavalo.',
    )
  }

  if (
    !input.breed.trim()
  ) {
    throw new Error(
      'Informe a raça do cavalo.',
    )
  }

  if (
    input.birthDate
  ) {
    const birthDate =
      new Date(
        `${input.birthDate}T12:00:00`,
      )

    if (
      Number.isNaN(
        birthDate.getTime(),
      )
    ) {
      throw new Error(
        'Informe uma data de nascimento válida.',
      )
    }

    const today =
      new Date()

    today.setHours(
      23,
      59,
      59,
      999,
    )

    if (
      birthDate >
      today
    ) {
      throw new Error(
        'A data de nascimento não pode estar no futuro.',
      )
    }
  }

  if (
    input.ownershipType ===
      'client' &&
    !input.clientId
  ) {
    throw new Error(
      'Selecione o cliente responsável.',
    )
  }

  if (
    input.monthlyFee !==
      null &&
    (
      !Number.isFinite(
        input.monthlyFee,
      ) ||
      input.monthlyFee <
        0
    )
  ) {
    throw new Error(
      'Informe uma mensalidade válida.',
    )
  }

  if (
    input.ownershipType ===
      'client' &&
    input.registerPurchase
  ) {
    throw new Error(
      'A compra só pode ser registrada para um cavalo do Haras.',
    )
  }

  if (
    input.ownershipType ===
      'haras' &&
    input.registerPurchase
  ) {
    if (
      input.purchaseAmount ===
        null ||
      !Number.isFinite(
        input.purchaseAmount,
      ) ||
      input.purchaseAmount <=
        0
    ) {
      throw new Error(
        'Informe o valor da compra.',
      )
    }

    if (
      !input.purchaseAt
    ) {
      throw new Error(
        'Informe a data da compra.',
      )
    }

    if (
      !input.sellerClientId &&
      !input.sellerName?.trim()
    ) {
      throw new Error(
        'Informe de quem o cavalo foi comprado.',
      )
    }
  }
}

export async function createHorseWithOptionalPurchase(
  input: CreateHorseWithOptionalPurchaseInput,
): Promise<CreateHorseWithOptionalPurchaseResult> {
  validateHorseCreationInput(
    input,
  )

  const {
    data,
    error,
  } = await supabase.rpc(
    'create_horse_with_optional_purchase',
    {
      p_name:
        input.name.trim(),

      p_breed:
        input.breed.trim(),

      p_sex:
        input.sex,

      p_ownership_type:
        input.ownershipType,

      p_birth_date:
        input.birthDate,

      p_client_id:
        input.ownershipType ===
        'client'
          ? input.clientId
          : null,

      p_stall_id:
        input.stallId,

      p_monthly_fee:
        input.ownershipType ===
        'client'
          ? input.monthlyFee
          : null,

      p_register_purchase:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase,

      p_purchase_amount:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase
          ? input.purchaseAmount
          : null,

      p_purchase_at:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase
          ? input.purchaseAt
          : null,

      p_seller_client_id:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase
          ? input.sellerClientId ??
            null
          : null,

      p_seller_name:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase
          ? input.sellerName
              ?.trim() ||
            null
          : null,

      p_purchase_paid:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase
          ? input.purchasePaid
          : false,

      p_purchase_paid_at:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase &&
        input.purchasePaid
          ? input.purchasePaidAt
          : null,

      p_purchase_notes:
        input.ownershipType ===
          'haras' &&
        input.registerPurchase
          ? input.purchaseNotes
              ?.trim() ||
            null
          : null,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao cadastrar cavalo: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | CreateHorseWithOptionalPurchaseRow
      | undefined

  if (!result) {
    throw new Error(
      'O cavalo foi processado, mas o banco não retornou o resultado esperado.',
    )
  }

  return mapCreateHorseWithOptionalPurchaseResult(
    result,
  )
}

export async function registerHorseTrade(
  input: RegisterHorseTradeInput,
): Promise<RegisterHorseTradeResult> {
  validateTradeInput(
    input,
  )

  const {
    data,
    error,
  } = await supabase.rpc(
    'register_horse_trade',
    {
      p_horse_id:
        input.horseId,

      p_trade_type:
        input.tradeType,

      p_amount:
        input.amount,

      p_trade_at:
        input.tradeAt,

      p_counterparty_client_id:
        input.counterpartyClientId ??
        null,

      p_counterparty_name:
        input.counterpartyName
          ?.trim() ||
        null,

      p_paid:
        input.paid,

      p_paid_at:
        input.paid
          ? input.paidAt ??
            null
          : null,

      p_keeps_boarding:
        input.tradeType ===
        'sale'
          ? input.keepsBoarding ??
            null
          : null,

      p_monthly_fee:
        input.tradeType ===
          'sale' &&
        input.keepsBoarding
          ? input.monthlyFee ??
            null
          : null,

      p_notes:
        input.notes
          ?.trim() ||
        null,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao registrar operação: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | RegisterHorseTradeRow
      | undefined

  if (!result) {
    throw new Error(
      'A operação foi processada, mas o banco não retornou o resultado esperado.',
    )
  }

  return mapRegisterHorseTradeResult(
    result,
  )
}

export async function confirmHorseTradePayment(
  tradeId: string,
  paidAt?: string,
): Promise<ConfirmHorseTradePaymentResult> {
  const {
    data,
    error,
  } = await supabase.rpc(
    'confirm_horse_trade_payment',
    {
      p_trade_id:
        tradeId,

      p_paid_at:
        paidAt ??
        new Date().toISOString(),
    },
  )

  if (error) {
    throw new Error(
      `Erro ao confirmar pagamento: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | ConfirmHorseTradePaymentRow
      | undefined

  if (!result) {
    throw new Error(
      'O pagamento foi processado, mas o banco não retornou o resultado esperado.',
    )
  }

  return mapConfirmHorseTradePaymentResult(
    result,
  )
}

export async function getHorseTradesByHorseId(
  horseId: string,
): Promise<HorseTrade[]> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'horse_trades',
    )
    .select(
      horseTradeSelect,
    )
    .eq(
      'horse_id',
      horseId,
    )
    .order(
      'trade_at',
      {
        ascending:
          false,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao carregar histórico comercial: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (trade) =>
      mapHorseTrade(
        trade as HorseTradeRow,
      ),
  )
}

export async function getPendingHorseTrades(): Promise<
  HorseTrade[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'horse_trades',
    )
    .select(
      horseTradeSelect,
    )
    .eq(
      'payment_status',
      'pending',
    )
    .order(
      'trade_at',
      {
        ascending:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao carregar operações pendentes: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (trade) =>
      mapHorseTrade(
        trade as HorseTradeRow,
      ),
  )
}