import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  Plus,
  ReceiptText,
  SlidersHorizontal,
  TrendingDown,
  WalletCards,
  X,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  MoneyInput,
} from '../../components/ui/MoneyInput.tsx'

import {
  FINANCIAL_TRANSACTION_SOURCE_LABELS,
  type FinancialChargeListItem,
  type FinancialMonthSummary,
  type FinancialTransaction,
} from '../../domain/finance.ts'

import {
  confirmMonthlyFinancialCharge,
  createManualFinancialExpense,
  loadFinancialMonth,
  type PendingAppointmentExpense,
} from './financeService.ts'

import './FinancePage.css'

type ChargeVisualStatus =
  | 'pending'
  | 'dueToday'
  | 'overdue'
  | 'paid'
  | 'cancelled'

type TransactionTypeFilter =
  | 'all'
  | FinancialTransaction['transactionType']

type TransactionSourceFilter =
  | 'all'
  | 'monthly_fee'
  | 'appointment'
  | 'inventory_purchase'
  | 'manual'

type TransactionGroup = {
  dateKey: string
  dateLabel: string
  transactions: FinancialTransaction[]
}

const TRANSACTION_SOURCE_FILTER_LABELS: Record<
  TransactionSourceFilter,
  string
> = {
  all:
    'Todas as origens',

  monthly_fee:
    'Mensalidades',

  appointment:
    'Agenda',

  inventory_purchase:
    'Estoque',

  manual:
    'Avulsas',
}

