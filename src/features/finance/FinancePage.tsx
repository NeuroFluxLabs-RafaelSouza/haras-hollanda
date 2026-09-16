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
  CheckCircle2,
  Clock3,
  Plus,
  ReceiptText,
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

function getCurrentCompetence() {
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

  return `${year}-${month}-01`
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

function sortCharges(
  charges: FinancialChargeListItem[],
) {
  const statusPriority = {
    pending:
      0,

    paid:
      1,

    cancelled:
      2,
  }

  return [
    ...charges,
  ].sort(
    (
      first,
      second,
    ) => {
      const statusDifference =
        statusPriority[
          first.status
        ] -
        statusPriority[
          second.status
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

export function FinancePage() {
  const competence =
    getCurrentCompetence()

  const today =
    getCurrentDateInputValue()

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

  const loadFinance =
    useCallback(
      async () => {
        try {
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
        ),
      [
        charges,
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

  const pendingChargeAmount =
    useMemo(
      () =>
        pendingCharges.reduce(
          (
            total,
            charge,
          ) =>
            total +
            charge.amount,
          0,
        ),
      [
        pendingCharges,
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

  const attentionCount =
    pendingCharges.length +
    pendingAppointmentExpenses.length

  function handleToggleExpenseForm() {
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
      competence.slice(
        0,
        7,
      )
    ) {
      setError(
        'A despesa precisa pertencer à competência atual.',
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

      setSuccessMessage(
        result.alreadyPaid
          ? `A mensalidade de ${charge.horseName} já estava registrada como recebida.`
          : `Recebimento de ${formatCurrency(
              result.amount,
            )} confirmado para ${charge.horseName}.`,
      )

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
        <div className="finance-period__competence">
          <span className="finance-period__eyebrow">
            Competência atual
          </span>

          <strong>
            {formatCompetence(
              competence,
            )}
          </strong>
        </div>

        <div className="finance-period__actions">
          <span className="finance-period__note">
            Mensalidades, Agenda e Estoque alimentam o caixa automaticamente.
          </span>

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
        </div>
      </div>

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
                  competence
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
            O que realmente ficou no caixa neste mês
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
            Mensalidades que ainda não foram recebidas
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
              O que precisa da sua atenção
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
                  Não há mensalidades pendentes nem serviços concluídos
                  aguardando pagamento.
                </span>
              </div>
            </div>
          )}

        {!loading &&
          attentionCount >
            0 && (
            <div className="finance-attention-grid">
              {pendingCharges.length >
                0 && (
                <article className="finance-attention-card">
                  <div className="finance-attention-card__top">
                    <div className="finance-attention-card__icon finance-attention-card__icon--warning">
                      <Clock3
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span>
                      Mensalidades
                    </span>
                  </div>

                  <strong className="finance-attention-card__title">
                    {pendingCharges.length ===
                    1
                      ? '1 mensalidade a receber'
                      : `${pendingCharges.length} mensalidades a receber`}
                  </strong>

                  <span className="finance-attention-card__amount">
                    {formatCurrency(
                      pendingChargeAmount,
                    )}
                  </span>

                  <small>
                    Confirme o recebimento somente quando o dinheiro realmente
                    entrar.
                  </small>
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

      <section className="finance-section">
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
                : `${pendingCharges.length} pendente${
                    pendingCharges.length ===
                    1
                      ? ''
                      : 's'
                  }`}
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
                Nenhuma mensalidade para este mês
              </strong>

              <span>
                Cavalos ativos com mensalidade cadastrada aparecerão aqui
                automaticamente.
              </span>
            </div>
          )}

        {!loading &&
          sortedCharges.length >
            0 && (
            <div className="finance-charges">
              {sortedCharges.map(
                (charge) => {
                  const isProcessing =
                    processingChargeId ===
                    charge.id

                  return (
                    <article
                      className={`finance-charge ${
                        charge.status ===
                        'paid'
                          ? 'finance-charge--paid'
                          : ''
                      }`}
                      key={
                        charge.id
                      }
                    >
                      <div className="finance-charge__identity">
                        <div
                          className={`finance-charge__status-icon ${
                            charge.status ===
                            'paid'
                              ? 'finance-charge__status-icon--paid'
                              : ''
                          }`}
                        >
                          {charge.status ===
                          'paid' ? (
                            <CheckCircle2
                              size={18}
                              strokeWidth={1.8}
                            />
                          ) : (
                            <Clock3
                              size={18}
                              strokeWidth={1.8}
                            />
                          )}
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
                          className={`finance-status ${
                            charge.status ===
                            'paid'
                              ? 'finance-status--paid'
                              : 'finance-status--pending'
                          }`}
                        >
                          {charge.status ===
                          'paid'
                            ? 'Pago'
                            : 'Pendente'}
                        </span>

                        {charge.status ===
                          'paid' &&
                          charge.paidAt && (
                            <small>
                              Recebido em{' '}
                              {formatDateTime(
                                charge.paidAt,
                              )}
                            </small>
                          )}
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
                              : 'Confirmar recebimento'}
                          </button>
                        ) : (
                          <span className="finance-charge__done">
                            <CheckCircle2
                              size={15}
                            />

                            Recebido
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

        {loading && (
          <div className="finance-state">
            Carregando movimentações...
          </div>
        )}

        {!loading &&
          transactions.length ===
            0 && (
            <div className="finance-empty finance-empty--compact">
              <ReceiptText
                size={22}
                strokeWidth={1.6}
              />

              <strong>
                Nenhuma movimentação registrada
              </strong>

              <span>
                Recebimentos e despesas aparecerão aqui automaticamente.
              </span>
            </div>
          )}

        {!loading &&
          transactions.length >
            0 && (
            <div className="finance-transactions">
              {transactions.map(
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
            </div>
          )}
      </section>
    </section>
  )
}