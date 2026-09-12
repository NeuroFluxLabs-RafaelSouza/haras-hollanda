import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

import type {
  StallMaintenanceAlert,
} from '../../domain/stall.ts'

import {
  getStallMaintenanceAlerts,
} from '../stalls/stallsService.ts'

import './Dashboard.css'

const appointments = [
  {
    time: '07:00',
    title: 'Alimentação da manhã',
    description: '23 cavalos',
    completed: true,
  },
  {
    time: '10:30',
    title: 'Ferrageamento',
    description: 'Apache',
    completed: false,
  },
  {
    time: '17:00',
    title: 'Alimentação da tarde',
    description: '23 cavalos',
    completed: false,
  },
]

export function Dashboard() {
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<
    StallMaintenanceAlert[]
  >([])

  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadMaintenanceAlerts() {
      try {
        const alerts = await getStallMaintenanceAlerts()

        if (isMounted) {
          setMaintenanceAlerts(alerts)
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os alertas.'

          setAlertsError(message)
        }
      } finally {
        if (isMounted) {
          setAlertsLoading(false)
        }
      }
    }

    loadMaintenanceAlerts()

    return () => {
      isMounted = false
    }
  }, [])

  const metrics = [
    {
      label: 'Cavalos ativos',
      value: '23',
      detail: 'Todos acompanhados',
    },
    {
      label: 'Baias livres',
      value: '4',
      detail: 'de 23 baias',
    },
    {
      label: 'Alertas',
      value: alertsLoading
        ? '...'
        : String(maintenanceAlerts.length),
      detail:
        maintenanceAlerts.length === 1
          ? 'Precisa de atenção'
          : 'Precisam de atenção',
    },
  ]

  return (
    <section className="dashboard">
      <div className="dashboard-metrics">
        {metrics.map((metric) => (
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
        ))}
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
            {alertsLoading
              ? '...'
              : maintenanceAlerts.length}
          </span>
        </div>

        {alertsLoading && (
          <div className="dashboard-alert">
            <div>
              <strong>
                Carregando alertas...
              </strong>
            </div>
          </div>
        )}

        {alertsError && (
          <div className="dashboard-alert dashboard-alert--danger">
            <AlertTriangle
              size={18}
              strokeWidth={1.8}
            />

            <div>
              <strong>
                Não foi possível carregar os alertas
              </strong>

              <span>
                {alertsError}
              </span>
            </div>
          </div>
        )}

        {!alertsLoading &&
          !alertsError &&
          maintenanceAlerts.length === 0 && (
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

        {!alertsLoading &&
          !alertsError &&
          maintenanceAlerts.length > 0 && (
            <div className="dashboard-alerts__list">
              {maintenanceAlerts.map((alert) => (
                <div
                  className={`dashboard-alert dashboard-alert--${alert.urgency}`}
                  key={alert.stallId}
                >
                  <AlertTriangle
                    size={18}
                    strokeWidth={1.8}
                  />

                  <div>
                    <strong>
                      {alert.message}
                    </strong>

                    <span>
                      {alert.detail}
                    </span>
                  </div>
                </div>
              ))}
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

          <button
            type="button"
            className="dashboard-section__action"
          >
            Ver agenda
          </button>
        </div>

        <div className="appointments">
          {appointments.map((appointment) => (
            <div
              className="appointment"
              key={`${appointment.time}-${appointment.title}`}
            >
              <div
                className={`appointment__icon ${
                  appointment.completed
                    ? 'appointment__icon--completed'
                    : ''
                }`}
              >
                {appointment.completed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Clock size={18} />
                )}
              </div>

              <div className="appointment__time">
                {appointment.time}
              </div>

              <div className="appointment__content">
                <strong>
                  {appointment.title}
                </strong>

                <span>
                  {appointment.description}
                </span>
              </div>

              <span
                className={`appointment__status ${
                  appointment.completed
                    ? 'appointment__status--completed'
                    : ''
                }`}
              >
                {appointment.completed
                  ? 'Concluído'
                  : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}