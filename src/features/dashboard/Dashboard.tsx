import {
  useEffect,
  useState,
} from 'react'

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Clock,
  ReceiptText,
  WalletCards,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  HorseshoeIcon,
} from '../../components/ui/HorseshoeIcon.tsx'

import type {
  DailyFeedingRoutineItem,
} from '../../domain/feeding.ts'

import type {
  StallMaintenanceAlert,
} from '../../domain/stall.ts'

import {
  getTodayAppointments,
  type AppointmentListItem,
} from '../agenda/appointmentsService.ts'

import {
  getDailyFeedingRoutine,
} from '../feeding/feedingService.ts'

import {
  getDashboardFinancialAttention,
  type DashboardFinancialAttention,
} from '../finance/financeService.ts'

import {
  getInventorySummary,
  type InventoryOperationalSummary,
} from '../inventory/inventoryService.ts'

import {
  getStallMaintenanceAlerts,
} from '../stalls/stallsService.ts'

import './Dashboard.css'

type FinancialAttentionLoadResult = {
  data: DashboardFinancialAttention | null
  error: string | null
}

const emptyFinancialAttention: DashboardFinancialAttention = {
  upcomingCharges: [],
  dueTodayCharges: [],
  overdueCharges: [],
  pendingAppointmentExpenses: [],
  upcomingAmount: 0,
  dueTodayAmount: 0,
  overdueAmount: 0,
  pendingAppointmentExpenseAmount: 0,
}

function getTodayDateKey() {
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

function formatAppointmentTime(
  scheduledAt: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(
      scheduledAt,
    ),
  )
}

function getAppointmentDescription(
  appointment: AppointmentListItem,
) {
  if (
    appointment.horseName
  ) {
    return appointment.horseName
  }

  return 'Cavalo não identificado'
}

function formatAutonomyDays(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      maximumFractionDigits: 1,
    },
  ).format(
    value,
  )
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

function getInventoryAlertLevel(
  summary: InventoryOperationalSummary,
) {
  if (
    summary.currentStock <= 0
  ) {
    return 'danger'
  }

  if (
    summary.autonomyDays !== null &&
    summary.autonomyDays <= 3
  ) {
    return 'danger'
  }

  return 'warning'
}

function getInventoryAlertDetail(
  summary: InventoryOperationalSummary,
) {
  if (
    summary.currentStock <= 0
  ) {
    return 'Produto sem estoque disponível. Reposição necessária.'
  }

  if (
    summary.autonomyDays !== null
  ) {
    return `O estoque atual cobre aproximadamente ${formatAutonomyDays(
      summary.autonomyDays,
    )} dias de consumo planejado.`
  }

  if (
    summary.isBelowMinimum
  ) {
    return 'O estoque atual atingiu ou ficou abaixo do mínimo cadastrado.'
  }

  return 'Reposição recomendada.'
}

function getInventoryPriority(
  summary: InventoryOperationalSummary,
) {
  if (
    summary.currentStock <= 0
  ) {
    return 0
  }

  if (
    summary.autonomyDays !== null &&
    summary.autonomyDays <= 3
  ) {
    return 1
  }

  if (
    summary.autonomyDays !== null
  ) {
    return 2 +
      summary.autonomyDays / 100
  }

  return 3
}

