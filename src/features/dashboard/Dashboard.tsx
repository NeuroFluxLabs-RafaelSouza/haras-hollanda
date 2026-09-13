import {
  useEffect,
  useState,
} from 'react'

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import type {
  StallMaintenanceAlert,
} from '../../domain/stall.ts'

import {
  getTodayAppointments,
  type AppointmentListItem,
} from '../agenda/appointmentsService.ts'

import {
  getHorses,
  type HorseListItem,
} from '../horses/horsesService.ts'

import {
  getStallMaintenanceAlerts,
  getStalls,
} from '../stalls/stallsService.ts'

import './Dashboard.css'

type DashboardStats = {
  activeHorses: number
  availableStalls: number
  operationalStalls: number
}

const initialStats: DashboardStats = {
  activeHorses: 0,
  availableStalls: 0,
  operationalStalls: 0,
}

function getOccupiedStallIds(
  horses: HorseListItem[],
) {
  return new Set(
    horses
      .filter(
        (horse) =>
          horse.active &&
          horse.stallId !== null,
      )
      .map(
        (horse) =>
          horse.stallId as string,
      ),
  )
}

function formatAppointmentTime(
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

function getAppointmentDescription(
  appointment: AppointmentListItem,
) {
  if (appointment.horseName) {
    return appointment.horseName
  }

  return 'Cavalo não identificado'
}

export function Dashboard() {
  const [
    stats,
    setStats,
  ] = useState<DashboardStats>(
    initialStats,
  )

  const [
    maintenanceAlerts,
    setMaintenanceAlerts,
  ] = useState<StallMaintenanceAlert[]>(
    [],
  )

  const [
    todayAppointments,
    setTodayAppointments,
  ] = useState<AppointmentListItem[]>(
    [],
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const [
          horses,
          stalls,
          alerts,
          appointments,
        ] = await Promise.all([
          getHorses(),
          getStalls(),
          getStallMaintenanceAlerts(),
          getTodayAppointments(),
        ])

        if (!isMounted) {
          return
        }

        const activeHorses =
          horses.filter(
            (horse) =>
              horse.active,
          )

        const occupiedStallIds =
          getOccupiedStallIds(
            activeHorses,
          )

        const operationalStalls =
          stalls.filter(
            (stall) =>
              stall.status ===
              'operational',
          )

        const availableStalls =
          operationalStalls.filter(
            (stall) =>
              !occupiedStallIds.has(
                stall.id,
              ),
          )

        setStats({
          activeHorses:
            activeHorses.length,

          availableStalls:
            availableStalls.length,

          operationalStalls:
            operationalStalls.length,
        })

        setMaintenanceAlerts(
          alerts,
        )

        setTodayAppointments(
          appointments,
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o dashboard.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const metrics = [
    {
      label: 'Cavalos ativos',

      value: loading
        ? '...'
        : String(
            stats.activeHorses,
          ),

      detail:
        stats.activeHorses === 1
          ? '1 animal acompanhado'
          : `${stats.activeHorses} animais acompanhados`,
    },

    {
      label: 'Baias livres',

      value: loading
        ? '...'
        : String(
            stats.availableStalls,
          ),

      detail:
        loading
          ? 'Carregando...'
          : `das ${stats.operationalStalls} operacionais`,
    },

    {
      label: 'Alertas',

      value: loading
        ? '...'
        : String(
            maintenanceAlerts.length,
          ),

      detail:
        maintenanceAlerts.length === 1
          ? 'Precisa de atenção'
          : 'Precisam de atenção',
    },
  ]

  return (
    <section className="dashboard">
      {error && (
        <div className="dashboard-alert dashboard-alert--danger">
          <AlertTriangle
            size={18}
            strokeWidth={1.8}
          />

          <div>
            <strong>
              Não foi possível atualizar o painel
            </strong>

            <span>
              {error}
            </span>
          </div>
        </div>
      )}

      <div className="dashboard-metrics">
        {metrics.map(
          (metric) => (
            <article
              className="metric-card"
              key={metric.label}
            >
              <span className="metric-card__label">
                {metric.label}
              </span>

              <strong className="metric-card__value">
                {metric.value}
              </strong>

              <span className="metric-card__detail">
                {metric.detail}
              </span>
            </article>
          ),
        )}
      </div>

      <div className="dashboard-alerts">
        <div className="dashboard-alerts__header">
          <div>
            <span className="dashboard-section__eyebrow">
              Atenção
            </span>

            <h2>
              Alertas
            </h2>
          </div>

          <span className="dashboard-alerts__count">
            {loading
              ? '...'
              : maintenanceAlerts.length}
          </span>
        </div>

        {loading && (
          <div className="dashboard-alert">
            <div>
              <strong>
                Carregando alertas...
              </strong>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          maintenanceAlerts.length ===
            0 && (
            <div className="dashboard-alert dashboard-alert--empty">
              <CheckCircle2
                size={18}
                strokeWidth={1.8}
              />

              <div>
                <strong>
                  Nenhum alerta operacional
                </strong>

                <span>
                  Não há manutenções vencidas ou próximas do vencimento.
                </span>
              </div>
            </div>
          )}

        {!loading &&
          maintenanceAlerts.length >
            0 && (
            <div className="dashboard-alerts__list">
              {maintenanceAlerts.map(
                (alert) => (
                  <div
                    className={`dashboard-alert dashboard-alert--${alert.urgency}`}
                    key={
                      alert.stallId
                    }
                  >
                    <AlertTriangle
                      size={18}
                      strokeWidth={1.8}
                    />

                    <div>
                      <strong>
                        {
                          alert.message
                        }
                      </strong>

                      <span>
                        {
                          alert.detail
                        }
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section__header">
          <div>
            <span className="dashboard-section__eyebrow">
              Hoje
            </span>

            <h2>
              Compromissos
            </h2>
          </div>

          <Link
            className="dashboard-section__action"
            to="/agenda"
          >
            Ver agenda
          </Link>
        </div>

        {loading && (
          <div className="appointments">
            <div className="appointment">
              <div className="appointment__content">
                <strong>
                  Carregando compromissos...
                </strong>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          todayAppointments.length ===
            0 && (
            <div className="appointments">
              <div className="appointment">
                <div className="appointment__icon appointment__icon--completed">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <div className="appointment__content">
                  <strong>
                    Nenhum compromisso para hoje
                  </strong>

                  <span>
                    A agenda do dia está livre.
                  </span>
                </div>
              </div>
            </div>
          )}

        {!loading &&
          todayAppointments.length >
            0 && (
            <div className="appointments">
              {todayAppointments.map(
                (appointment) => (
                  <Link
                    className="appointment appointment--clickable"
                    key={
                      appointment.id
                    }
                    to={`/agenda?appointment=${appointment.id}`}
                    aria-label={`Abrir compromisso ${appointment.title} de ${getAppointmentDescription(
                      appointment,
                    )}`}
                  >
                    <div
                      className={`appointment__icon ${
                        appointment.status ===
                        'completed'
                          ? 'appointment__icon--completed'
                          : ''
                      }`}
                    >
                      {appointment.status ===
                      'completed' ? (
                        <CheckCircle2
                          size={18}
                        />
                      ) : (
                        <Clock
                          size={18}
                        />
                      )}
                    </div>

                    <div className="appointment__time">
                      {formatAppointmentTime(
                        appointment.scheduledAt,
                      )}
                    </div>

                    <div className="appointment__content">
                      <strong>
                        {
                          appointment.title
                        }
                      </strong>

                      <span>
                        {getAppointmentDescription(
                          appointment,
                        )}
                      </span>
                    </div>

                    <span
                      className={`appointment__status ${
                        appointment.status ===
                        'completed'
                          ? 'appointment__status--completed'
                          : ''
                      }`}
                    >
                      {appointment.status ===
                      'completed'
                        ? 'Concluído'
                        : 'Pendente'}
                    </span>
                  </Link>
                ),
              )}
            </div>
          )}
      </div>
    </section>
  )
}