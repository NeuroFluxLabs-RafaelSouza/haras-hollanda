import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  DoorOpen,
  Pencil,
  Utensils,
  X,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  DailyFeedingRoutineItem,
} from '../../domain/feeding.ts'

import {
  confirmFeeding,
  confirmFeedingBatch,
  getDailyFeedingRoutine,
} from './feedingService.ts'

import './DailyFeedingPage.css'

const PERIOD_ORDER: Record<
  string,
  number
> = {
  Manhã: 1,
  Tarde: 2,
  Noite: 3,
}

function getTodayDate() {
  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

function formatDate(
  date: string,
) {
  const value =
    new Date(
      `${date}T12:00:00`,
    )

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday:
        'long',

      day:
        '2-digit',

      month:
        'long',
    },
  ).format(value)
}

function formatQuantity(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      maximumFractionDigits: 3,
    },
  ).format(value)
}

function parseQuantity(
  value: string,
) {
  const parsed =
    Number(
      value
        .trim()
        .replace(
          ',',
          '.',
        ),
    )

  if (
    Number.isNaN(parsed)
  ) {
    return 0
  }

  return parsed
}

export function DailyFeedingPage() {
  const feedingDate =
    getTodayDate()

  const [
    items,
    setItems,
  ] = useState<
    DailyFeedingRoutineItem[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
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
    confirmingAll,
    setConfirmingAll,
  ] = useState(false)

  const [
    confirmingMealId,
    setConfirmingMealId,
  ] = useState<
    string | null
  >(null)

  const [
    adjustingMealId,
    setAdjustingMealId,
  ] = useState<
    string | null
  >(null)

  const [
    adjustedQuantity,
    setAdjustedQuantity,
  ] = useState('')

  const [
    adjustmentNotes,
    setAdjustmentNotes,
  ] = useState('')

  const loadRoutine =
    useCallback(
      async () => {
        const data =
          await getDailyFeedingRoutine(
            feedingDate,
          )

        setItems(
          data,
        )
      },
      [
        feedingDate,
      ],
    )

  useEffect(() => {
    let isMounted =
      true

    async function loadPage() {
      try {
        const data =
          await getDailyFeedingRoutine(
            feedingDate,
          )

        if (
          isMounted
        ) {
          setItems(
            data,
          )
        }
      } catch (error) {
        if (
          !isMounted
        ) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a alimentação de hoje.'

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

    loadPage()

    return () => {
      isMounted =
        false
    }
  }, [
    feedingDate,
  ])

  const confirmedCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.confirmed,
        ).length,
      [items],
    )

  const pendingItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            !item.confirmed,
        ),
      [items],
    )

  const pendingCount =
    pendingItems.length

  const periods =
    useMemo(() => {
      const grouped =
        new Map<
          string,
          DailyFeedingRoutineItem[]
        >()

      for (
        const item
        of items
      ) {
        const current =
          grouped.get(
            item.period,
          ) ??
          []

        current.push(
          item,
        )

        grouped.set(
          item.period,
          current,
        )
      }

      return Array.from(
        grouped.entries(),
      )
        .sort(
          (
            [periodA],
            [periodB],
          ) =>
            (
              PERIOD_ORDER[
                periodA
              ] ??
              99
            ) -
            (
              PERIOD_ORDER[
                periodB
              ] ??
              99
            ),
        )
        .map(
          ([
            period,
            periodItems,
          ]) => ({
            period,

            items:
              periodItems.sort(
                (
                  first,
                  second,
                ) => {
                  const firstStall =
                    first.stallName ??
                    'ZZZ'

                  const secondStall =
                    second.stallName ??
                    'ZZZ'

                  const stallComparison =
                    firstStall.localeCompare(
                      secondStall,
                      'pt-BR',
                      {
                        numeric:
                          true,
                      },
                    )

                  if (
                    stallComparison !==
                    0
                  ) {
                    return stallComparison
                  }

                  return first.horseName.localeCompare(
                    second.horseName,
                    'pt-BR',
                  )
                },
              ),
          }),
        )
    }, [items])

  async function confirmAllPending() {
    if (
      pendingItems.length ===
      0
    ) {
      return
    }

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    setAdjustingMealId(
      null,
    )

    setConfirmingAll(
      true,
    )

    try {
      const result =
        await confirmFeedingBatch({
          feedingMealIds:
            pendingItems.map(
              (item) =>
                item.feedingMealId,
            ),

          feedingDate,
        })

      await loadRoutine()

      const quantityText =
        formatQuantity(
          result.totalQuantity,
        )

      setSuccessMessage(
        `${result.confirmedCount} refeições confirmadas. ${quantityText} kg registrados no estoque.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível confirmar as alimentações.'

      setError(
        message,
      )
    } finally {
      setConfirmingAll(
        false,
      )
    }
  }

  function openAdjustment(
    item: DailyFeedingRoutineItem,
  ) {
    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    setAdjustingMealId(
      item.feedingMealId,
    )

    setAdjustedQuantity(
      String(
        item.plannedQuantity,
      ),
    )

    setAdjustmentNotes(
      '',
    )
  }

  function cancelAdjustment() {
    setAdjustingMealId(
      null,
    )

    setAdjustedQuantity(
      '',
    )

    setAdjustmentNotes(
      '',
    )
  }

  async function confirmAdjustment(
    item: DailyFeedingRoutineItem,
  ) {
    const quantity =
      parseQuantity(
        adjustedQuantity,
      )

    if (
      quantity <=
      0
    ) {
      setError(
        'Informe uma quantidade fornecida maior que zero.',
      )

      return
    }

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    setConfirmingMealId(
      item.feedingMealId,
    )

    try {
      const result =
        await confirmFeeding({
          feedingMealId:
            item.feedingMealId,

          feedingDate,

          actualQuantity:
            quantity,

          notes:
            adjustmentNotes.trim() ||
            null,
        })

      setItems(
        (currentItems) =>
          currentItems.map(
            (
              currentItem,
            ) =>
              currentItem.feedingMealId ===
              item.feedingMealId
                ? {
                    ...currentItem,

                    confirmed:
                      true,

                    confirmationId:
                      result.confirmationId,

                    actualQuantity:
                      result.actualQuantity,

                    confirmedAt:
                      new Date().toISOString(),
                  }
                : currentItem,
          ),
      )

      cancelAdjustment()

      setSuccessMessage(
        `${item.horseName}: alimentação ajustada para ${formatQuantity(result.actualQuantity)} kg e confirmada.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível confirmar o ajuste.'

      setError(
        message,
      )
    } finally {
      setConfirmingMealId(
        null,
      )
    }
  }

  return (
    <section className="daily-feeding-page">
      <header className="daily-feeding-header">
        <Link
          className="daily-feeding-header__back"
          to="/cavalos"
        >
          <ArrowLeft
            size={17}
          />

          Voltar aos cavalos
        </Link>

        <div className="daily-feeding-header__main">
          <div>
            <p className="page-header__eyebrow">
              Rotina diária
            </p>

            <h1 className="page-header__title">
              Alimentação de hoje
            </h1>

            <p className="page-header__description">
              {formatDate(
                feedingDate,
              )}
            </p>
          </div>

          {!loading &&
            items.length >
              0 && (
              pendingCount >
              0 ? (
                <button
                  className="daily-feeding-confirm-all"
                  type="button"
                  disabled={
                    confirmingAll ||
                    confirmingMealId !==
                      null
                  }
                  onClick={
                    confirmAllPending
                  }
                >
                  <Check
                    size={17}
                  />

                  {confirmingAll
                    ? 'Confirmando...'
                    : `Confirmar todos (${pendingCount})`}
                </button>
              ) : (
                <div className="daily-feeding-day-complete">
                  <CheckCircle2
                    size={17}
                  />

                  Dia concluído
                </div>
              )
            )}
        </div>
      </header>

      <div className="daily-feeding-summary">
        <div>
          <span>
            Refeições
          </span>

          <strong>
            {items.length}
          </strong>
        </div>

        <div>
          <span>
            Concluídas
          </span>

          <strong className="daily-feeding-summary__success">
            {confirmedCount}
          </strong>
        </div>

        <div>
          <span>
            Pendentes
          </span>

          <strong className="daily-feeding-summary__pending">
            {pendingCount}
          </strong>
        </div>
      </div>

      {successMessage && (
        <div className="daily-feeding-state daily-feeding-state--success">
          <CheckCircle2
            size={17}
          />

          <span>
            {successMessage}
          </span>
        </div>
      )}

      {error && (
        <div className="daily-feeding-state daily-feeding-state--error">
          {error}
        </div>
      )}

      {loading && (
        <div className="daily-feeding-state">
          Carregando rotina de alimentação...
        </div>
      )}

      {!loading &&
        !error &&
        items.length ===
          0 && (
          <div className="daily-feeding-empty">
            <Utensils
              size={28}
              strokeWidth={
                1.6
              }
            />

            <strong>
              Nenhuma alimentação planejada
            </strong>

            <span>
              Configure o plano alimentar dos cavalos para que a rotina diária apareça aqui.
            </span>
          </div>
        )}

      {!loading &&
        periods.map(
          ({
            period,
            items:
              periodItems,
          }) => {
            const periodConfirmed =
              periodItems.filter(
                (item) =>
                  item.confirmed,
              ).length

            return (
              <section
                className="daily-feeding-period"
                key={
                  period
                }
              >
                <div className="daily-feeding-period__header">
                  <div className="daily-feeding-period__identity">
                    <Clock
                      size={
                        18
                      }
                      strokeWidth={
                        1.8
                      }
                    />

                    <div>
                      <h2>
                        {
                          period
                        }
                      </h2>

                      <span>
                        {
                          periodConfirmed
                        }{' '}
                        de{' '}
                        {
                          periodItems.length
                        }{' '}
                        concluídas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="daily-feeding-list">
                  {periodItems.map(
                    (
                      item,
                    ) => {
                      const isAdjusting =
                        adjustingMealId ===
                        item.feedingMealId

                      const isConfirming =
                        confirmingMealId ===
                        item.feedingMealId

                      return (
                        <article
                          className={`daily-feeding-item ${
                            item.confirmed
                              ? 'daily-feeding-item--confirmed'
                              : ''
                          }`}
                          key={
                            item.feedingMealId
                          }
                        >
                          <div className="daily-feeding-item__main">
                            <div className="daily-feeding-item__stall">
                              <DoorOpen
                                size={
                                  17
                                }
                                strokeWidth={
                                  1.7
                                }
                              />

                              <span>
                                {item.stallName ??
                                  'Sem baia'}
                              </span>
                            </div>

                            <div className="daily-feeding-item__identity">
                              <strong>
                                {
                                  item.horseName
                                }
                              </strong>

                              <span>
                                {
                                  item.productName
                                }
                              </span>
                            </div>

                            <div className="daily-feeding-item__quantity">
                              <span>
                                {
                                  item.scheduledTime
                                }
                              </span>

                              <strong>
                                {formatQuantity(
                                  item.confirmed &&
                                    item.actualQuantity !==
                                      null
                                    ? item.actualQuantity
                                    : item.plannedQuantity,
                                )}{' '}
                                kg
                              </strong>
                            </div>

                            <div className="daily-feeding-item__actions">
                              {item.confirmed ? (
                                <span className="daily-feeding-item__confirmed">
                                  <CheckCircle2
                                    size={
                                      16
                                    }
                                  />

                                  Confirmado
                                </span>
                              ) : (
                                <button
                                  className="daily-feeding-item__adjust"
                                  type="button"
                                  disabled={
                                    confirmingAll ||
                                    isConfirming
                                  }
                                  onClick={() =>
                                    openAdjustment(
                                      item,
                                    )
                                  }
                                >
                                  <Pencil
                                    size={
                                      14
                                    }
                                  />

                                  Ajustar
                                </button>
                              )}
                            </div>
                          </div>

                          {isAdjusting &&
                            !item.confirmed && (
                              <div className="daily-feeding-adjustment">
                                <div className="daily-feeding-adjustment__field">
                                  <label>
                                    Quantidade fornecida
                                  </label>

                                  <div>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={
                                        adjustedQuantity
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        setAdjustedQuantity(
                                          event
                                            .target
                                            .value,
                                        )
                                      }
                                    />

                                    <span>
                                      kg
                                    </span>
                                  </div>
                                </div>

                                <div className="daily-feeding-adjustment__field daily-feeding-adjustment__field--notes">
                                  <label>
                                    Motivo
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      adjustmentNotes
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setAdjustmentNotes(
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    placeholder="Ex: comeu menos hoje"
                                  />
                                </div>

                                <div className="daily-feeding-adjustment__actions">
                                  <button
                                    type="button"
                                    className="daily-feeding-adjustment__cancel"
                                    disabled={
                                      isConfirming
                                    }
                                    onClick={
                                      cancelAdjustment
                                    }
                                  >
                                    <X
                                      size={
                                        14
                                      }
                                    />

                                    Cancelar
                                  </button>

                                  <button
                                    type="button"
                                    className="daily-feeding-adjustment__save"
                                    disabled={
                                      isConfirming
                                    }
                                    onClick={() =>
                                      confirmAdjustment(
                                        item,
                                      )
                                    }
                                  >
                                    <Check
                                      size={
                                        14
                                      }
                                    />

                                    {isConfirming
                                      ? 'Salvando...'
                                      : 'Confirmar ajuste'}
                                  </button>
                                </div>
                              </div>
                            )}
                        </article>
                      )
                    },
                  )}
                </div>
              </section>
            )
          },
        )}
    </section>
  )
}