async function loadFinancialAttentionSafely(): Promise<FinancialAttentionLoadResult> {
  try {
    const data =
      await getDashboardFinancialAttention()

    return {
      data,
      error: null,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível consultar as pendências financeiras.'

    return {
      data: null,
      error: message,
    }
  }
}

export function Dashboard() {
  const [
    feedingRoutine,
    setFeedingRoutine,
  ] = useState<
    DailyFeedingRoutineItem[]
  >([])

  const [
    todayAppointments,
    setTodayAppointments,
  ] = useState<
    AppointmentListItem[]
  >([])

  const [
    inventorySummary,
    setInventorySummary,
  ] = useState<
    InventoryOperationalSummary[]
  >([])

  const [
    maintenanceAlerts,
    setMaintenanceAlerts,
  ] = useState<
    StallMaintenanceAlert[]
  >([])

  const [
    financialAttention,
    setFinancialAttention,
  ] = useState<DashboardFinancialAttention>(
    emptyFinancialAttention,
  )

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
    financialError,
    setFinancialError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isMounted =
      true

    async function loadDashboard() {
      try {
        const today =
          getTodayDateKey()

        const [
          feeding,
          appointments,
          inventory,
          maintenance,
          financeResult,
        ] = await Promise.all([
          getDailyFeedingRoutine(
            today,
          ),

          getTodayAppointments(),

          getInventorySummary(),

          getStallMaintenanceAlerts(),

          loadFinancialAttentionSafely(),
        ])

        if (
          !isMounted
        ) {
          return
        }

        setFeedingRoutine(
          feeding,
        )

        setTodayAppointments(
          appointments,
        )

        setInventorySummary(
          inventory,
        )

        setMaintenanceAlerts(
          maintenance,
        )

        setFinancialError(
          financeResult.error,
        )

        if (
          financeResult.data
        ) {
          setFinancialAttention(
            financeResult.data,
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
            : 'Não foi possível carregar o painel.'

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

    loadDashboard()

    return () => {
      isMounted =
        false
    }
  }, [])

  const pendingFeedings =
    feedingRoutine.filter(
      (item) =>
        !item.confirmed,
    )

  const completedFeedings =
    feedingRoutine.length -
    pendingFeedings.length

  const pendingAppointments =
    todayAppointments.filter(
      (appointment) =>
        appointment.status !==
        'completed',
    )

  const replenishmentItems =
    inventorySummary
      .filter(
        (summary) =>
          summary.item.active &&
          summary.needsReplenishment,
      )
      .sort(
        (
          first,
          second,
        ) =>
          getInventoryPriority(
            first,
          ) -
          getInventoryPriority(
            second,
          ),
      )

  const financialAttentionCount =
    financialAttention.upcomingCharges.length +
    financialAttention.dueTodayCharges.length +
    financialAttention.overdueCharges.length +
    financialAttention.pendingAppointmentExpenses.length

  const attentionCount =
    financialAttentionCount +
    replenishmentItems.length +
    maintenanceAlerts.length

  const hasAttentionContent =
    attentionCount >
      0 ||
    financialError !==
      null

  return (
    <section className="dashboard">
      {error && (
        <div className="dashboard-load-error">
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

      <section className="dashboard-priorities">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-heading__eyebrow">
              Hoje no haras
            </span>

            <h2>
              O que precisa da sua atenção
            </h2>
          </div>
        </div>

        <div className="dashboard-operation-grid">
          <Link
            className={`dashboard-operation-card ${
              !loading &&
              pendingFeedings.length >
                0
                ? 'dashboard-operation-card--attention'
                : ''
            }`}
            to="/cavalos/alimentacao-hoje"
          >
            <div className="dashboard-operation-card__top">
              <div className="dashboard-operation-card__icon">
                <HorseshoeIcon
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <ArrowRight
                className="dashboard-operation-card__arrow"
                size={17}
              />
            </div>

            <span className="dashboard-operation-card__label">
              Alimentação
            </span>

            <strong className="dashboard-operation-card__value">
              {loading
                ? '...'
                : pendingFeedings.length}
            </strong>

            <span className="dashboard-operation-card__status">
              {loading
                ? 'Carregando rotina...'
                : pendingFeedings.length ===
                    0
                  ? feedingRoutine.length ===
                    0
                    ? 'Nenhuma alimentação planejada'
                    : 'Tudo confirmado'
                  : pendingFeedings.length ===
                      1
                    ? '1 alimentação pendente'
                    : `${pendingFeedings.length} alimentações pendentes`}
            </span>

            {!loading &&
              feedingRoutine.length >
                0 && (
                <span className="dashboard-operation-card__detail">
                  {completedFeedings} de{' '}
                  {feedingRoutine.length}{' '}
                  concluídas hoje
                </span>
              )}
          </Link>

          <Link
            className={`dashboard-operation-card ${
              !loading &&
              pendingAppointments.length >
                0
                ? 'dashboard-operation-card--attention'
                : ''
            }`}
            to="/agenda"
          >
            <div className="dashboard-operation-card__top">
              <div className="dashboard-operation-card__icon">
                <CalendarDays
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <ArrowRight
                className="dashboard-operation-card__arrow"
                size={17}
              />
            </div>

            <span className="dashboard-operation-card__label">
              Agenda
            </span>

            <strong className="dashboard-operation-card__value">
              {loading
                ? '...'
                : pendingAppointments.length}
            </strong>

            <span className="dashboard-operation-card__status">
              {loading
                ? 'Carregando agenda...'
                : pendingAppointments.length ===
                    0
                  ? 'Nenhum compromisso pendente'
                  : pendingAppointments.length ===
                      1
                    ? '1 compromisso pendente'
                    : `${pendingAppointments.length} compromissos pendentes`}
            </span>

            {!loading && (
              <span className="dashboard-operation-card__detail">
                {todayAppointments.length ===
                0
                  ? 'Agenda livre hoje'
                  : todayAppointments.length ===
                      1
                    ? '1 compromisso no dia'
                    : `${todayAppointments.length} compromissos no dia`}
              </span>
            )}
          </Link>

          <Link
            className={`dashboard-operation-card ${
              !loading &&
              replenishmentItems.length >
                0
                ? 'dashboard-operation-card--attention'
                : ''
            }`}
            to="/estoque"
          >
            <div className="dashboard-operation-card__top">
              <div className="dashboard-operation-card__icon">
                <Boxes
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <ArrowRight
                className="dashboard-operation-card__arrow"
                size={17}
              />
            </div>

            <span className="dashboard-operation-card__label">
              Estoque
            </span>

            <strong className="dashboard-operation-card__value">
              {loading
                ? '...'
                : replenishmentItems.length}
            </strong>

            <span className="dashboard-operation-card__status">
              {loading
                ? 'Calculando autonomia...'
                : replenishmentItems.length ===
                    0
                  ? 'Estoque sob controle'
                  : replenishmentItems.length ===
                      1
                    ? '1 produto para repor'
                    : `${replenishmentItems.length} produtos para repor`}
            </span>

            {!loading && (
              <span className="dashboard-operation-card__detail">
                {replenishmentItems.length ===
                0
                  ? 'Nenhuma compra urgente'
                  : 'Planeje a reposição antes de faltar'}
              </span>
            )}
          </Link>
        </div>
      </section>

      <section className="dashboard-attention">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-heading__eyebrow">
              Atenção
            </span>

            <h2>
              Pontos importantes
            </h2>
          </div>

          <span
            className={`dashboard-attention__count ${
              !loading &&
              attentionCount ===
                0 &&
              !financialError
                ? 'dashboard-attention__count--clear'
                : ''
            }`}
          >
            {loading
              ? '...'
              : financialError
                ? '!'
                : attentionCount}
          </span>
        </div>

        {loading && (
          <div className="dashboard-attention-list">
            <div className="dashboard-alert">
              <Clock
                size={18}
                strokeWidth={1.8}
              />

              <div>
                <strong>
                  Verificando operação...
                </strong>

                <span>
                  Estamos reunindo os pontos que merecem atenção hoje.
                </span>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          !hasAttentionContent && (
            <div className="dashboard-attention-list">
              <div className="dashboard-alert dashboard-alert--empty">
                <CheckCircle2
                  size={18}
                  strokeWidth={1.8}
                />

                <div>
                  <strong>
                    Tudo sob controle
                  </strong>

                  <span>
                    Não há alertas financeiros, de estoque ou de manutenção
                    neste momento.
                  </span>
                </div>
              </div>
            </div>
          )}

        {!loading &&
          hasAttentionContent && (
            <div className="dashboard-attention-list">
              {financialError && (
                <div className="dashboard-alert dashboard-alert--warning">
                  <AlertTriangle
                    size={18}
                    strokeWidth={1.8}
                  />

                  <div>
                    <strong>
                      Financeiro não pôde ser atualizado
                    </strong>

                    <span>
                      {financialError}
                    </span>
                  </div>

                  <span className="dashboard-alert__source">
                    Financeiro
                  </span>
                </div>
              )}

              {financialAttention.overdueCharges.length >
                0 && (
                <Link
                  className="dashboard-alert dashboard-alert--danger dashboard-alert--finance dashboard-alert--clickable"
                  to="/financeiro"
                >
                  <WalletCards
                    size={18}
                    strokeWidth={1.8}
                  />

                  <div>
                    <strong>
                      Mensalidades em atraso
                    </strong>

                    <span>
                      {financialAttention.overdueCharges.length ===
                      1
                        ? `1 cobrança vencida somando ${formatCurrency(
                            financialAttention.overdueAmount,
                          )}.`
                        : `${financialAttention.overdueCharges.length} cobranças vencidas somando ${formatCurrency(
                            financialAttention.overdueAmount,
                          )}.`}{' '}
                      Abra o Financeiro para registrar o recebimento.
                    </span>
                  </div>

                  <span className="dashboard-alert__source">
                    Financeiro
                  </span>
                </Link>
              )}

              {financialAttention.dueTodayCharges.length >
                0 && (
                <Link
                  className="dashboard-alert dashboard-alert--warning dashboard-alert--finance dashboard-alert--clickable"
                  to="/financeiro"
                >
                  <WalletCards
                    size={18}
                    strokeWidth={1.8}
                  />

                  <div>
                    <strong>
                      Mensalidades vencem hoje
                    </strong>

                    <span>
                      {financialAttention.dueTodayCharges.length ===
                      1
                        ? `1 cobrança vence hoje no valor de ${formatCurrency(
                            financialAttention.dueTodayAmount,
                          )}.`
                        : `${financialAttention.dueTodayCharges.length} cobranças vencem hoje somando ${formatCurrency(
                            financialAttention.dueTodayAmount,
                          )}.`}
                    </span>
                  </div>

                  <span className="dashboard-alert__source">
                    Financeiro
                  </span>
                </Link>
              )}

              {financialAttention.upcomingCharges.length >
                0 && (
                <Link
                  className="dashboard-alert dashboard-alert--upcoming dashboard-alert--finance dashboard-alert--clickable"
                  to="/financeiro"
                >
                  <WalletCards
                    size={18}
                    strokeWidth={1.8}
                  />

                  <div>
                    <strong>
                      Próximos vencimentos
                    </strong>

                    <span>
                      {financialAttention.upcomingCharges.length ===
                      1
                        ? `1 mensalidade vence nos próximos 3 dias, no valor de ${formatCurrency(
                            financialAttention.upcomingAmount,
                          )}.`
                        : `${financialAttention.upcomingCharges.length} mensalidades vencem nos próximos 3 dias, somando ${formatCurrency(
                            financialAttention.upcomingAmount,
                          )}.`}
                    </span>
                  </div>

                  <span className="dashboard-alert__source">
                    Financeiro
                  </span>
                </Link>
              )}

              {financialAttention.pendingAppointmentExpenses.length >
                0 && (
                <Link
                  className="dashboard-alert dashboard-alert--warning dashboard-alert--finance dashboard-alert--clickable"
                  to="/financeiro"
                >
                  <ReceiptText
                    size={18}
                    strokeWidth={1.8}
                  />

                  <div>
                    <strong>
                      Serviços aguardando pagamento
                    </strong>

                    <span>
                      {financialAttention.pendingAppointmentExpenses.length ===
                      1
                        ? `1 serviço concluído ainda aguarda pagamento, no valor de ${formatCurrency(
                            financialAttention.pendingAppointmentExpenseAmount,
                          )}.`
                        : `${financialAttention.pendingAppointmentExpenses.length} serviços concluídos ainda aguardam pagamento, somando ${formatCurrency(
                            financialAttention.pendingAppointmentExpenseAmount,
                          )}.`}
                    </span>
                  </div>

                  <span className="dashboard-alert__source">
                    Financeiro
                  </span>
                </Link>
              )}

              {replenishmentItems.map(
                (summary) => {
                  const level =
                    getInventoryAlertLevel(
                      summary,
                    )

                  return (
                    <Link
                      className={`dashboard-alert dashboard-alert--${level} dashboard-alert--clickable`}
                      key={`inventory-${summary.item.id}`}
                      to="/estoque"
                    >
                      <AlertTriangle
                        size={18}
                        strokeWidth={1.8}
                      />

                      <div>
                        <strong>
                          {summary.item.name}
                        </strong>

                        <span>
                          {getInventoryAlertDetail(
                            summary,
                          )}
                        </span>
                      </div>

                      <span className="dashboard-alert__source">
                        Estoque
                      </span>
                    </Link>
                  )
                },
              )}

              {maintenanceAlerts.map(
                (alert) => (
                  <Link
                    className={`dashboard-alert dashboard-alert--${alert.urgency} dashboard-alert--clickable`}
                    key={`stall-${alert.stallId}`}
                    to="/baias"
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

                    <span className="dashboard-alert__source">
                      Baias
                    </span>
                  </Link>
                ),
              )}
            </div>
          )}
      </section>

      <section className="dashboard-agenda">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-section-heading__eyebrow">
              Rotina de hoje
            </span>

            <h2>
              Compromissos
            </h2>
          </div>

          <Link
            className="dashboard-section-heading__action"
            to="/agenda"
          >
            Ver agenda

            <ArrowRight
              size={14}
            />
          </Link>
        </div>

        {loading && (
          <div className="appointments">
            <div className="appointment appointment--simple">
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
              <div className="appointment appointment--empty">
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
                        {appointment.title}
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
      </section>
    </section>
  )
}