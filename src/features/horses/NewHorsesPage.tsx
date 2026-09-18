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
  useSearchParams,
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
  HorseOwnershipType,
  HorseSex,
} from '../../domain/horse.ts'

import {
  HORSE_BREEDS,
} from '../../domain/horseBreeds.ts'

import {
  getHorseLifeStageLabel,
} from '../../domain/horseLifeStage.ts'

import type {
  Stall,
} from '../../domain/stall.ts'

import {
  getClients,
} from '../clients/clientsService.ts'

import {
  createHorseLineage,
} from './horseLineagesService.ts'

import {
  createHorse,
  getAvailableStalls,
} from './horsesService.ts'

import './NewHorsesPage.css'

type CommercialMode =
  | 'purchase'
  | 'sale'

const breedOptions: SearchableSelectOption[] =
  HORSE_BREEDS.map(
    (breed) => ({
      value:
        breed,

      label:
        breed,
    }),
  )

function getCurrentDateInputValue() {
  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      now.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

export function NewHorsesPage() {
  const navigate =
    useNavigate()

  const [
    searchParams,
  ] = useSearchParams()

  const today =
    getCurrentDateInputValue()

  const returnTo =
    searchParams.get(
      'returnTo',
    )

  const commercialMode:
    CommercialMode =
    searchParams.get(
      'mode',
    ) ===
    'sale'
      ? 'sale'
      : 'purchase'

  const cameFromCommercial =
    returnTo ===
    'comercial'

  const lineageRequired =
    cameFromCommercial &&
    commercialMode ===
      'purchase'

  const initialOwnershipType:
    HorseOwnershipType =
    cameFromCommercial &&
    commercialMode ===
      'sale'
      ? 'haras'
      : 'client'

  const [
    clients,
    setClients,
  ] = useState<Client[]>(
    [],
  )

  const [
    availableStalls,
    setAvailableStalls,
  ] = useState<Stall[]>(
    [],
  )

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
  ] =
    useState<HorseSex>(
      'male',
    )

  const [
    birthDate,
    setBirthDate,
  ] = useState('')

  const [
    fatherName,
    setFatherName,
  ] = useState('')

  const [
    motherName,
    setMotherName,
  ] = useState('')

  const [
    ownershipType,
    setOwnershipType,
  ] =
    useState<HorseOwnershipType>(
      initialOwnershipType,
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
  ] =
    useState<string | null>(
      null,
    )

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

        if (!isMounted) {
          return
        }

        setClients(
          clientsData.filter(
            (client) =>
              client.active,
          ),
        )

        setAvailableStalls(
          stallsData,
        )
      } catch (error) {
        if (!isMounted) {
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
        if (isMounted) {
          setLoadingOptions(
            false,
          )
        }
      }
    }

    void loadFormOptions()

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
            item ===
            breed,
        ),
      [
        breed,
      ],
    )

  const lifeStageLabel =
    useMemo(
      () =>
        getHorseLifeStageLabel(
          sex,
          birthDate ||
            null,
        ),
      [
        birthDate,
        sex,
      ],
    )

  function handleOwnershipChange(
    value: HorseOwnershipType,
  ) {
    setOwnershipType(
      value,
    )

    setError(
      null,
    )

    if (
      value ===
      'haras'
    ) {
      setClientId(
        '',
      )

      setMonthlyFee(
        0,
      )
    }
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(
      null,
    )

    const trimmedName =
      name.trim()

    const trimmedFatherName =
      fatherName.trim()

    const trimmedMotherName =
      motherName.trim()

    if (!trimmedName) {
      setError(
        'Informe o nome do cavalo.',
      )

      return
    }

    if (!breed) {
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
      birthDate &&
      birthDate >
        today
    ) {
      setError(
        'A data de nascimento não pode estar no futuro.',
      )

      return
    }

    if (
      lineageRequired &&
      (
        !trimmedFatherName ||
        !trimmedMotherName
      )
    ) {
      setError(
        'Para uma compra, informe o pai e a mãe do cavalo.',
      )

      return
    }

    const hasOnlyOneParent =
      (
        trimmedFatherName &&
        !trimmedMotherName
      ) ||
      (
        !trimmedFatherName &&
        trimmedMotherName
      )

    if (
      hasOnlyOneParent
    ) {
      setError(
        'Informe Pai e Mãe juntos ou deixe os dois campos em branco.',
      )

      return
    }

    if (
      ownershipType ===
        'client' &&
      !clientId
    ) {
      setError(
        'Selecione o proprietário do cavalo.',
      )

      return
    }

    if (
      ownershipType ===
        'client' &&
      (
        !Number.isFinite(
          monthlyFee,
        ) ||
        monthlyFee <
          0
      )
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
      let lineageId:
        | string
        | null =
        null

      if (
        trimmedFatherName &&
        trimmedMotherName
      ) {
        const lineage =
          await createHorseLineage(
            {
              fatherName:
                trimmedFatherName,

              motherName:
                trimmedMotherName,
            },
          )

        lineageId =
          lineage.id
      }

      const createdHorse =
        await createHorse(
          {
            name:
              trimmedName,

            breed,

            sex,

            birthDate:
              birthDate ||
              null,

            lineageId,

            lineageText:
              null,

            ownershipType,

            clientId:
              ownershipType ===
              'client'
                ? clientId
                : null,

            stallId:
              stallId ||
              null,

            monthlyFee:
              ownershipType ===
                'client' &&
              monthlyFee >
                0
                ? monthlyFee
                : null,
          },
        )

      if (
        cameFromCommercial
      ) {
        navigate(
          `/cavalos?area=comercial&mode=${commercialMode}&horse=${createdHorse.id}`,
        )

        return
      }

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

  const cancelUrl =
    cameFromCommercial
      ? `/cavalos?area=comercial&mode=${commercialMode}`
      : '/cavalos'

  return (
    <section className="new-horse-page">
      <header className="new-horse-header">
        <Link
          className="new-horse-header__back"
          to={
            cancelUrl
          }
        >
          <ArrowLeft
            size={17}
          />

          {cameFromCommercial
            ? 'Comercial'
            : 'Cavalos'}
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Cadastro
          </p>

          <h1 className="page-header__title">
            Novo cavalo
          </h1>

          <p className="page-header__description">
            Cadastre somente as informações necessárias para identificar e
            organizar o animal.
          </p>
        </div>
      </header>

      {cameFromCommercial && (
        <div className="new-horse-form__state">
          {commercialMode ===
          'purchase'
            ? 'Após o cadastro, o sistema volta para a compra com este cavalo já selecionado.'
            : 'Após o cadastro, o sistema volta para a venda com este cavalo já selecionado.'}
        </div>
      )}

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
                strokeWidth={
                  1.8
                }
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

            <div className="new-horse-field">
              <label htmlFor="birthDate">
                Data de nascimento
              </label>

              <input
                id="birthDate"
                name="birthDate"
                type="date"
                max={
                  today
                }
                value={
                  birthDate
                }
                onChange={(
                  event,
                ) =>
                  setBirthDate(
                    event.target.value,
                  )
                }
              />

              <span className="new-horse-field__help">
                {birthDate
                  ? `Categoria calculada pelo sistema: ${lifeStageLabel}.`
                  : 'O sistema calcula Potro, Potra, Cavalo ou Égua pela data.'}
              </span>
            </div>

            <div className="new-horse-field">
              <label htmlFor="fatherName">
                Pai
              </label>

              <input
                id="fatherName"
                name="fatherName"
                type="text"
                value={
                  fatherName
                }
                onChange={(
                  event,
                ) =>
                  setFatherName(
                    event.target.value,
                  )
                }
                placeholder="Nome do pai"
                autoComplete="off"
                required={
                  lineageRequired
                }
              />

              <span className="new-horse-field__help">
                {lineageRequired
                  ? 'Obrigatório porque este cadastro faz parte de uma compra.'
                  : 'Opcional no cadastro comum.'}
              </span>
            </div>

            <div className="new-horse-field">
              <label htmlFor="motherName">
                Mãe
              </label>

              <input
                id="motherName"
                name="motherName"
                type="text"
                value={
                  motherName
                }
                onChange={(
                  event,
                ) =>
                  setMotherName(
                    event.target.value,
                  )
                }
                placeholder="Nome da mãe"
                autoComplete="off"
                required={
                  lineageRequired
                }
              />

              <span className="new-horse-field__help">
                {lineageRequired
                  ? 'Pai e Mãe formarão a linhagem do animal.'
                  : 'Se informar a linhagem, informe Pai e Mãe.'}
              </span>
            </div>
          </div>
        </div>

        <div className="new-horse-form__section">
          <div className="new-horse-form__section-header">
            <div className="new-horse-form__section-icon">
              <CircleDollarSign
                size={18}
                strokeWidth={
                  1.8
                }
              />
            </div>

            <div>
              <h2>
                Proprietário e hospedagem
              </h2>

              <p>
                Informe a situação atual do animal no Haras.
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
                <label htmlFor="ownershipType">
                  Proprietário
                </label>

                <select
                  id="ownershipType"
                  name="ownershipType"
                  value={
                    ownershipType
                  }
                  onChange={(
                    event,
                  ) =>
                    handleOwnershipChange(
                      event.target
                        .value as HorseOwnershipType,
                    )
                  }
                >
                  <option value="client">
                    Cliente cadastrado
                  </option>

                  <option value="haras">
                    Haras Hollanda
                  </option>
                </select>
              </div>

              {ownershipType ===
                'client' && (
                <div className="new-horse-field">
                  <label htmlFor="client">
                    Cliente
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
                </div>
              )}

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
              </div>

              {ownershipType ===
                'client' && (
                <div className="new-horse-field">
                  <label htmlFor="monthlyFee">
                    Mensalidade
                  </label>

                  <MoneyInput
                    id="monthlyFee"
                    value={
                      monthlyFee
                    }
                    onChange={
                      setMonthlyFee
                    }
                  />
                </div>
              )}
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
            to={
              cancelUrl
            }
          >
            Cancelar
          </Link>

          <button
            className="new-horse-submit"
            type="submit"
            disabled={
              saving ||
              loadingOptions ||
              (
                ownershipType ===
                  'client' &&
                clients.length ===
                  0
              )
            }
          >
            {saving
              ? 'Cadastrando...'
              : cameFromCommercial
                ? 'Cadastrar e continuar'
                : 'Cadastrar cavalo'}
          </button>
        </div>
      </form>
    </section>
  )
}