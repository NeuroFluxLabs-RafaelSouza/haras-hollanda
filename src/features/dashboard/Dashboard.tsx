import { CheckCircle2, Clock } from 'lucide-react'
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
    value: '2',
    detail: 'Precisam de atenção',
  },
]

const alerts = [
  {
    title: 'Estoque de Ração Premium baixo',
    detail: 'Restam aproximadamente 3 dias',
  },
  {
    title: 'Vacina do Apache próxima',
    detail: 'Agendada para amanhã',
  },
]

export function Dashboard() {
  return (
    <section className="dashboard">
        <div className="dashboard-metrics">
  {metrics.map((metric) => (
    <article className="metric-card" key={metric.label}>
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
      <span className="dashboard-section__eyebrow">Atenção</span>
      <h2>Alertas</h2>
    </div>

    <span className="dashboard-alerts__count">
      {alerts.length}
    </span>
  </div>

  <div className="dashboard-alerts__list">
    {alerts.map((alert) => (
      <div className="dashboard-alert" key={alert.title}>
        <div>
          <strong>{alert.title}</strong>
          <span>{alert.detail}</span>
        </div>
      </div>
    ))}
  </div>
</div>


      <div className="dashboard-section">
        <div className="dashboard-section__header">
          <div>
            <span className="dashboard-section__eyebrow">Hoje</span>
            <h2>Compromissos</h2>
          </div>

          <button type="button" className="dashboard-section__action">
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
                <strong>{appointment.title}</strong>
                <span>{appointment.description}</span>
              </div>

              <span
                className={`appointment__status ${
                  appointment.completed
                    ? 'appointment__status--completed'
                    : ''
                }`}
              >
                {appointment.completed ? 'Concluído' : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}