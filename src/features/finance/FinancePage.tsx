import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ReceiptText,
  TrendingDown,
  WalletCards,
} from 'lucide-react'

import type {
  FinancialChargeListItem,
  FinancialMonthSummary,
  FinancialTransaction,
} from '../../domain/finance.ts'

import {
  confirmMonthlyFinancialCharge,
  loadFinancialMonth,
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

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
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
        month: 'long',
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    pending: 0,
    paid: 1,
    cancelled: 2,
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
          Acompanhe o que entrou, o que ainda precisa ser recebido e o saldo
          real do haras sem repetir lançamentos.
        </p>
      </header>

      <div className="finance-period">
        <div>
          <span className="finance-period__eyebrow">
            Competência atual
          </span>

          <strong>
            {formatCompetence(
              competence,
            )}
          </strong>
        </div>

        <span className="finance-period__note">
          As mensalidades são preparadas automaticamente.
        </span>
      </div>

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
              Recebimento registrado
            </strong>

            <span>
              {successMessage}
            </span>
          </div>
        </div>
      )}

      <div className="finance-summary">
        <article className="finance-summary-card">
          <div className="finance-summary-card__icon">
            <WalletCards
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <span>
            Recebido no mês
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
                ? '1 mensalidade pendente'
                : `${pendingCharges.length} mensalidades pendentes`}
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
            Despesas
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
            Valores efetivamente pagos
          </small>
        </article>

        <article className="finance-summary-card finance-summary-card--balance">
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
            Receitas menos despesas
          </small>
        </article>
      </div>

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
                Os recebimentos confirmados aparecerão aqui automaticamente.
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

                      <span>
                        {formatDateTime(
                          transaction.occurredAt,
                        )}
                      </span>
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