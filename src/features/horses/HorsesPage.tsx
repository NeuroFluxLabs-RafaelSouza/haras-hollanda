import { useEffect, useMemo, useState } from 'react'
import {
  CircleDollarSign,
  DoorOpen,
  Plus,
  Search,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import type {
  HorseListItem,
} from './horsesService.ts'

import {
  getHorses,
} from './horsesService.ts'

import './HorsesPage.css'

function formatMonthlyFee(value: number | null) {
  if (value === null) {
    return 'Não informada'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getSexLabel(
  sex: HorseListItem['sex'],
) {
  return sex === 'male'
    ? 'Macho'
    : 'Fêmea'
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function HorsesPage() {
  const [horses, setHorses] = useState<
    HorseListItem[]
  >([])

  const [search, setSearch] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadHorses() {
      try {
        const data = await getHorses()

        if (isMounted) {
          setHorses(data)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os cavalos.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadHorses()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredHorses = useMemo(() => {
    const normalizedSearch =
      normalizeText(search)

    if (!normalizedSearch) {
      return horses
    }

    return horses.filter((horse) => {
      const searchableContent = [
        horse.name,
        horse.breed ?? '',
        horse.clientName,
        horse.stallName ?? '',
      ]

      return searchableContent.some(
        (value) =>
          normalizeText(value).includes(
            normalizedSearch,
          ),
      )
    })
  }, [horses, search])

  const horseCountLabel =
    horses.length === 1
      ? '1 cavalo cadastrado'
      : `${horses.length} cavalos cadastrados`

  return (
    <section className="horses-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Gestão dos animais
        </p>

        <h1 className="page-header__title">
          Cavalos
        </h1>

        <p className="page-header__description">
          Consulte os animais, responsáveis, baias e mensalidades do haras.
        </p>
      </header>

      <div className="horses-toolbar">
        <span className="horses-toolbar__count">
          {horseCountLabel}
        </span>

        <div className="horses-toolbar__actions">
          <div className="horses-search">
            <Search
              size={16}
              strokeWidth={1.8}
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar cavalo..."
              aria-label="Buscar cavalo"
            />
          </div>

          <Link
            className="horses-add-button"
            to="/cavalos/novo"
          >
            <Plus size={17} />
            Novo cavalo
          </Link>
        </div>
      </div>

      {loading && (
        <div className="horses-state">
          Carregando cavalos...
        </div>
      )}

      {error && (
        <div className="horses-state horses-state--error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        horses.length === 0 && (
          <div className="horses-empty">
            <strong>
              Nenhum cavalo cadastrado
            </strong>

            <span>
              Cadastre o primeiro cavalo para começar a organizar os animais
              do haras.
            </span>

            <Link
              className="horses-add-button"
              to="/cavalos/novo"
            >
              <Plus size={17} />
              Novo cavalo
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        horses.length > 0 &&
        filteredHorses.length === 0 && (
          <div className="horses-state">
            Nenhum cavalo encontrado para “{search}”.
          </div>
        )}

      {!loading &&
        !error &&
        filteredHorses.length > 0 && (
          <div className="horses-grid">
            {filteredHorses.map(
              (horse) => (
                <article
                  className="horse-card"
                  key={horse.id}
                >
                  <div className="horse-card__header">
                    <div>
                      <h2 className="horse-card__name">
                        {horse.name}
                      </h2>

                      <span className="horse-card__breed">
                        {horse.breed ??
                          'Raça não informada'}
                      </span>
                    </div>

                    <span
                      className={`horse-card__status ${
                        horse.active
                          ? 'horse-card__status--active'
                          : 'horse-card__status--inactive'
                      }`}
                    >
                      {horse.active
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>
                  </div>

                  <div className="horse-card__sex">
                    {getSexLabel(
                      horse.sex,
                    )}
                  </div>

                  <div className="horse-card__details">
                    <div className="horse-card__detail">
                      <div className="horse-card__detail-icon">
                        <UserRound
                          size={17}
                          strokeWidth={1.7}
                        />
                      </div>

                      <div>
                        <span>
                          Responsável
                        </span>

                        <strong>
                          {horse.clientName}
                        </strong>
                      </div>
                    </div>

                    <div className="horse-card__detail">
                      <div className="horse-card__detail-icon">
                        <DoorOpen
                          size={17}
                          strokeWidth={1.7}
                        />
                      </div>

                      <div>
                        <span>
                          Baia
                        </span>

                        <strong>
                          {horse.stallName ??
                            'Sem baia'}
                        </strong>
                      </div>
                    </div>

                    <div className="horse-card__detail">
                      <div className="horse-card__detail-icon">
                        <CircleDollarSign
                          size={17}
                          strokeWidth={1.7}
                        />
                      </div>

                      <div>
                        <span>
                          Mensalidade
                        </span>

                        <strong>
                          {formatMonthlyFee(
                            horse.monthlyFee,
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
    </section>
  )
}