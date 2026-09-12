import { useEffect, useState } from 'react'
import { DoorOpen, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Stall } from '../../domain/stall.ts'
import { getStalls } from './stallsService.ts'

import './StallsPage.css'

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
          Acompanhe a disponibilidade e organização das baias do haras.
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
          <DoorOpen size={24} strokeWidth={1.6} />

          <strong>Nenhuma baia cadastrada</strong>

          <span>
            Cadastre a primeira baia para começar a organizar a ocupação do
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
              <div className="stall-card__icon">
                <DoorOpen size={20} strokeWidth={1.7} />
              </div>

              <div className="stall-card__content">
                <h2 className="stall-card__name">
                  {stall.name}
                </h2>

                <span className="stall-card__description">
                  Unidade de alojamento
                </span>
              </div>

              <span
                className={
                  stall.active
                    ? 'stall-card__status'
                    : 'stall-card__status stall-card__status--inactive'
                }
              >
                {stall.active ? 'Ativa' : 'Inativa'}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}