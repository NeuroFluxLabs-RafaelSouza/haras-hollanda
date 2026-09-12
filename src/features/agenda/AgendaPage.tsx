import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  PawPrint,
  Plus,
  XCircle,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import {
  APPOINTMENT_EVENT_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from '../../domain/appointment.ts'

import {
  getAppointments,
  type AppointmentListItem,
  updateAppointmentStatus,
} from './appointmentsService.ts'

import './AgendaPage.css'

function formatDateLabel(
  scheduledAt: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  ).format(new Date(scheduledAt))
}

function formatTime(
  scheduledAt: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(scheduledAt))
}

function getDateKey(
  scheduledAt: string,
) {
  const date = new Date(scheduledAt)

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function AgendaPage() {
  const [
    appointments,
    setAppointments,
  ] = useState<AppointmentListItem[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    updatingAppointmentId,
    setUpdatingAppointmentId,
  ] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadAppointments() {
      try {
        const data =
          await getAppointments()

        if (isMounted) {
          setAppointments(data)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a agenda.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAppointments()

    return () => {
      isMounted = false
    }
  }, [])

  const groupedAppointments =
    useMemo(() => {
      const groups = new Map<
        string,
        AppointmentListItem[]
      >()

      appointments.forEach(
        (appointment) => {
          const key = getDateKey(
            appointment.scheduledAt,
          )

          const existing =
            groups.get(key) ?? []

          existing.push(appointment)

          groups.set(
            key,
            existing,
          )
        },
      )

      return Array.from(
        groups.entries(),
      )
    }, [appointments])

  async function handleComplete(
    appointmentId: string,
  ) {
    setError(null)

    setUpdatingAppointmentId(
      appointmentId,
    )

    try {
      await updateAppointmentStatus(
        appointmentId,
        'completed',
      )

      setAppointments(
        (currentAppointments) =>
          currentAppointments.map(
            (appointment) =>
              appointment.id ===
              appointmentId
                ? {
                    ...appointment,
                    status: 'completed',
                  }
                : appointment,
          ),
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir o compromisso.'

      setError(message)
    } finally {
      setUpdatingAppointmentId(null)
    }
  }

  const appointmentCountLabel =
    appointments.length === 1
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
          Organize atendimentos, manejos e atividades programadas do haras.
        </p>
      </header>

      <div className="agenda-toolbar">
        <span className="agenda-toolbar__count">
          {appointmentCountLabel}
        </span>

        <Link
          className="agenda-add-button"
          to="/agenda/novo"
        >
          <Plus size={17} />
          Novo compromisso
        </Link>
      </div>

      {error && (
        <div className="agenda-state agenda-state--error">
          {error}
        </div>
      )}

      {loading && (
        <div className="agenda-state">
          Carregando agenda...
        </div>
      )}

      {!loading &&
        !error &&
        appointments.length === 0 && (
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
        groupedAppointments.length > 0 && (
          <div className="agenda-groups">
            {groupedAppointments.map(
              ([dateKey, items]) => (
                <section
                  className="agenda-group"
                  key={dateKey}
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
                      (appointment) => (
                        <article
                          className={`agenda-item agenda-item--${appointment.status}`}
                          key={appointment.id}
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
                              <div>
                                <h2>
                                  {appointment.title}
                                </h2>

                                <span className="agenda-item__type">
                                  {
                                    APPOINTMENT_EVENT_LABELS[
                                      appointment.eventType
                                    ]
                                  }
                                </span>
                              </div>

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

                            {appointment.horseName && (
                              <div className="agenda-item__horse">
                                <PawPrint
                                  size={15}
                                  strokeWidth={1.8}
                                />

                                <span>
                                  {appointment.horseName}
                                </span>
                              </div>
                            )}

                            {appointment.description && (
                              <p className="agenda-item__description">
                                {appointment.description}
                              </p>
                            )}
                          </div>

                          <div className="agenda-item__actions">
                            {appointment.status ===
                              'pending' && (
                              <button
                                type="button"
                                className="agenda-item__complete"
                                disabled={
                                  updatingAppointmentId ===
                                  appointment.id
                                }
                                onClick={() =>
                                  handleComplete(
                                    appointment.id,
                                  )
                                }
                              >
                                <Check size={15} />

                                {updatingAppointmentId ===
                                appointment.id
                                  ? 'Salvando...'
                                  : 'Concluir'}
                              </button>
                            )}

                            {appointment.status ===
                              'completed' && (
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
                        </article>
                      ),
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