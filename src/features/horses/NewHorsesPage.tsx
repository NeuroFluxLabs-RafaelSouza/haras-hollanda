import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  CircleDollarSign,
  ShoppingCart,
  UserRound,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '../../components/ui/SearchableSelect.tsx'

import {
  MoneyInput,
} from '../../components/ui/MoneyInput.tsx'

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
  createHorseWithOptionalPurchase,
  type HorseOwnershipType,
} from './horseTradesService.ts'

import {
  getAvailableStalls,
} from './horsesService.ts'

import './NewHorsesPage.css'

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

function dateInputToIso(
  value: string,
) {
  return new Date(
    `${value}T12:00:00`,
  ).toISOString()
}

export function NewHorsesPage() {
  const navigate =
    useNavigate()

  const today =
    getCurrentDateInputValue()

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
    ownershipType,
    setOwnershipType,
  ] =
    useState<HorseOwnershipType>(
      'client',
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
    registerPurchase,
    setRegisterPurchase,
  ] = useState(false)

  const [
    purchaseAmount,
    setPurchaseAmount,
  ] = useState(0)

  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState(
    today,
  )

  const [
    sellerName,
    setSellerName,
  ] = useState('')

  const [
    purchasePaid,
    setPurchasePaid,
  ] = useState(true)

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
            item ===
            breed,
        ),
      [
        breed,
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

      return
    }

    setRegisterPurchase(
      false,
    )

    setPurchaseAmount(
      0,
    )

    setSellerName(
      '',
    )

    setPurchasePaid(
      true,
    )
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
      ownershipType ===
        'client' &&
      !clientId
    ) {
      setError(
        'Selecione o cliente responsável.',
      )

      return
    }

    const parsedMonthlyFee =
      ownershipType ===
        'client' &&
      monthlyFee >
        0
        ? monthlyFee
        : null

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

    let parsedPurchaseAmount:
      | number
      | null =
      null

    let purchaseAt:
      | string
      | null =
      null

    if (
      ownershipType ===
        'haras' &&
      registerPurchase
    ) {
      parsedPurchaseAmount =
        purchaseAmount

      if (
        !Number.isFinite(
          parsedPurchaseAmount,
        ) ||
        parsedPurchaseAmount <=
          0
      ) {
        setError(
          'Informe o valor da compra.',
        )

        return
      }

      if (!purchaseDate) {
        setError(
          'Informe a data da compra.',
        )

        return
      }

      if (
        purchaseDate >
        today
      ) {
        setError(
          'A data da compra não pode estar no futuro.',
        )

        return
      }

      if (
        !sellerName.trim()
      ) {
        setError(
          'Informe de quem o cavalo foi comprado.',
        )

        return
      }

      purchaseAt =
        dateInputToIso(
          purchaseDate,
        )
    }

    setSaving(
      true,
    )

    try {
      await createHorseWithOptionalPurchase(
        {
          name:
            trimmedName,

          breed,

          sex,

          birthDate:
            birthDate ||
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
            'client'
              ? parsedMonthlyFee
              : null,

          registerPurchase:
            ownershipType ===
              'haras' &&
            registerPurchase,

          purchaseAmount:
            parsedPurchaseAmount,

          purchaseAt,

          sellerName:
            ownershipType ===
                'haras' &&
              registerPurchase
              ? sellerName.trim()
              : null,

          purchasePaid:
            ownershipType ===
              'haras' &&
            registerPurchase
              ? purchasePaid
              : false,

          purchasePaidAt:
            ownershipType ===
                'haras' &&
              registerPurchase &&
              purchasePaid
              ? purchaseAt
              : null,
        },
      )

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

          Cavalos
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Cadastro
          </p>

          <h1 className="page-header__title">
            Novo cavalo
          </h1>

          <p className="page-header__description">
            Cadastre o animal uma vez. O sistema cuida do vínculo,
            hospedagem e compra quando necessário.
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
                Se souber a data, o sistema poderá calcular a idade
                automaticamente.
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
                Vínculo e hospedagem
              </h2>

              <p>
                Informe apenas a situação atual do cavalo.
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
                  O cavalo é
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
                    De cliente
                  </option>

                  <option value="haras">
                    Do Haras
                  </option>
                </select>

                <span className="new-horse-field__help">
                  Isso define automaticamente responsável e mensalidade.
                </span>
              </div>

              {ownershipType ===
                'client' && (
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
                      Nenhum cliente ativo está disponível para
                      vinculação.
                    </span>
                  )}
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

                <span className="new-horse-field__help">
                  Apenas baias operacionais e livres aparecem nesta
                  lista.
                </span>
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

                  <span className="new-horse-field__help">
                    Digite como em um PIX. Valor mensal relacionado a este
                    cavalo.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {ownershipType ===
          'haras' && (
          <div className="new-horse-form__section">
            <div className="new-horse-form__section-header">
              <div className="new-horse-form__section-icon">
                <ShoppingCart
                  size={18}
                  strokeWidth={
                    1.8
                  }
                />
              </div>

              <div>
                <h2>
                  Aquisição
                </h2>

                <p>
                  Se o cavalo acabou de ser comprado, o Financeiro é
                  atualizado automaticamente.
                </p>
              </div>
            </div>

            <div className="new-horse-form__grid">
              <div className="new-horse-field">
                <label htmlFor="registerPurchase">
                  Registrar compra agora?
                </label>

                <select
                  id="registerPurchase"
                  name="registerPurchase"
                  value={
                    registerPurchase
                      ? 'yes'
                      : 'no'
                  }
                  onChange={(
                    event,
                  ) =>
                    setRegisterPurchase(
                      event.target.value ===
                        'yes',
                    )
                  }
                >
                  <option value="no">
                    Não
                  </option>

                  <option value="yes">
                    Sim
                  </option>
                </select>

                <span className="new-horse-field__help">
                  Escolha Não se o animal já pertencia ao Haras antes
                  do sistema.
                </span>
              </div>

              {registerPurchase && (
                <>
                  <div className="new-horse-field">
                    <label htmlFor="purchaseAmount">
                      Valor da compra
                    </label>

                    <MoneyInput
                      id="purchaseAmount"
                      value={
                        purchaseAmount
                      }
                      onChange={
                        setPurchaseAmount
                      }
                    />

                    <span className="new-horse-field__help">
                      Digite como em um PIX.
                    </span>
                  </div>

                  <div className="new-horse-field">
                    <label htmlFor="purchaseDate">
                      Data da compra
                    </label>

                    <input
                      id="purchaseDate"
                      name="purchaseDate"
                      type="date"
                      max={
                        today
                      }
                      value={
                        purchaseDate
                      }
                      onChange={(
                        event,
                      ) =>
                        setPurchaseDate(
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div className="new-horse-field">
                    <label htmlFor="sellerName">
                      Vendedor
                    </label>

                    <input
                      id="sellerName"
                      name="sellerName"
                      type="text"
                      value={
                        sellerName
                      }
                      onChange={(
                        event,
                      ) =>
                        setSellerName(
                          event.target.value,
                        )
                      }
                      placeholder="Nome da pessoa ou empresa"
                      autoComplete="off"
                      required
                    />

                    <span className="new-horse-field__help">
                      Basta informar o nome. Não precisa cadastrar o
                      vendedor como cliente.
                    </span>
                  </div>

                  <div className="new-horse-field">
                    <label htmlFor="purchasePaymentStatus">
                      Situação do pagamento
                    </label>

                    <select
                      id="purchasePaymentStatus"
                      name="purchasePaymentStatus"
                      value={
                        purchasePaid
                          ? 'paid'
                          : 'pending'
                      }
                      onChange={(
                        event,
                      ) =>
                        setPurchasePaid(
                          event.target.value ===
                            'paid',
                        )
                      }
                    >
                      <option value="paid">
                        Já foi pago
                      </option>

                      <option value="pending">
                        Ainda não foi pago
                      </option>
                    </select>

                    <span className="new-horse-field__help">
                      Só entra no caixa do Financeiro quando o
                      pagamento estiver confirmado.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
              : 'Cadastrar cavalo'}
          </button>
        </div>
      </form>
    </section>
  )
}