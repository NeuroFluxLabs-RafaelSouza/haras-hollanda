import type {
  ConfirmMonthlyChargeResult,
  EnsureMonthlyChargesResult,
  FinancialCharge,
  FinancialChargeListItem,
  FinancialMonthSummary,
  FinancialTransaction,
} from '../../domain/finance.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

type Relation<T> =
  | T
  | T[]
  | null

type FinancialChargeRow = {
  id: string
  horse_id: string
  client_id: string
  competence_month: string
  due_date: string | null
  amount: number | string
  status: FinancialCharge['status']
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type HorseRelation = {
  id: string
  name: string
}

type ClientRelation = {
  id: string
  name: string
}

type ProfessionalRelation = {
  id: string
  name: string
}

type FinancialChargeListRow =
  FinancialChargeRow & {
    horse: Relation<HorseRelation>
    client: Relation<ClientRelation>
  }

type FinancialTransactionRow = {
  id: string

  transaction_type:
    FinancialTransaction['transactionType']

  source_type:
    FinancialTransaction['sourceType']

  charge_id: string | null
  horse_id: string | null
  client_id: string | null
  description: string
  amount: number | string
  occurred_at: string
  notes: string | null
  created_at: string
}

type AppointmentExpenseRow = {
  id: string
  title: string
  scheduled_at: string
  service_amount: number | string | null
  horse: Relation<HorseRelation>
  professional: Relation<ProfessionalRelation>
}

type AppointmentFinancialTransactionRow = {
  appointment_id: string | null
}

type EnsureMonthlyChargesRow = {
  generated_competence: string
  created_count: number | string
}

type ConfirmMonthlyChargeRow = {
  transaction_id: string
  charge_id: string
  amount: number | string
  paid_at: string
  already_paid: boolean
}

type FinancialMonthSummaryRow = {
  competence_month: string
  received_amount: number | string
  receivable_amount: number | string
  expense_amount: number | string
  balance_amount: number | string
  pending_charges_count: number | string
}

export type CreateManualFinancialExpenseInput = {
  description: string
  amount: number
  occurredAt: string
  notes?: string
}

export type PendingAppointmentExpense = {
  appointmentId: string
  title: string
  scheduledAt: string
  serviceAmount: number
  horseName: string
  professionalName: string | null
}

const financialChargeSelect = `
  id,
  horse_id,
  client_id,
  competence_month,
  due_date,
  amount,
  status,
  paid_at,
  notes,
  created_at,
  updated_at,
  horse:horses!inner (
    id,
    name
  ),
  client:clients!inner (
    id,
    name
  )
`

const financialTransactionSelect = `
  id,
  transaction_type,
  source_type,
  charge_id,
  horse_id,
  client_id,
  description,
  amount,
  occurred_at,
  notes,
  created_at
`

const pendingAppointmentSelect = `
  id,
  title,
  scheduled_at,
  service_amount,
  horse:horses (
    id,
    name
  ),
  professional:professionals (
    id,
    name
  )
`

function getSingleRelation<T>(
  relation: Relation<T>,
): T | null {
  if (!relation) {
    return null
  }

  if (
    Array.isArray(
      relation,
    )
  ) {
    return relation[0] ??
      null
  }

  return relation
}

function normalizeCompetenceMonth(
  value: string,
) {
  const match =
    value.match(
      /^(\d{4})-(\d{2})/,
    )

  if (!match) {
    throw new Error(
      'Competência financeira inválida.',
    )
  }

  const year =
    Number(
      match[1],
    )

  const month =
    Number(
      match[2],
    )

  if (
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      'Competência financeira inválida.',
    )
  }

  return `${year}-${String(
    month,
  ).padStart(
    2,
    '0',
  )}-01`
}

function getMonthDateRange(
  competenceMonth: string,
) {
  const normalized =
    normalizeCompetenceMonth(
      competenceMonth,
    )

  const [
    yearText,
    monthText,
  ] =
    normalized.split(
      '-',
    )

  const year =
    Number(
      yearText,
    )

  const monthIndex =
    Number(
      monthText,
    ) - 1

  const start =
    new Date(
      year,
      monthIndex,
      1,
      0,
      0,
      0,
      0,
    )

  const end =
    new Date(
      year,
      monthIndex + 1,
      1,
      0,
      0,
      0,
      0,
    )

  return {
    start:
      start.toISOString(),

    end:
      end.toISOString(),
  }
}

