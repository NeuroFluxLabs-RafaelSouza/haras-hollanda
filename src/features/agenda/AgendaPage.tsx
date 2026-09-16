import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Pencil,
  Plus,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react'

import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import {
  HorseshoeIcon,
} from '../../components/ui/HorseshoeIcon.tsx'

import {
  APPOINTMENT_STATUS_LABELS,
} from '../../domain/appointment.ts'

import {
  completeAppointmentWithFinance,
  getAppointments,
  type AppointmentListItem,
} from './appointmentsService.ts'

import './AgendaPage.css'

function formatDateLabel(
  scheduledAt: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday:
        'long',

      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric',
    },
  ).format(
    new Date(
      scheduledAt,
    ),
  )
}

function formatTime(
  scheduledAt: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  ).format(
    new Date(
      scheduledAt,
    ),
  )
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

function getDateKey(
  scheduledAt: string,
) {
  const date =
    new Date(
      scheduledAt,
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

export function AgendaPage() {
  const [
    searchParams,
  ] =
    useSearchParams()

  const selectedAppointmentId =
    searchParams.get(
      'appointment',
    )

  const [
    appointments,
    setAppointments,
  ] = useState<
    AppointmentListItem[]
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
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null)

  const [
    updatingAppointmentId,
    setUpdatingAppointmentId,
  ] = useState<
    string | null
  >(null)

  const [
    completionAppointmentId,
    setCompletionAppointmentId,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isMounted =
      true

    async function loadAppointments() {
      try {
        const data =
          await getAppointments()

        if (
          isMounted
        ) {
          setAppointments(
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
            : 'Não foi possível carregar a agenda.'

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

    loadAppointments()

    return () => {
      isMounted =
        false
    }
  }, [])

  useEffect(() => {
    if (
      loading ||
      !selectedAppointmentId
    ) {
      return
    }

    const selectedElement =
      document.getElementById(
        `appointment-${selectedAppointmentId}`,
      )

    if (
      !selectedElement
    ) {
      return
    }

    const timeoutId =
      window.setTimeout(
        () => {
          selectedElement.scrollIntoView({
            behavior:
              'smooth',

            block:
              'center',
          })
        },
        100,
      )

    return () => {
      window.clearTimeout(
        timeoutId,
      )
    }
  }, [
    loading,
    selectedAppointmentId,
    appointments,
  ])

  const groupedAppointments =
    useMemo(() => {
      const groups =
        new Map<
          string,
          AppointmentListItem[]
        >()

      appointments.forEach(
        (
          appointment,
        ) => {
          const key =
            getDateKey(
              appointment.scheduledAt,
            )

          const existing =
            groups.get(
              key,
            ) ??
            []

          existing.push(
            appointment,
          )

          groups.set(
            key,
            existing,
          )
        },
      )

      return Array.from(
        groups.entries(),
      )
    }, [
      appointments,
    ])

  function openCompletionOptions(
    appointmentId: string,
  ) {
    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    setCompletionAppointmentId(
      appointmentId,
    )
  }

  function closeCompletionOptions() {
    setCompletionAppointmentId(
      null,
    )
  }

  async function handleComplete(
    appointment: AppointmentListItem,
    registerPayment: boolean,
  ) {
    if (
      registerPayment &&
      (
        appointment.serviceAmount ===
          null ||
        appointment.serviceAmount <=
          0
      )
    ) {
      setError(
        'Informe o valor do serviço antes de registrar o pagamento.',
      )

      return
    }

    setUpdatingAppointmentId(
      appointment.id,
    )

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    try {
      const result =
        await completeAppointmentWithFinance(
          appointment.id,
          registerPayment,
        )

      setAppointments(
        (
          currentAppointments,
        ) =>
          currentAppointments.map(
            (
              currentAppointment,
            ) =>
              currentAppointment.id ===
              appointment.id
                ? {
                    ...currentAppointment,

                    status:
                      'completed',

                    paymentRegistered:
                      result.paymentRegistered ||
                      currentAppointment.paymentRegistered,
                  }
                : currentAppointment,
          ),
      )

      if (
        registerPayment
      ) {
        setSuccessMessage(
          result.alreadyRegistered
            ? `O pagamento de ${appointment.title} para ${appointment.horseName ?? 'o cavalo'} já estava registrado no Financeiro.`
            : `Serviço concluído e pagamento de ${formatCurrency(
                appointment.serviceAmount ??
                  0,
              )} registrado automaticamente no Financeiro.`,
        )
      } else {
        setSuccessMessage(
          'Serviço concluído. Nenhuma saída de caixa foi registrada.',
        )
      }

      setCompletionAppointmentId(
        null,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir o compromisso.'

      setError(
        message,
      )
    } finally {
      setUpdatingAppointmentId(
        null,
      )
    }
  }

  async function handleRegisterPayment(
    appointment: AppointmentListItem,
  ) {
    await handleComplete(
      appointment,
      true,
    )
  }

  const appointmentCountLabel =
    appointments.length ===
    1
      ? '1 compromisso'
      : `${appointments.length} compromissos`

  return (
    <section className="agenda-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Planejamento operacional
        </p>

        <h1 className="page-header__title">
          Agenda
        </h1>

        <p className="page-header__description">
          Organize visitas técnicas, treinos e atendimentos dos cavalos.
        </p>
      </header>

      <div className="agenda-toolbar">
        <span className="agenda-toolbar__count">
          {appointmentCountLabel}
        </span>

        <div className="agenda-toolbar__actions">
          <Link
            className="agenda-professionals-button"
            to="/agenda/profissionais"
          >
            <UsersRound
              size={17}
            />

            Profissionais
          </Link>

          <Link
            className="agenda-add-button"
            to="/agenda/novo"
          >
            <Plus
              size={17}
            />

            Novo compromisso
          </Link>
        </div>
      </div>

      {error && (
        <div className="agenda-state agenda-state--error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="agenda-state agenda-state--success">
          <CheckCircle2
            size={17}
          />

          <span>
            {successMessage}
          </span>
        </div>
      )}

      {loading && (
        <div className="agenda-state">
          Carregando agenda...
        </div>
      )}

      {!loading &&
        !error &&
        appointments.length ===
          0 && (
          <div className="agenda-empty">
            <CalendarDays
              size={26}
              strokeWidth={1.6}
            />

            <strong>
              Nenhum compromisso agendado
            </strong>

            <span>
              Sua agenda está livre. Use “Novo compromisso” para programar
              uma atividade.
            </span>
          </div>
        )}

      {!loading &&
        groupedAppointments.length >
          0 && (
          <div className="agenda-groups">
            {groupedAppointments.map(
              (
                [
                  dateKey,
                  items,
                ],
              ) => (
                <section
                  className="agenda-group"
                  key={
                    dateKey
                  }
                >
                  <div className="agenda-group__date">
                    <CalendarDays
                      size={16}
                      strokeWidth={1.8}
                    />

                    <span>
                      {formatDateLabel(
                        items[0].scheduledAt,
                      )}
                    </span>
                  </div>

                  <div className="agenda-list">
                    {items.map(
                      (
                        appointment,
                      ) => {
                        const isSelected =
                          appointment.id ===
                          selectedAppointmentId

                        const isProcessing =
                          updatingAppointmentId ===
                          appointment.id

                        const completionOpen =
                          completionAppointmentId ===
                          appointment.id

                        const hasServiceAmount =
                          appointment.serviceAmount !==
                            null &&
                          appointment.serviceAmount >
                            0

                        const awaitingPayment =
                          appointment.status ===
                            'completed' &&
                          hasServiceAmount &&
                          !appointment.paymentRegistered

                        return (
                          <article
                            id={`appointment-${appointment.id}`}
                            className={`agenda-item agenda-item--${appointment.status} ${
                              isSelected
                                ? 'agenda-item--selected'
                                : ''
                            }`}
                            key={
                              appointment.id
                            }
                          >
                            <div className="agenda-item__time">
                              <Clock
                                size={16}
                                strokeWidth={1.8}
                              />

                              <strong>
                                {formatTime(
                                  appointment.scheduledAt,
                                )}
                              </strong>
                            </div>

                            <div className="agenda-item__content">
                              <div className="agenda-item__title-row">
                                <h2>
                                  {
                                    appointment.title
                                  }
                                </h2>

                                <span
                                  className={`agenda-item__status agenda-item__status--${appointment.status}`}
                                >
                                  {
                                    APPOINTMENT_STATUS_LABELS[
                                      appointment.status
                                    ]
                                  }
                                </span>
                              </div>

                              <div className="agenda-item__information">
                                <div className="agenda-item__info">
                                  <UserRound
                                    size={15}
                                    strokeWidth={1.8}
                                  />

                                  <div>
                                    <span>
                                      Responsável
                                    </span>

                                    <strong>
                                      {appointment.professionalName ??
                                        'Não definido'}
                                    </strong>

                                    {appointment.professionalSpecialty && (
                                      <small>
                                        {
                                          appointment.professionalSpecialty
                                        }
                                      </small>
                                    )}
                                  </div>
                                </div>

                                <div className="agenda-item__info">
                                  <HorseshoeIcon
                                    size={15}
                                    strokeWidth={1.8}
                                  />

                                  <div>
                                    <span>
                                      Animal
                                    </span>

                                    <strong>
                                      {appointment.horseName ??
                                        'Não identificado'}
                                    </strong>
                                  </div>
                                </div>

                                {hasServiceAmount && (
                                  <div className="agenda-item__info">
                                    <CircleDollarSign
                                      size={15}
                                      strokeWidth={1.8}
                                    />

                                    <div>
                                      <span>
                                        Valor do serviço
                                      </span>

                                      <strong>
                                        {formatCurrency(
                                          appointment.serviceAmount ??
                                            0,
                                        )}
                                      </strong>

                                      {appointment.paymentRegistered && (
                                        <small className="agenda-item__financial-status agenda-item__financial-status--paid">
                                          Pagamento registrado
                                        </small>
                                      )}

                                      {awaitingPayment && (
                                        <small className="agenda-item__financial-status agenda-item__financial-status--pending">
                                          Aguardando pagamento
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {appointment.description && (
                                  <div className="agenda-item__info agenda-item__info--description">
                                    <FileText
                                      size={15}
                                      strokeWidth={1.8}
                                    />

                                    <div>
                                      <span>
                                        Observação
                                      </span>

                                      <p>
                                        {
                                          appointment.description
                                        }
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="agenda-item__actions">
                              <Link
                                className="agenda-item__edit"
                                to={`/agenda/${appointment.id}/editar`}
                              >
                                <Pencil
                                  size={15}
                                />

                                Editar
                              </Link>

                              {appointment.status ===
                                'pending' && (
                                <button
                                  type="button"
                                  className="agenda-item__complete"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    openCompletionOptions(
                                      appointment.id,
                                    )
                                  }
                                >
                                  <Check
                                    size={15}
                                  />

                                  Concluir
                                </button>
                              )}

                              {awaitingPayment && (
                                <button
                                  type="button"
                                  className="agenda-item__payment"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleRegisterPayment(
                                      appointment,
                                    )
                                  }
                                >
                                  <CircleDollarSign
                                    size={15}
                                  />

                                  {isProcessing
                                    ? 'Registrando...'
                                    : 'Registrar pagamento'}
                                </button>
                              )}

                              {appointment.status ===
                                'completed' &&
                                !awaitingPayment && (
                                <CheckCircle2
                                  className="agenda-item__status-icon agenda-item__status-icon--completed"
                                  size={19}
                                />
                              )}

                              {appointment.status ===
                                'cancelled' && (
                                <XCircle
                                  className="agenda-item__status-icon agenda-item__status-icon--cancelled"
                                  size={19}
                                />
                              )}
                            </div>

                            {completionOpen &&
                              appointment.status ===
                                'pending' && (
                                <div className="agenda-item__completion-panel">
                                  <div className="agenda-item__completion-text">
                                    <strong>
                                      Serviço realizado?
                                    </strong>

                                    {hasServiceAmount ? (
                                      <span>
                                        Se o pagamento de{' '}
                                        {formatCurrency(
                                          appointment.serviceAmount ??
                                            0,
                                        )}{' '}
                                        já foi feito, o aplicativo pode
                                        registrar a despesa no Financeiro
                                        agora.
                                      </span>
                                    ) : (
                                      <span>
                                        Este compromisso não possui valor
                                        cadastrado. Você pode concluí-lo sem
                                        movimentar o caixa.
                                      </span>
                                    )}
                                  </div>

                                  <div className="agenda-item__completion-actions">
                                    {hasServiceAmount && (
                                      <button
                                        type="button"
                                        className="agenda-item__completion-pay"
                                        disabled={
                                          isProcessing
                                        }
                                        onClick={() =>
                                          handleComplete(
                                            appointment,
                                            true,
                                          )
                                        }
                                      >
                                        <CircleDollarSign
                                          size={15}
                                        />

                                        {isProcessing
                                          ? 'Registrando...'
                                          : `Concluir e registrar ${formatCurrency(
                                              appointment.serviceAmount ??
                                                0,
                                            )}`}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      className="agenda-item__completion-only"
                                      disabled={
                                        isProcessing
                                      }
                                      onClick={() =>
                                        handleComplete(
                                          appointment,
                                          false,
                                        )
                                      }
                                    >
                                      <Check
                                        size={15}
                                      />

                                      {isProcessing
                                        ? 'Concluindo...'
                                        : 'Concluir sem pagamento'}
                                    </button>

                                    <button
                                      type="button"
                                      className="agenda-item__completion-cancel"
                                      disabled={
                                        isProcessing
                                      }
                                      onClick={
                                        closeCompletionOptions
                                      }
                                    >
                                      <X
                                        size={15}
                                      />

                                      Voltar
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
              ),
            )}
          </div>
        )}
    </section>
  )
}