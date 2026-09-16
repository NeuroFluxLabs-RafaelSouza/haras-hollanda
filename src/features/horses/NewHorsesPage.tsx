import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  CircleDollarSign,
  UserRound,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  MoneyInput,
} from '../../components/ui/MoneyInput.tsx'

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '../../components/ui/SearchableSelect.tsx'

import type {
  Client,
} from '../../domain/client.ts'

import type {
  HorseSex,
} from '../../domain/horse.ts'

import {
  HORSE_BREEDS,
} from '../../domain/horseBreeds.ts'

import type {
  Stall,
} from '../../domain/stall.ts'

import {
  getClients,
} from '../clients/clientsService.ts'

import {
  createHorse,
  getAvailableStalls,
} from './horsesService.ts'

import './NewHorsesPage.css'

const breedOptions: SearchableSelectOption[] =
  HORSE_BREEDS.map((breed) => ({
    value: breed,
    label: breed,
  }))

export function NewHorsesPage() {
  const navigate =
    useNavigate()

  const [
    clients,
    setClients,
  ] = useState<Client[]>([])

  const [
    availableStalls,
    setAvailableStalls,
  ] = useState<Stall[]>([])

  const [
    name,
    setName,
  ] = useState('')

  const [
    breed,
    setBreed,
  ] = useState('')

  const [
    sex,
    setSex,
  ] = useState<HorseSex>(
    'male',
  )

  const [
    clientId,
    setClientId,
  ] = useState('')

  const [
    stallId,
    setStallId,
  ] = useState('')

  const [
    monthlyFee,
    setMonthlyFee,
  ] = useState(0)

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isMounted =
      true

    async function loadFormOptions() {
      try {
        const [
          clientsData,
          stallsData,
        ] = await Promise.all([
          getClients(),
          getAvailableStalls(),
        ])

        if (
          !isMounted
        ) {
          return
        }

        const activeClients =
          clientsData.filter(
            (client) =>
              client.active,
          )

        setClients(
          activeClients,
        )

        setAvailableStalls(
          stallsData,
        )
      } catch (error) {
        if (
          !isMounted
        ) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados do formulário.'

        setError(
          message,
        )
      } finally {
        if (
          isMounted
        ) {
          setLoadingOptions(
            false,
          )
        }
      }
    }

    loadFormOptions()

    return () => {
      isMounted =
        false
    }
  }, [])

  const selectedBreedIsValid =
    useMemo(
      () =>
        !breed ||
        HORSE_BREEDS.some(
          (item) =>
            item === breed,
        ),
      [
        breed,
      ],
    )

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(
      null,
    )

    const trimmedName =
      name.trim()

    if (
      !trimmedName
    ) {
      setError(
        'Informe o nome do cavalo.',
      )

      return
    }

    if (
      !breed
    ) {
      setError(
        'Selecione a raça do cavalo.',
      )

      return
    }

    if (
      !selectedBreedIsValid
    ) {
      setError(
        'Selecione uma raça disponível no catálogo.',
      )

      return
    }

    if (
      !clientId
    ) {
      setError(
        'Selecione o cliente responsável.',
      )

      return
    }

    if (
      !Number.isFinite(
        monthlyFee,
      ) ||
      monthlyFee < 0
    ) {
      setError(
        'Informe uma mensalidade válida.',
      )

      return
    }

    setSaving(
      true,
    )

    try {
      await createHorse({
        name:
          trimmedName,

        breed,

        sex,

        clientId,

        stallId:
          stallId ||
          null,

        monthlyFee:
          monthlyFee > 0
            ? monthlyFee
            : null,
      })

      navigate(
        '/cavalos',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o cavalo.'

      setError(
        message,
      )
    } finally {
      setSaving(
        false,
      )
    }
  }

  return (
    <section className="new-horse-page">
      <header className="new-horse-header">
        <Link
          className="new-horse-header__back"
          to="/cavalos"
        >
          <ArrowLeft
            size={17}
          />

          Voltar aos cavalos
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Cadastro
          </p>

          <h1 className="page-header__title">
            Novo cavalo
          </h1>

          <p className="page-header__description">
            Cadastre o animal, vincule o responsável e defina sua baia.
          </p>
        </div>
      </header>

      <form
        className="new-horse-form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="new-horse-form__section">
          <div className="new-horse-form__section-header">
            <div className="new-horse-form__section-icon">
              <UserRound
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2>
                Dados do cavalo
              </h2>

              <p>
                Informações principais para identificação do animal.
              </p>
            </div>
          </div>

          <div className="new-horse-form__grid">
            <div className="new-horse-field">
              <label htmlFor="name">
                Nome
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={
                  name
                }
                onChange={(
                  event,
                ) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Ex: Apache"
                autoComplete="off"
                required
              />
            </div>

            <div className="new-horse-field">
              <label htmlFor="breed">
                Raça
              </label>

              <SearchableSelect
                id="breed"
                value={
                  breed
                }
                options={
                  breedOptions
                }
                placeholder="Pesquise uma raça..."
                emptyMessage="Nenhuma raça encontrada."
                onChange={
                  setBreed
                }
              />

              <span className="new-horse-field__help">
                Digite parte do nome para pesquisar no catálogo.
              </span>
            </div>

            <div className="new-horse-field">
              <label htmlFor="sex">
                Sexo
              </label>

              <select
                id="sex"
                name="sex"
                value={
                  sex
                }
                onChange={(
                  event,
                ) =>
                  setSex(
                    event.target
                      .value as HorseSex,
                  )
                }
              >
                <option value="male">
                  Macho
                </option>

                <option value="female">
                  Fêmea
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="new-horse-form__section">
          <div className="new-horse-form__section-header">
            <div className="new-horse-form__section-icon">
              <CircleDollarSign
                size={18}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2>
                Hospedagem e responsável
              </h2>

              <p>
                Relacione o cavalo ao cliente e à estrutura do haras.
              </p>
            </div>
          </div>

          {loadingOptions ? (
            <div className="new-horse-form__state">
              Carregando clientes e baias...
            </div>
          ) : (
            <div className="new-horse-form__grid">
              <div className="new-horse-field">
                <label htmlFor="client">
                  Cliente responsável
                </label>

                <select
                  id="client"
                  name="client"
                  value={
                    clientId
                  }
                  onChange={(
                    event,
                  ) =>
                    setClientId(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Selecione um cliente
                  </option>

                  {clients.map(
                    (
                      client,
                    ) => (
                      <option
                        value={
                          client.id
                        }
                        key={
                          client.id
                        }
                      >
                        {
                          client.name
                        }
                      </option>
                    ),
                  )}
                </select>

                {clients.length ===
                  0 && (
                  <span className="new-horse-field__help">
                    Nenhum cliente ativo está disponível para vinculação.
                  </span>
                )}
              </div>

              <div className="new-horse-field">
                <label htmlFor="stall">
                  Baia
                </label>

                <select
                  id="stall"
                  name="stall"
                  value={
                    stallId
                  }
                  onChange={(
                    event,
                  ) =>
                    setStallId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Sem baia
                  </option>

                  {availableStalls.map(
                    (
                      stall,
                    ) => (
                      <option
                        value={
                          stall.id
                        }
                        key={
                          stall.id
                        }
                      >
                        {
                          stall.name
                        }
                      </option>
                    ),
                  )}
                </select>

                <span className="new-horse-field__help">
                  Apenas baias operacionais e livres aparecem nesta lista.
                </span>
              </div>

              <div className="new-horse-field">
                <label htmlFor="monthlyFee">
                  Mensalidade
                </label>

                <MoneyInput
                  id="monthlyFee"
                  name="monthlyFee"
                  value={
                    monthlyFee
                  }
                  onChange={
                    setMonthlyFee
                  }
                />

                <span className="new-horse-field__help">
                  Digite o valor como faria em um PIX. O sistema formata em
                  reais automaticamente.
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="new-horse-form__error">
            {error}
          </div>
        )}

        <div className="new-horse-form__actions">
          <Link
            className="new-horse-cancel"
            to="/cavalos"
          >
            Cancelar
          </Link>

          <button
            className="new-horse-submit"
            type="submit"
            disabled={
              saving ||
              loadingOptions ||
              clients.length === 0
            }
          >
            {saving
              ? 'Cadastrando...'
              : 'Cadastrar cavalo'}
          </button>
        </div>
      </form>
    </section>
  )
}