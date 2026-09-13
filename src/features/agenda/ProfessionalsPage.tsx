import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeft,
  Phone,
  Plus,
  Search,
  UserRound,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import type {
  Professional,
} from '../../domain/professional.ts'

import {
  getProfessionals,
} from './professionalsService.ts'

import './ProfessionalsPage.css'

function normalizeText(
  value: string,
) {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .trim()
}

export function ProfessionalsPage() {
  const [
    professionals,
    setProfessionals,
  ] = useState<Professional[]>(
    [],
  )

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  useEffect(() => {
    let isMounted = true

    async function loadProfessionals() {
      try {
        const data =
          await getProfessionals()

        if (isMounted) {
          setProfessionals(data)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os profissionais.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProfessionals()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredProfessionals =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(search)

      if (!normalizedSearch) {
        return professionals
      }

      return professionals.filter(
        (professional) => {
          const searchableContent = [
            professional.name,
            professional.specialty ?? '',
            professional.phone ?? '',
          ]

          return searchableContent.some(
            (value) =>
              normalizeText(
                value,
              ).includes(
                normalizedSearch,
              ),
          )
        },
      )
    }, [
      professionals,
      search,
    ])

  const professionalCountLabel =
    professionals.length === 1
      ? '1 profissional cadastrado'
      : `${professionals.length} profissionais cadastrados`

  return (
    <section className="professionals-page">
      <header className="professionals-header">
        <Link
          className="professionals-header__back"
          to="/agenda"
        >
          <ArrowLeft size={17} />
          Voltar à agenda
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Equipe e prestadores
          </p>

          <h1 className="page-header__title">
            Profissionais
          </h1>

          <p className="page-header__description">
            Cadastre os responsáveis pelos serviços realizados no haras.
          </p>
        </div>
      </header>

      <div className="professionals-toolbar">
        <span className="professionals-toolbar__count">
          {professionalCountLabel}
        </span>

        <div className="professionals-toolbar__actions">
          <div className="professionals-search">
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
              placeholder="Buscar profissional..."
              aria-label="Buscar profissional"
            />
          </div>

          <Link
            className="professionals-add-button"
            to="/agenda/profissionais/novo"
          >
            <Plus size={17} />
            Novo profissional
          </Link>
        </div>
      </div>

      {loading && (
        <div className="professionals-state">
          Carregando profissionais...
        </div>
      )}

      {error && (
        <div className="professionals-state professionals-state--error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        professionals.length === 0 && (
          <div className="professionals-empty">
            <UserRound
              size={26}
              strokeWidth={1.6}
            />

            <strong>
              Nenhum profissional cadastrado
            </strong>

            <span>
              Cadastre ferradores, veterinários e outros responsáveis pelos
              serviços do haras.
            </span>
          </div>
        )}

      {!loading &&
        !error &&
        professionals.length > 0 &&
        filteredProfessionals.length === 0 && (
          <div className="professionals-state">
            Nenhum profissional encontrado para “{search}”.
          </div>
        )}

      {!loading &&
        !error &&
        filteredProfessionals.length > 0 && (
          <div className="professionals-grid">
            {filteredProfessionals.map(
              (professional) => (
                <article
                  className="professional-card"
                  key={professional.id}
                >
                  <div className="professional-card__header">
                    <div className="professional-card__identity">
                      <div className="professional-card__icon">
                        <UserRound
                          size={19}
                          strokeWidth={1.7}
                        />
                      </div>

                      <div>
                        <h2>
                          {professional.name}
                        </h2>

                        <span>
                          {professional.specialty ??
                            'Especialidade não informada'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`professional-card__status ${
                        professional.active
                          ? 'professional-card__status--active'
                          : 'professional-card__status--inactive'
                      }`}
                    >
                      {professional.active
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>
                  </div>

                  <div className="professional-card__details">
                    <div className="professional-card__detail">
                      <Phone
                        size={16}
                        strokeWidth={1.7}
                      />

                      <div>
                        <span>
                          Telefone
                        </span>

                        <strong>
                          {professional.phone ??
                            'Não informado'}
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