function getCompetenceFromDate(
  date: Date,
) {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-01`
}

function getCurrentCompetence() {
  return getCompetenceFromDate(
    new Date(),
  )
}

function shiftCompetence(
  competenceMonth: string,
  amount: number,
) {
  const [
    yearText,
    monthText,
  ] =
    competenceMonth
      .slice(
        0,
        7,
      )
      .split(
        '-',
      )

  const date =
    new Date(
      Number(
        yearText,
      ),
      Number(
        monthText,
      ) -
        1 +
        amount,
      1,
    )

  return getCompetenceFromDate(
    date,
  )
}

function getCurrentDateInputValue() {
  const today =
    new Date()

  const year =
    today.getFullYear()

  const month =
    String(
      today.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      today.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style:
        'currency',

      currency:
        'BRL',
    },
  ).format(
    value,
  )
}

function formatCompetence(
  competenceMonth: string,
) {
  const [
    year,
    month,
  ] =
    competenceMonth
      .slice(
        0,
        7,
      )
      .split(
        '-',
      )

  const monthName =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        month:
          'long',
      },
    ).format(
      new Date(
        Number(
          year,
        ),
        Number(
          month,
        ) - 1,
        1,
      ),
    )

  return `${monthName.charAt(
    0,
  ).toUpperCase()}${monthName.slice(
    1,
  )} de ${year}`
}

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  ).format(
    new Date(
      value,
    ),
  )
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',
    },
  ).format(
    new Date(
      value,
    ),
  )
}

function formatDateOnly(
  value: string,
) {
  const [
    yearText,
    monthText,
    dayText,
  ] =
    value
      .slice(
        0,
        10,
      )
      .split(
        '-',
      )

  const date =
    new Date(
      Number(
        yearText,
      ),
      Number(
        monthText,
      ) - 1,
      Number(
        dayText,
      ),
    )

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',
    },
  ).format(
    date,
  )
}

function getTransactionDateKey(
  value: string,
) {
  const date =
    new Date(
      value,
    )

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

function formatTransactionDay(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        'long',
    },
  )
    .format(
      new Date(
        value,
      ),
    )
    .toUpperCase()
}

function matchesTransactionSourceFilter(
  transaction: FinancialTransaction,
  filter: TransactionSourceFilter,
) {
  if (
    filter ===
    'all'
  ) {
    return true
  }

  if (
    filter ===
    'manual'
  ) {
    return (
      transaction.sourceType ===
        'manual' ||
      transaction.sourceType ===
        'adjustment'
    )
  }

  return (
    transaction.sourceType ===
    filter
  )
}

function getChargeVisualStatus(
  charge: FinancialChargeListItem,
  today: string,
): ChargeVisualStatus {
  if (
    charge.status ===
    'paid'
  ) {
    return 'paid'
  }

  if (
    charge.status ===
    'cancelled'
  ) {
    return 'cancelled'
  }

  if (
    !charge.dueDate
  ) {
    return 'pending'
  }

  const dueDate =
    charge.dueDate.slice(
      0,
      10,
    )

  if (
    dueDate <
    today
  ) {
    return 'overdue'
  }

  if (
    dueDate ===
    today
  ) {
    return 'dueToday'
  }

  return 'pending'
}

function getChargeStatusClass(
  status: ChargeVisualStatus,
) {
  if (
    status ===
    'dueToday'
  ) {
    return 'due-today'
  }

  return status
}

function getChargeStatusLabel(
  status: ChargeVisualStatus,
) {
  const labels: Record<
    ChargeVisualStatus,
    string
  > = {
    pending:
      'Pendente',

    dueToday:
      'Vence hoje',

    overdue:
      'Em atraso',

    paid:
      'Pago',

    cancelled:
      'Cancelada',
  }

  return labels[
    status
  ]
}

function getChargeStatusDetail(
  charge: FinancialChargeListItem,
  today: string,
) {
  const status =
    getChargeVisualStatus(
      charge,
      today,
    )

  if (
    status ===
    'paid'
  ) {
    if (
      charge.paidAt
    ) {
      return `Recebido em ${formatDateTime(
        charge.paidAt,
      )}`
    }

    return 'Recebimento confirmado'
  }

  if (
    status ===
    'cancelled'
  ) {
    return 'Cobrança cancelada'
  }

  if (
    !charge.dueDate
  ) {
    return 'Vencimento não definido'
  }

  if (
    status ===
    'overdue'
  ) {
    return `Venceu em ${formatDateOnly(
      charge.dueDate,
    )}`
  }

  if (
    status ===
    'dueToday'
  ) {
    return `Vence hoje · ${formatDateOnly(
      charge.dueDate,
    )}`
  }

  return `Vence em ${formatDateOnly(
    charge.dueDate,
  )}`
}

function ChargeStatusIcon({
  status,
}: {
  status: ChargeVisualStatus
}) {
  if (
    status ===
    'paid'
  ) {
    return (
      <CheckCircle2
        size={18}
        strokeWidth={1.8}
      />
    )
  }

  if (
    status ===
    'cancelled'
  ) {
    return (
      <CircleX
        size={18}
        strokeWidth={1.8}
      />
    )
  }

  if (
    status ===
    'overdue'
  ) {
    return (
      <AlertTriangle
        size={18}
        strokeWidth={1.8}
      />
    )
  }

  if (
    status ===
    'dueToday'
  ) {
    return (
      <CalendarClock
        size={18}
        strokeWidth={1.8}
      />
    )
  }

  return (
    <Clock3
      size={18}
      strokeWidth={1.8}
    />
  )
}

function sortCharges(
  charges: FinancialChargeListItem[],
  today: string,
) {
  const statusPriority: Record<
    ChargeVisualStatus,
    number
  > = {
    overdue:
      0,

    dueToday:
      1,

    pending:
      2,

    paid:
      3,

    cancelled:
      4,
  }

  return [
    ...charges,
  ].sort(
    (
      first,
      second,
    ) => {
      const firstStatus =
        getChargeVisualStatus(
          first,
          today,
        )

      const secondStatus =
        getChargeVisualStatus(
          second,
          today,
        )

      const statusDifference =
        statusPriority[
          firstStatus
        ] -
        statusPriority[
          secondStatus
        ]

      if (
        statusDifference !==
        0
      ) {
        return statusDifference
      }

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

function groupTransactionsByDay(
  transactions: FinancialTransaction[],
): TransactionGroup[] {
  const groups =
    new Map<
      string,
      TransactionGroup
    >()

  transactions.forEach(
    (transaction) => {
      const dateKey =
        getTransactionDateKey(
          transaction.occurredAt,
        )

      const existingGroup =
        groups.get(
          dateKey,
        )

      if (
        existingGroup
      ) {
        existingGroup.transactions.push(
          transaction,
        )

        return
      }

      groups.set(
        dateKey,
        {
          dateKey,

          dateLabel:
            formatTransactionDay(
              transaction.occurredAt,
            ),

          transactions: [
            transaction,
          ],
        },
      )
    },
  )

  return Array.from(
    groups.values(),
  )
}

export function FinancePage() {
  const currentCompetence =
    getCurrentCompetence()

  const today =
    getCurrentDateInputValue()

  const [
    competence,
    setCompetence,
  ] = useState(
    () =>
      getCurrentCompetence(),
  )

  const [
    summary,
    setSummary,
  ] = useState<
    FinancialMonthSummary | null
  >(null)

  const [
    charges,
    setCharges,
  ] = useState<
    FinancialChargeListItem[]
  >([])

  const [
    transactions,
    setTransactions,
  ] = useState<
    FinancialTransaction[]
  >([])

  const [
    pendingAppointmentExpenses,
    setPendingAppointmentExpenses,
  ] = useState<
    PendingAppointmentExpense[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  )

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    processingChargeId,
    setProcessingChargeId,
  ] = useState<
    string | null
  >(null)

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null)

  const [
    expenseFormOpen,
    setExpenseFormOpen,
  ] = useState(
    false,
  )

  const [
    expenseDescription,
    setExpenseDescription,
  ] = useState(
    '',
  )

  const [
    expenseAmount,
    setExpenseAmount,
  ] = useState(
    0,
  )

  const [
    expenseDate,
    setExpenseDate,
  ] = useState(
    today,
  )

  const [
    expenseNotes,
    setExpenseNotes,
  ] = useState(
    '',
  )

  const [
    savingExpense,
    setSavingExpense,
  ] = useState(
    false,
  )

  const [
    transactionTypeFilter,
    setTransactionTypeFilter,
  ] = useState<TransactionTypeFilter>(
    'all',
  )

  const [
    transactionSourceFilter,
    setTransactionSourceFilter,
  ] = useState<TransactionSourceFilter>(
    'all',
  )

  const [
    sourceFilterOpen,
    setSourceFilterOpen,
  ] = useState(
    false,
  )

  const isCurrentCompetence =
    competence ===
    currentCompetence

  const canGoNext =
    competence <
    currentCompetence

  const loadFinance =
    useCallback(
      async () => {
        try {
          setLoading(
            true,
          )

          setError(
            null,
          )

          const data =
            await loadFinancialMonth(
              competence,
            )

          setSummary(
            data.summary,
          )

          setCharges(
            data.charges,
          )

          setTransactions(
            data.transactions,
          )

          setPendingAppointmentExpenses(
            data.pendingAppointmentExpenses,
          )
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o financeiro.'

          setError(
            message,
          )
        } finally {
          setLoading(
            false,
          )
        }
      },
      [
        competence,
      ],
    )

  useEffect(() => {
    let isMounted =
      true

    async function load() {
      try {
        setLoading(
          true,
        )

        setError(
          null,
        )

        const data =
          await loadFinancialMonth(
            competence,
          )

        if (
          !isMounted
        ) {
          return
        }

        setSummary(
          data.summary,
        )

        setCharges(
          data.charges,
        )

        setTransactions(
          data.transactions,
        )

        setPendingAppointmentExpenses(
          data.pendingAppointmentExpenses,
        )
      } catch (error) {
        if (
          !isMounted
        ) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o financeiro.'

        setError(
          message,
        )
      } finally {
        if (
          isMounted
        ) {
          setLoading(
            false,
          )
        }
      }
    }

    load()

    return () => {
      isMounted =
        false
    }
  }, [
    competence,
  ])

  const sortedCharges =
    useMemo(
      () =>
        sortCharges(
          charges,
          today,
        ),
      [
        charges,
        today,
      ],
    )

  const pendingCharges =
    useMemo(
      () =>
        charges.filter(
          (charge) =>
            charge.status ===
            'pending',
        ),
      [
        charges,
      ],
    )

  const overdueCharges =
    useMemo(
      () =>
        charges.filter(
          (charge) =>
            getChargeVisualStatus(
              charge,
              today,
            ) ===
            'overdue',
        ),
      [
        charges,
        today,
      ],
    )

  const dueTodayCharges =
    useMemo(
      () =>
        charges.filter(
          (charge) =>
            getChargeVisualStatus(
              charge,
              today,
            ) ===
            'dueToday',
        ),
      [
        charges,
        today,
      ],
    )

  const urgentMonthlyCharges =
    useMemo(
      () =>
        charges.filter(
          (charge) => {
            const status =
              getChargeVisualStatus(
                charge,
                today,
              )

            return (
              status ===
                'overdue' ||
              status ===
                'dueToday'
            )
          },
        ),
      [
        charges,
        today,
      ],
    )

  const urgentMonthlyAmount =
    useMemo(
      () =>
        urgentMonthlyCharges.reduce(
          (
            total,
            charge,
          ) =>
            total +
            charge.amount,
          0,
        ),
      [
        urgentMonthlyCharges,
      ],
    )

  const pendingAppointmentAmount =
    useMemo(
      () =>
        pendingAppointmentExpenses.reduce(
          (
            total,
            appointment,
          ) =>
            total +
            appointment.serviceAmount,
          0,
        ),
      [
        pendingAppointmentExpenses,
      ],
    )

  const filteredTransactions =
    useMemo(
      () =>
        transactions.filter(
          (transaction) => {
            const matchesType =
              transactionTypeFilter ===
                'all' ||
              transaction.transactionType ===
                transactionTypeFilter

            const matchesSource =
              matchesTransactionSourceFilter(
                transaction,
                transactionSourceFilter,
              )

            return (
              matchesType &&
              matchesSource
            )
          },
        ),
      [
        transactions,
        transactionTypeFilter,
        transactionSourceFilter,
      ],
    )

  const transactionGroups =
    useMemo(
      () =>
        groupTransactionsByDay(
          filteredTransactions,
        ),
      [
        filteredTransactions,
      ],
    )

  const attentionCount =
    urgentMonthlyCharges.length +
    pendingAppointmentExpenses.length

  const transactionEmptyMessage =
    useMemo(
      () => {
        if (
          transactionTypeFilter ===
            'all' &&
          transactionSourceFilter ===
            'all'
        ) {
          return 'Não há entradas ou saídas de caixa registradas nesta competência.'
        }

        if (
          transactionTypeFilter ===
          'income'
        ) {
          return 'Nenhuma entrada corresponde aos filtros selecionados.'
        }

        if (
          transactionTypeFilter ===
          'expense'
        ) {
          return 'Nenhuma despesa corresponde aos filtros selecionados.'
        }

        return 'Nenhuma movimentação corresponde aos filtros selecionados.'
      },
      [
        transactionTypeFilter,
        transactionSourceFilter,
      ],
    )

  function changeCompetence(
    nextCompetence: string,
  ) {
    setCompetence(
      nextCompetence,
    )

    setExpenseFormOpen(
      false,
    )

    setTransactionTypeFilter(
      'all',
    )

    setTransactionSourceFilter(
      'all',
    )

    setSourceFilterOpen(
      false,
    )

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  function handlePreviousMonth() {
    changeCompetence(
      shiftCompetence(
        competence,
        -1,
      ),
    )
  }

  function handleNextMonth() {
    if (
      !canGoNext
    ) {
      return
    }

    changeCompetence(
      shiftCompetence(
        competence,
        1,
      ),
    )
  }

  function handleCurrentMonth() {
    changeCompetence(
      currentCompetence,
    )
  }

  function handleToggleExpenseForm() {
    if (
      !isCurrentCompetence
    ) {
      return
    }

    setExpenseFormOpen(
      (
        currentValue,
      ) =>
        !currentValue,
    )

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  function handleTransactionSourceFilter(
    filter: TransactionSourceFilter,
  ) {
    setTransactionSourceFilter(
      filter,
    )

    setTransactionTypeFilter(
      'all',
    )

    setSourceFilterOpen(
      false,
    )
  }

  async function handleCreateExpense(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const description =
      expenseDescription.trim()

    if (!description) {
      setError(
        'Informe a descrição da despesa.',
      )

      return
    }

    if (
      !Number.isFinite(
        expenseAmount,
      ) ||
      expenseAmount <=
        0
    ) {
      setError(
        'Informe um valor de despesa maior que zero.',
      )

      return
    }

    if (!expenseDate) {
      setError(
        'Informe a data da despesa.',
      )

      return
    }

    if (
      expenseDate.slice(
        0,
        7,
      ) !==
      currentCompetence.slice(
        0,
        7,
      )
    ) {
      setError(
        'A despesa avulsa precisa pertencer ao mês atual.',
      )

      return
    }

    if (
      expenseDate >
      today
    ) {
      setError(
        'A data da despesa não pode estar no futuro.',
      )

      return
    }

    try {
      setSavingExpense(
        true,
      )

      setError(
        null,
      )

      setSuccessMessage(
        null,
      )

      const occurredAt =
        new Date(
          `${expenseDate}T12:00:00`,
        ).toISOString()

      await createManualFinancialExpense({
        description,

        amount:
          expenseAmount,

        occurredAt,

        notes:
          expenseNotes,
      })

      setExpenseDescription(
        '',
      )

      setExpenseAmount(
        0,
      )

      setExpenseDate(
        today,
      )

      setExpenseNotes(
        '',
      )

      setExpenseFormOpen(
        false,
      )

      setSuccessMessage(
        `Despesa de ${formatCurrency(
          expenseAmount,
        )} registrada como "${description}".`,
      )

      await loadFinance()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a despesa.'

      setError(
        message,
      )
    } finally {
      setSavingExpense(
        false,
      )
    }
  }

  async function handleConfirmPayment(
    charge: FinancialChargeListItem,
  ) {
    if (
      processingChargeId
    ) {
      return
    }

    try {
      setProcessingChargeId(
        charge.id,
      )

      setError(
        null,
      )

      setSuccessMessage(
        null,
      )

      const result =
        await confirmMonthlyFinancialCharge(
          charge.id,
        )

      if (
        result.alreadyPaid
      ) {
        setSuccessMessage(
          `A mensalidade de ${charge.horseName} já estava registrada como recebida.`,
        )
      } else if (
        isCurrentCompetence
      ) {
        setSuccessMessage(
          `Recebimento de ${formatCurrency(
            result.amount,
          )} confirmado para ${charge.horseName}.`,
        )
      } else {
        setSuccessMessage(
          `A mensalidade antiga de ${charge.horseName} foi recebida agora. A entrada foi registrada no caixa da data atual.`,
        )
      }

      await loadFinance()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível confirmar o recebimento.'

      setError(
        message,
      )
    } finally {
      setProcessingChargeId(
        null,
      )
    }
  }

  return (
    <section className="finance-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Gestão financeira
        </p>

        <h1 className="page-header__title">
          Financeiro
        </h1>

        <p className="page-header__description">
          Veja o que realmente entrou, o que saiu e o que ainda precisa da sua
          atenção sem repetir lançamentos.
        </p>
      </header>

      <div className="finance-period">
        <div className="finance-period__navigation">
          <button
            type="button"
            className="finance-period__nav-button"
            onClick={
              handlePreviousMonth
            }
            aria-label="Ver mês anterior"
          >
            <ChevronLeft
              size={17}
            />
          </button>

          <div className="finance-period__competence">
            <span className="finance-period__eyebrow">
              {isCurrentCompetence
                ? 'Competência atual'
                : 'Histórico financeiro'}
            </span>

            <strong>
              {formatCompetence(
                competence,
              )}
            </strong>
          </div>

          <button
            type="button"
            className="finance-period__nav-button"
            disabled={
              !canGoNext
            }
            onClick={
              handleNextMonth
            }
            aria-label="Ver próximo mês"
          >
            <ChevronRight
              size={17}
            />
          </button>

          {!isCurrentCompetence && (
            <button
              type="button"
              className="finance-period__current-button"
              onClick={
                handleCurrentMonth
              }
            >
              <CalendarDays
                size={14}
              />

              Mês atual
            </button>
          )}
        </div>

        <div className="finance-period__actions">
          <span className="finance-period__note">
            {isCurrentCompetence
              ? 'Mensalidades, Agenda e Estoque alimentam o caixa automaticamente.'
              : 'Histórico preservado: o sistema não cria mensalidades retroativas.'}
          </span>

          {isCurrentCompetence && (
            <button
              className="finance-new-expense-button"
              type="button"
              onClick={
                handleToggleExpenseForm
              }
            >
              {expenseFormOpen ? (
                <X
                  size={16}
                  strokeWidth={1.8}
                />
              ) : (
                <Plus
                  size={16}
                  strokeWidth={1.8}
                />
              )}

              {expenseFormOpen
                ? 'Fechar'
                : 'Despesa avulsa'}
            </button>
          )}
        </div>
      </div>

      {!isCurrentCompetence && (
        <div className="finance-history-note">
          <CalendarDays
            size={17}
            strokeWidth={1.8}
          />

          <div>
            <strong>
              Visualizando histórico
            </strong>

            <span>
              Valores e movimentações abaixo são os registros realmente
              existentes em{' '}
              {formatCompetence(
                competence,
              )}. O sistema não reconstrói cobranças que não existiam naquele
              momento.
            </span>
          </div>
        </div>
      )}

      {expenseFormOpen && (
        <section className="finance-expense-panel">
          <div className="finance-expense-panel__header">
            <div>
              <span>
                Exceção
              </span>

              <h2>
                Registrar despesa avulsa
              </h2>
            </div>

            <p>
              Agenda e compras de estoque já entram automaticamente. Use aqui
              somente para gastos como energia, combustível ou manutenção.
            </p>
          </div>

          <form
            className="finance-expense-form"
            onSubmit={
              handleCreateExpense
            }
          >
            <div className="finance-expense-field finance-expense-field--wide">
              <label htmlFor="expenseDescription">
                Descrição
              </label>

              <input
                id="expenseDescription"
                name="expenseDescription"
                type="text"
                value={
                  expenseDescription
                }
                onChange={(
                  event,
                ) =>
                  setExpenseDescription(
                    event.target.value,
                  )
                }
                placeholder="Ex: Conta de energia do haras"
                autoComplete="off"
                required
              />
            </div>

            <div className="finance-expense-field">
              <label htmlFor="expenseAmount">
                Valor pago
              </label>

              <MoneyInput
                id="expenseAmount"
                name="expenseAmount"
                value={
                  expenseAmount
                }
                onChange={
                  setExpenseAmount
                }
              />

              <span>
                Digite como em um PIX.
              </span>
            </div>

            <div className="finance-expense-field">
              <label htmlFor="expenseDate">
                Data do pagamento
              </label>

              <input
                id="expenseDate"
                name="expenseDate"
                type="date"
                min={
                  currentCompetence
                }
                max={
                  today
                }
                value={
                  expenseDate
                }
                onChange={(
                  event,
                ) =>
                  setExpenseDate(
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div className="finance-expense-field finance-expense-field--wide">
              <label htmlFor="expenseNotes">
                Observação
              </label>

              <textarea
                id="expenseNotes"
                name="expenseNotes"
                value={
                  expenseNotes
                }
                onChange={(
                  event,
                ) =>
                  setExpenseNotes(
                    event.target.value,
                  )
                }
                placeholder="Opcional"
                rows={3}
              />
            </div>

            <div className="finance-expense-form__actions">
              <button
                className="finance-expense-cancel"
                type="button"
                onClick={
                  handleToggleExpenseForm
                }
                disabled={
                  savingExpense
                }
              >
                Cancelar
              </button>

              <button
                className="finance-expense-submit"
                type="submit"
                disabled={
                  savingExpense
                }
              >
                {savingExpense
                  ? 'Registrando...'
                  : 'Registrar despesa'}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <div className="finance-message finance-message--error">
          <AlertTriangle
            size={18}
            strokeWidth={1.8}
          />

          <div>
            <strong>
              Atenção
            </strong>

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="finance-message finance-message--success">
          <CheckCircle2
            size={18}
            strokeWidth={1.8}
          />

          <div>
            <strong>
              Operação registrada
            </strong>

            <span>
              {successMessage}
            </span>
          </div>
        </div>
      )}

      <div className="finance-summary">
        <article
          className={`finance-summary-card finance-summary-card--balance ${
            summary &&
            summary.balanceAmount <
              0
              ? 'finance-summary-card--negative'
              : ''
          }`}
        >
          <div className="finance-summary-card__icon">
            <ReceiptText
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <span>
            Saldo real
          </span>

          <strong>
            {loading ||
            !summary
              ? '...'
              : formatCurrency(
                  summary.balanceAmount,
                )}
          </strong>

          <small>
            Resultado real do caixa nesta competência
          </small>
        </article>

        <article className="finance-summary-card">
          <div className="finance-summary-card__icon">
            <WalletCards
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <span>
            Recebido
          </span>

          <strong>
            {loading ||
            !summary
              ? '...'
              : formatCurrency(
                  summary.receivedAmount,
                )}
          </strong>

          <small>
            Dinheiro que realmente entrou
          </small>
        </article>

        <article className="finance-summary-card finance-summary-card--pending">
          <div className="finance-summary-card__icon">
            <Clock3
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <span>
            A receber
          </span>

          <strong>
            {loading ||
            !summary
              ? '...'
              : formatCurrency(
                  summary.receivableAmount,
                )}
          </strong>

          <small>
            {loading
              ? 'Carregando...'
              : pendingCharges.length ===
                  1
                ? '1 mensalidade em aberto'
                : `${pendingCharges.length} mensalidades em aberto`}
          </small>
        </article>

        <article className="finance-summary-card">
          <div className="finance-summary-card__icon">
            <TrendingDown
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <span>
            Despesas pagas
          </span>

          <strong>
            {loading ||
            !summary
              ? '...'
              : formatCurrency(
                  summary.expenseAmount,
                )}
          </strong>

          <small>
            Dinheiro que realmente saiu
          </small>
        </article>
      </div>

      <section className="finance-section finance-section--attention">
        <div className="finance-section__header">
          <div>
            <span className="finance-section__eyebrow">
              Atenção financeira
            </span>

            <h2>
              {isCurrentCompetence
                ? 'O que precisa da sua atenção'
                : 'Pendências desta competência'}
            </h2>
          </div>

          {!loading && (
            <span
              className={`finance-section__counter ${
                attentionCount ===
                  0
                  ? 'finance-section__counter--clear'
                  : 'finance-section__counter--attention'
              }`}
            >
              {attentionCount}
            </span>
          )}
        </div>

        {loading && (
          <div className="finance-state">
            Verificando pendências...
          </div>
        )}

        {!loading &&
          attentionCount ===
            0 && (
            <div className="finance-attention-clear">
              <CheckCircle2
                size={20}
                strokeWidth={1.7}
              />

              <div>
                <strong>
                  Tudo sob controle
                </strong>

                <span>
                  Não há mensalidades vencidas, cobranças vencendo hoje ou
                  serviços aguardando pagamento.
                </span>
              </div>
            </div>
          )}

        {!loading &&
          attentionCount >
            0 && (
            <div className="finance-attention-grid">
              {urgentMonthlyCharges.length >
                0 && (
                <article className="finance-attention-card">
                  <div className="finance-attention-card__top">
                    <div className="finance-attention-card__icon finance-attention-card__icon--warning">
                      <AlertTriangle
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span>
                      Mensalidades
                    </span>
                  </div>

                  <strong className="finance-attention-card__title">
                    {urgentMonthlyCharges.length ===
                    1
                      ? '1 mensalidade exige atenção'
                      : `${urgentMonthlyCharges.length} mensalidades exigem atenção`}
                  </strong>

                  <span className="finance-attention-card__amount">
                    {formatCurrency(
                      urgentMonthlyAmount,
                    )}
                  </span>

                  <div className="finance-attention-card__badges">
                    {overdueCharges.length >
                      0 && (
                      <span className="finance-attention-badge finance-attention-badge--overdue">
                        {overdueCharges.length}{' '}
                        em atraso
                      </span>
                    )}

                    {dueTodayCharges.length >
                      0 && (
                      <span className="finance-attention-badge finance-attention-badge--today">
                        {dueTodayCharges.length}{' '}
                        {dueTodayCharges.length ===
                        1
                          ? 'vence hoje'
                          : 'vencem hoje'}
                      </span>
                    )}
                  </div>

                  <div className="finance-attention-charges">
                    {urgentMonthlyCharges
                      .slice(
                        0,
                        3,
                      )
                      .map(
                        (
                          charge,
                        ) => {
                          const visualStatus =
                            getChargeVisualStatus(
                              charge,
                              today,
                            )

                          const isProcessing =
                            processingChargeId ===
                            charge.id

                          return (
                            <div
                              className="finance-attention-charge"
                              key={
                                charge.id
                              }
                            >
                              <div className="finance-attention-charge__content">
                                <strong>
                                  {
                                    charge.horseName
                                  }
                                </strong>

                                <span>
                                  {
                                    charge.clientName
                                  }{' '}
                                  ·{' '}
                                  {getChargeStatusDetail(
                                    charge,
                                    today,
                                  )}
                                </span>
                              </div>

                              <span
                                className={`finance-attention-charge__status finance-attention-charge__status--${getChargeStatusClass(
                                  visualStatus,
                                )}`}
                              >
                                {getChargeStatusLabel(
                                  visualStatus,
                                )}
                              </span>

                              <strong className="finance-attention-charge__amount">
                                {formatCurrency(
                                  charge.amount,
                                )}
                              </strong>

                              <button
                                type="button"
                                disabled={
                                  processingChargeId !==
                                  null
                                }
                                onClick={() =>
                                  handleConfirmPayment(
                                    charge,
                                  )
                                }
                              >
                                {isProcessing
                                  ? 'Confirmando...'
                                  : 'Confirmar'}
                              </button>
                            </div>
                          )
                        },
                      )}
                  </div>

                  {urgentMonthlyCharges.length >
                    3 && (
                    <a
                      className="finance-attention-card__action"
                      href="#finance-monthly-charges"
                    >
                      Ver todas as mensalidades

                      <ArrowRight
                        size={14}
                      />
                    </a>
                  )}
                </article>
              )}

              {pendingAppointmentExpenses.length >
                0 && (
                <article className="finance-attention-card finance-attention-card--agenda">
                  <div className="finance-attention-card__top">
                    <div className="finance-attention-card__icon">
                      <CalendarClock
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span>
                      Agenda
                    </span>
                  </div>

                  <strong className="finance-attention-card__title">
                    {pendingAppointmentExpenses.length ===
                    1
                      ? '1 serviço aguardando pagamento'
                      : `${pendingAppointmentExpenses.length} serviços aguardando pagamento`}
                  </strong>

                  <span className="finance-attention-card__amount">
                    {formatCurrency(
                      pendingAppointmentAmount,
                    )}
                  </span>

                  <div className="finance-attention-services">
                    {pendingAppointmentExpenses
                      .slice(
                        0,
                        3,
                      )
                      .map(
                        (
                          appointment,
                        ) => (
                          <Link
                            className="finance-attention-service"
                            key={
                              appointment.appointmentId
                            }
                            to={`/agenda?appointment=${appointment.appointmentId}`}
                          >
                            <div>
                              <strong>
                                {
                                  appointment.title
                                }{' '}
                                ·{' '}
                                {
                                  appointment.horseName
                                }
                              </strong>

                              <span>
                                {appointment.professionalName
                                  ? `${appointment.professionalName} · `
                                  : ''}
                                {formatDate(
                                  appointment.scheduledAt,
                                )}
                              </span>
                            </div>

                            <span className="finance-attention-service__amount">
                              {formatCurrency(
                                appointment.serviceAmount,
                              )}
                            </span>

                            <ArrowRight
                              size={15}
                            />
                          </Link>
                        ),
                      )}
                  </div>

                  {pendingAppointmentExpenses.length >
                    3 && (
                    <Link
                      className="finance-attention-card__action"
                      to="/agenda"
                    >
                      Ver todos na Agenda

                      <ArrowRight
                        size={14}
                      />
                    </Link>
                  )}
                </article>
              )}
            </div>
          )}
      </section>

      <section
        className="finance-section"
        id="finance-monthly-charges"
      >
        <div className="finance-section__header">
          <div>
            <span className="finance-section__eyebrow">
              Mensalidades
            </span>

            <h2>
              Recebimentos do mês
            </h2>
          </div>

          {!loading && (
            <span className="finance-section__counter">
              {pendingCharges.length ===
              0
                ? 'Tudo recebido'
                : `${pendingCharges.length} em aberto`}
            </span>
          )}
        </div>

        {loading && (
          <div className="finance-state">
            Carregando mensalidades...
          </div>
        )}

        {!loading &&
          sortedCharges.length ===
            0 && (
            <div className="finance-empty">
              <CheckCircle2
                size={24}
                strokeWidth={1.6}
              />

              <strong>
                Nenhuma mensalidade registrada neste mês
              </strong>

              <span>
                {isCurrentCompetence
                  ? 'Cavalos ativos com mensalidade cadastrada aparecerão aqui automaticamente.'
                  : 'O histórico mostra apenas cobranças que realmente foram registradas nesta competência.'}
              </span>
            </div>
          )}

        {!loading &&
          sortedCharges.length >
            0 && (
            <div className="finance-charges">
              {sortedCharges.map(
                (charge) => {
                  const visualStatus =
                    getChargeVisualStatus(
                      charge,
                      today,
                    )

                  const statusClass =
                    getChargeStatusClass(
                      visualStatus,
                    )

                  const isProcessing =
                    processingChargeId ===
                    charge.id

                  return (
                    <article
                      className={`finance-charge finance-charge--${statusClass}`}
                      key={
                        charge.id
                      }
                    >
                      <div className="finance-charge__identity">
                        <div
                          className={`finance-charge__status-icon finance-charge__status-icon--${statusClass}`}
                        >
                          <ChargeStatusIcon
                            status={
                              visualStatus
                            }
                          />
                        </div>

                        <div>
                          <strong>
                            {
                              charge.horseName
                            }
                          </strong>

                          <span>
                            {
                              charge.clientName
                            }
                          </span>
                        </div>
                      </div>

                      <div className="finance-charge__amount">
                        <span>
                          Mensalidade
                        </span>

                        <strong>
                          {formatCurrency(
                            charge.amount,
                          )}
                        </strong>
                      </div>

                      <div className="finance-charge__status">
                        <span
                          className={`finance-status finance-status--${statusClass}`}
                        >
                          {getChargeStatusLabel(
                            visualStatus,
                          )}
                        </span>

                        <small>
                          {getChargeStatusDetail(
                            charge,
                            today,
                          )}
                        </small>
                      </div>

                      <div className="finance-charge__action">
                        {charge.status ===
                        'pending' ? (
                          <button
                            type="button"
                            disabled={
                              processingChargeId !==
                              null
                            }
                            onClick={() =>
                              handleConfirmPayment(
                                charge,
                              )
                            }
                          >
                            {isProcessing
                              ? 'Confirmando...'
                              : isCurrentCompetence
                                ? 'Confirmar recebimento'
                                : 'Receber agora'}
                          </button>
                        ) : charge.status ===
                          'paid' ? (
                          <span className="finance-charge__done">
                            <CheckCircle2
                              size={15}
                            />

                            Recebido
                          </span>
                        ) : (
                          <span className="finance-charge__cancelled">
                            <CircleX
                              size={15}
                            />

                            Cancelada
                          </span>
                        )}
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          )}
      </section>

      <section className="finance-section">
        <div className="finance-section__header">
          <div>
            <span className="finance-section__eyebrow">
              Caixa
            </span>

            <h2>
              Movimentações do mês
            </h2>
          </div>
        </div>

        {!loading && (
          <>
            <div className="finance-transaction-filter-bar">
              <div
                className="finance-transaction-type-filter"
                role="group"
                aria-label="Filtrar movimentações por tipo"
              >
                <button
                  type="button"
                  className={
                    transactionTypeFilter ===
                    'all'
                      ? 'finance-transaction-filter-button finance-transaction-filter-button--active'
                      : 'finance-transaction-filter-button'
                  }
                  aria-pressed={
                    transactionTypeFilter ===
                    'all'
                  }
                  onClick={() =>
                    setTransactionTypeFilter(
                      'all',
                    )
                  }
                >
                  Todas
                </button>

                <button
                  type="button"
                  className={
                    transactionTypeFilter ===
                    'income'
                      ? 'finance-transaction-filter-button finance-transaction-filter-button--active'
                      : 'finance-transaction-filter-button'
                  }
                  aria-pressed={
                    transactionTypeFilter ===
                    'income'
                  }
                  onClick={() =>
                    setTransactionTypeFilter(
                      'income',
                    )
                  }
                >
                  Entradas
                </button>

                <button
                  type="button"
                  className={
                    transactionTypeFilter ===
                    'expense'
                      ? 'finance-transaction-filter-button finance-transaction-filter-button--active'
                      : 'finance-transaction-filter-button'
                  }
                  aria-pressed={
                    transactionTypeFilter ===
                    'expense'
                  }
                  onClick={() =>
                    setTransactionTypeFilter(
                      'expense',
                    )
                  }
                >
                  Despesas
                </button>
              </div>

              <button
                type="button"
                className={`finance-transaction-source-toggle ${
                  transactionSourceFilter !==
                  'all'
                    ? 'finance-transaction-source-toggle--active'
                    : ''
                }`}
                aria-expanded={
                  sourceFilterOpen
                }
                onClick={() =>
                  setSourceFilterOpen(
                    (
                      currentValue,
                    ) =>
                      !currentValue,
                  )
                }
              >
                <SlidersHorizontal
                  size={14}
                  strokeWidth={1.8}
                />

                {transactionSourceFilter ===
                'all'
                  ? 'Filtrar origem'
                  : `Origem: ${
                      TRANSACTION_SOURCE_FILTER_LABELS[
                        transactionSourceFilter
                      ]
                    }`}
              </button>

              <span className="finance-transaction-result-count">
                {filteredTransactions.length}{' '}
                {filteredTransactions.length ===
                1
                  ? 'movimentação'
                  : 'movimentações'}
              </span>
            </div>

            {sourceFilterOpen && (
              <div className="finance-transaction-source-options">
                {(
                  Object.keys(
                    TRANSACTION_SOURCE_FILTER_LABELS,
                  ) as TransactionSourceFilter[]
                ).map(
                  (filter) => (
                    <button
                      type="button"
                      key={
                        filter
                      }
                      className={
                        transactionSourceFilter ===
                        filter
                          ? 'finance-transaction-source-option finance-transaction-source-option--active'
                          : 'finance-transaction-source-option'
                      }
                      onClick={() =>
                        handleTransactionSourceFilter(
                          filter,
                        )
                      }
                    >
                      {
                        TRANSACTION_SOURCE_FILTER_LABELS[
                          filter
                        ]
                      }
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="finance-state">
            Carregando movimentações...
          </div>
        )}

        {!loading &&
          filteredTransactions.length ===
            0 && (
            <div className="finance-empty finance-empty--compact">
              <ReceiptText
                size={22}
                strokeWidth={1.6}
              />

              <strong>
                Nenhuma movimentação encontrada
              </strong>

              <span>
                {transactionEmptyMessage}
              </span>
            </div>
          )}

        {!loading &&
          transactionGroups.length >
            0 && (
            <div className="finance-transactions">
              {transactionGroups.map(
                (
                  group,
                ) => (
                  <section
                    className="finance-transaction-day"
                    key={
                      group.dateKey
                    }
                  >
                    <div className="finance-transaction-day__header">
                      {
                        group.dateLabel
                      }
                    </div>

                    {group.transactions.map(
                      (
                        transaction,
                      ) => (
                        <article
                          className="finance-transaction"
                          key={
                            transaction.id
                          }
                        >
                          <div
                            className={`finance-transaction__marker finance-transaction__marker--${transaction.transactionType}`}
                          />

                          <div className="finance-transaction__content">
                            <strong>
                              {
                                transaction.description
                              }
                            </strong>

                            <div className="finance-transaction__meta">
                              <span className="finance-transaction__source">
                                {
                                  FINANCIAL_TRANSACTION_SOURCE_LABELS[
                                    transaction.sourceType
                                  ]
                                }
                              </span>

                              <span>
                                {formatDateTime(
                                  transaction.occurredAt,
                                )}
                              </span>
                            </div>
                          </div>

                          <strong
                            className={`finance-transaction__amount finance-transaction__amount--${transaction.transactionType}`}
                          >
                            {transaction.transactionType ===
                            'income'
                              ? '+'
                              : '-'}{' '}
                            {formatCurrency(
                              transaction.amount,
                            )}
                          </strong>
                        </article>
                      ),
                    )}
                  </section>
                ),
              )}
            </div>
          )}
      </section>
    </section>
  )
}