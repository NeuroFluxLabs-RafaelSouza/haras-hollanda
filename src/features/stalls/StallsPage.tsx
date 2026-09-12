import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  DoorOpen,
  Plus,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import type {
  Stall,
  StallStatus,
} from '../../domain/stall.ts'

import { getStalls } from './stallsService.ts'

import './StallsPage.css'

const stallStatusLabels: Record<StallStatus, string> = {
  operational: 'Operacional',
  maintenance: 'Em manutenção',
  inactive: 'Inativa',
}

function formatMaintenanceDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(`${date}T00:00:00`),
  )
}

export function StallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadStalls() {
      try {
        const data = await getStalls()

        if (isMounted) {
          setStalls(data)
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as baias.'

          setError(message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStalls()

    return () => {
      isMounted = false
    }
  }, [])

  const stallCountLabel =
    stalls.length === 1
      ? '1 baia cadastrada'
      : `${stalls.length} baias cadastradas`

  return (
    <section className="stalls-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Gestão de ocupação
        </p>

        <h1 className="page-header__title">
          Baias
        </h1>

        <p className="page-header__description">
          Acompanhe condições operacionais, manutenções e observações das
          baias.
        </p>
      </header>

      <div className="stalls-toolbar">
        <span className="stalls-toolbar__count">
          {stallCountLabel}
        </span>

        <Link
          className="stalls-add-button"
          to="/baias/nova"
        >
          <Plus size={17} />
          Nova baia
        </Link>
      </div>

      {loading && (
        <div className="stalls-state">
          Carregando baias...
        </div>
      )}

      {error && (
        <div className="stalls-state stalls-state--error">
          {error}
        </div>
      )}

      {!loading && !error && stalls.length === 0 && (
        <div className="stalls-empty">
          <DoorOpen
            size={24}
            strokeWidth={1.6}
          />

          <strong>
            Nenhuma baia cadastrada
          </strong>

          <span>
            Cadastre a primeira baia para começar a organizar a operação do
            haras.
          </span>

          <Link
            className="stalls-add-button"
            to="/baias/nova"
          >
            <Plus size={17} />
            Nova baia
          </Link>
        </div>
      )}

      {!loading && !error && stalls.length > 0 && (
        <div className="stalls-grid">
          {stalls.map((stall) => (
            <article
              className="stall-card"
              key={stall.id}
            >
              <div className="stall-card__header">
                <div className="stall-card__identity">
                  <div className="stall-card__icon">
                    {stall.status === 'maintenance' ? (
                      <Wrench
                        size={20}
                        strokeWidth={1.7}
                      />
                    ) : (
                      <DoorOpen
                        size={20}
                        strokeWidth={1.7}
                      />
                    )}
                  </div>

                  <div>
                    <h2 className="stall-card__name">
                      {stall.name}
                    </h2>

                    <span className="stall-card__subtitle">
                      Unidade de alojamento
                    </span>
                  </div>
                </div>

                <span
                  className={`stall-card__status stall-card__status--${stall.status}`}
                >
                  {stallStatusLabels[stall.status]}
                </span>
              </div>

              <div className="stall-card__body">
                <div className="stall-card__section">
                  <span className="stall-card__label">
                    Observação
                  </span>

                  <p className="stall-card__notes">
                    {stall.notes ??
                      'Nenhuma observação registrada.'}
                  </p>
                </div>

                {stall.status === 'maintenance' && (
                  <div className="stall-card__maintenance">
                    <AlertTriangle
                      size={16}
                      strokeWidth={1.8}
                    />

                    <div>
                      <span>
                        Manutenção em andamento
                      </span>

                      <strong>
                        {stall.maintenanceUntil
                          ? `Previsão: ${formatMaintenanceDate(
                              stall.maintenanceUntil,
                            )}`
                          : 'Sem previsão de liberação'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="stall-card__actions">
                <Link
                  className="stall-card__manage"
                  to={`/baias/${stall.id}/gerenciar`}
                >
                  Gerenciar baia
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}