function mapFinancialCharge(
  row: FinancialChargeRow,
): FinancialCharge {
  return {
    id:
      row.id,

    horseId:
      row.horse_id,

    clientId:
      row.client_id,

    competenceMonth:
      row.competence_month,

    dueDate:
      row.due_date,

    amount:
      Number(
        row.amount,
      ),

    status:
      row.status,

    paidAt:
      row.paid_at,

    notes:
      row.notes,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

function mapFinancialChargeListItem(
  row: FinancialChargeListRow,
): FinancialChargeListItem {
  const horse =
    getSingleRelation(
      row.horse,
    )

  const client =
    getSingleRelation(
      row.client,
    )

  return {
    ...mapFinancialCharge(
      row,
    ),

    horseName:
      horse?.name ??
      'Cavalo não identificado',

    clientName:
      client?.name ??
      'Cliente não identificado',
  }
}

function mapFinancialTransaction(
  row: FinancialTransactionRow,
): FinancialTransaction {
  return {
    id:
      row.id,

    transactionType:
      row.transaction_type,

    sourceType:
      row.source_type,

    chargeId:
      row.charge_id,

    horseId:
      row.horse_id,

    clientId:
      row.client_id,

    description:
      row.description,

    amount:
      Number(
        row.amount,
      ),

    occurredAt:
      row.occurred_at,

    notes:
      row.notes,

    createdAt:
      row.created_at,
  }
}

function mapEnsureMonthlyChargesResult(
  row: EnsureMonthlyChargesRow,
): EnsureMonthlyChargesResult {
  return {
    generatedCompetence:
      row.generated_competence,

    createdCount:
      Number(
        row.created_count,
      ),
  }
}

function mapConfirmMonthlyChargeResult(
  row: ConfirmMonthlyChargeRow,
): ConfirmMonthlyChargeResult {
  return {
    transactionId:
      row.transaction_id,

    chargeId:
      row.charge_id,

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

function mapFinancialMonthSummary(
  row: FinancialMonthSummaryRow,
): FinancialMonthSummary {
  return {
    competenceMonth:
      row.competence_month,

    receivedAmount:
      Number(
        row.received_amount,
      ),

    receivableAmount:
      Number(
        row.receivable_amount,
      ),

    expenseAmount:
      Number(
        row.expense_amount,
      ),

    balanceAmount:
      Number(
        row.balance_amount,
      ),

    pendingChargesCount:
      Number(
        row.pending_charges_count,
      ),
  }
}

export async function ensureMonthlyFinancialCharges(
  competenceMonth: string,
): Promise<EnsureMonthlyChargesResult> {
  const normalizedCompetence =
    normalizeCompetenceMonth(
      competenceMonth,
    )

  const {
    data,
    error,
  } = await supabase.rpc(
    'ensure_monthly_financial_charges',
    {
      p_competence_month:
        normalizedCompetence,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao preparar mensalidades: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | EnsureMonthlyChargesRow
      | undefined

  if (!result) {
    throw new Error(
      'As mensalidades foram processadas, mas o banco não retornou o resultado esperado.',
    )
  }

  return mapEnsureMonthlyChargesResult(
    result,
  )
}

export async function getFinancialChargesByMonth(
  competenceMonth: string,
): Promise<FinancialChargeListItem[]> {
  const normalizedCompetence =
    normalizeCompetenceMonth(
      competenceMonth,
    )

  const {
    data,
    error,
  } = await supabase
    .from(
      'financial_charges',
    )
    .select(
      financialChargeSelect,
    )
    .eq(
      'competence_month',
      normalizedCompetence,
    )
    .order(
      'created_at',
      {
        ascending:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar mensalidades: ${error.message}`,
    )
  }

  return (
    data ??
    []
  )
    .map(
      (charge) =>
        mapFinancialChargeListItem(
          charge as FinancialChargeListRow,
        ),
    )
    .sort(
      (
        first,
        second,
      ) => {
        const clientComparison =
          first.clientName.localeCompare(
            second.clientName,
            'pt-BR',
          )

        if (
          clientComparison !==
          0
        ) {
          return clientComparison
        }

        return first.horseName.localeCompare(
          second.horseName,
          'pt-BR',
        )
      },
    )
}

export async function confirmMonthlyFinancialCharge(
  chargeId: string,
  receivedAt?: string,
  notes?: string,
): Promise<ConfirmMonthlyChargeResult> {
  const {
    data,
    error,
  } = await supabase.rpc(
    'confirm_monthly_financial_charge',
    {
      p_charge_id:
        chargeId,

      p_received_at:
        receivedAt ??
        new Date().toISOString(),

      p_notes:
        notes?.trim() ||
        null,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao confirmar recebimento: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | ConfirmMonthlyChargeRow
      | undefined

  if (!result) {
    throw new Error(
      'O recebimento foi processado, mas o banco não retornou o resultado esperado.',
    )
  }

  return mapConfirmMonthlyChargeResult(
    result,
  )
}

export async function createManualFinancialExpense(
  input: CreateManualFinancialExpenseInput,
): Promise<FinancialTransaction> {
  const description =
    input.description.trim()

  const notes =
    input.notes?.trim() ||
    null

  if (!description) {
    throw new Error(
      'Informe a descrição da despesa.',
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
      'Informe um valor de despesa maior que zero.',
    )
  }

  const occurredAt =
    new Date(
      input.occurredAt,
    )

  if (
    Number.isNaN(
      occurredAt.getTime(),
    )
  ) {
    throw new Error(
      'Informe uma data válida para a despesa.',
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'financial_transactions',
    )
    .insert({
      transaction_type:
        'expense',

      source_type:
        'manual',

      charge_id:
        null,

      horse_id:
        null,

      client_id:
        null,

      description,

      amount:
        input.amount,

      occurred_at:
        input.occurredAt,

      notes,
    })
    .select(
      financialTransactionSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao registrar despesa: ${error.message}`,
    )
  }

  return mapFinancialTransaction(
    data as FinancialTransactionRow,
  )
}

export async function getFinancialMonthSummary(
  competenceMonth: string,
): Promise<FinancialMonthSummary> {
  const normalizedCompetence =
    normalizeCompetenceMonth(
      competenceMonth,
    )

  const {
    data,
    error,
  } = await supabase.rpc(
    'get_financial_month_summary',
    {
      p_competence_month:
        normalizedCompetence,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao calcular resumo financeiro: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | FinancialMonthSummaryRow
      | undefined

  if (!result) {
    throw new Error(
      'O resumo financeiro não retornou os dados esperados.',
    )
  }

  return mapFinancialMonthSummary(
    result,
  )
}

export async function getFinancialTransactionsByMonth(
  competenceMonth: string,
): Promise<FinancialTransaction[]> {
  const {
    start,
    end,
  } =
    getMonthDateRange(
      competenceMonth,
    )

  const {
    data,
    error,
  } = await supabase
    .from(
      'financial_transactions',
    )
    .select(
      financialTransactionSelect,
    )
    .gte(
      'occurred_at',
      start,
    )
    .lt(
      'occurred_at',
      end,
    )
    .order(
      'occurred_at',
      {
        ascending:
          false,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar movimentações financeiras: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (transaction) =>
      mapFinancialTransaction(
        transaction as FinancialTransactionRow,
      ),
  )
}

export async function getPendingAppointmentExpenses(): Promise<
  PendingAppointmentExpense[]
> {
  const {
    data: appointmentData,
    error: appointmentError,
  } = await supabase
    .from(
      'appointments',
    )
    .select(
      pendingAppointmentSelect,
    )
    .eq(
      'status',
      'completed',
    )
    .not(
      'service_amount',
      'is',
      null,
    )
    .gt(
      'service_amount',
      0,
    )
    .order(
      'scheduled_at',
      {
        ascending:
          true,
      },
    )

  if (appointmentError) {
    throw new Error(
      `Erro ao buscar serviços aguardando pagamento: ${appointmentError.message}`,
    )
  }

  const appointments =
    (
      appointmentData ??
      []
    ) as AppointmentExpenseRow[]

  if (
    appointments.length ===
    0
  ) {
    return []
  }

  const appointmentIds =
    appointments.map(
      (appointment) =>
        appointment.id,
    )

  const {
    data: transactionData,
    error: transactionError,
  } = await supabase
    .from(
      'financial_transactions',
    )
    .select(
      'appointment_id',
    )
    .eq(
      'source_type',
      'appointment',
    )
    .in(
      'appointment_id',
      appointmentIds,
    )

  if (transactionError) {
    throw new Error(
      `Erro ao verificar pagamentos da Agenda: ${transactionError.message}`,
    )
  }

  const paidAppointmentIds =
    new Set(
      (
        transactionData ??
        []
      )
        .map(
          (transaction) =>
            (
              transaction as AppointmentFinancialTransactionRow
            ).appointment_id,
        )
        .filter(
          (
            appointmentId,
          ): appointmentId is string =>
            appointmentId !==
            null,
        ),
    )

  return appointments
    .filter(
      (appointment) =>
        !paidAppointmentIds.has(
          appointment.id,
        ),
    )
    .map(
      (appointment) => {
        const horse =
          getSingleRelation(
            appointment.horse,
          )

        const professional =
          getSingleRelation(
            appointment.professional,
          )

        return {
          appointmentId:
            appointment.id,

          title:
            appointment.title,

          scheduledAt:
            appointment.scheduled_at,

          serviceAmount:
            Number(
              appointment.service_amount,
            ),

          horseName:
            horse?.name ??
            'Cavalo não identificado',

          professionalName:
            professional?.name ??
            null,
        }
      },
    )
}

export async function loadFinancialMonth(
  competenceMonth: string,
) {
  await ensureMonthlyFinancialCharges(
    competenceMonth,
  )

  const [
    summary,
    charges,
    transactions,
    pendingAppointmentExpenses,
  ] = await Promise.all([
    getFinancialMonthSummary(
      competenceMonth,
    ),

    getFinancialChargesByMonth(
      competenceMonth,
    ),

    getFinancialTransactionsByMonth(
      competenceMonth,
    ),

    getPendingAppointmentExpenses(),
  ])

  return {
    summary,
    charges,
    transactions,
    pendingAppointmentExpenses,
  }
}