import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from 'react'

import {
  CalendarDays,
  Camera,
  CircleDollarSign,
  DoorOpen,
  ImageIcon,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  UserRound,
  Utensils,
  X,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  ImageCropper,
} from '../../components/ui/ImageCropper.tsx'

import {
  MoneyInput,
} from '../../components/ui/MoneyInput.tsx'

import type {
  Client,
} from '../../domain/client.ts'

import type {
  HorseOwnershipType,
} from '../../domain/horse.ts'

import {
  getClients,
} from '../clients/clientsService.ts'

import {
  registerHorseTrade,
} from './horseTradesService.ts'

import type {
  HorseListItem,
} from './horsesService.ts'

import {
  getHorsePhotoUrl,
  getHorses,
  uploadHorsePhoto,
} from './horsesService.ts'

import './HorsesPage.css'

type PendingHorsePhoto = {
  horseId: string
  horseName: string
  currentPhotoPath: string | null
  file: File
}

type BuyerType =
  | 'client'
  | 'external'

const ALLOWED_SOURCE_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

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

function formatMonthlyFee(
  value: number | null,
  ownershipType: HorseOwnershipType,
) {
  if (
    ownershipType ===
    'haras'
  ) {
    return 'Não se aplica'
  }

  if (
    value === null
  ) {
    return 'Não informada'
  }

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

function getSexLabel(
  sex: HorseListItem['sex'],
) {
  return sex ===
    'male'
    ? 'Macho'
    : 'Fêmea'
}

function getOwnershipLabel(
  ownershipType: HorseOwnershipType,
) {
  return ownershipType ===
    'haras'
    ? 'Do Haras'
    : 'De cliente'
}

function formatHorseAge(
  birthDate: string | null,
) {
  if (!birthDate) {
    return 'Não informada'
  }

  const [
    yearText,
    monthText,
    dayText,
  ] =
    birthDate.split(
      '-',
    )

  const year =
    Number(
      yearText,
    )

  const month =
    Number(
      monthText,
    )

  const day =
    Number(
      dayText,
    )

  if (
    !Number.isFinite(
      year,
    ) ||
    !Number.isFinite(
      month,
    ) ||
    !Number.isFinite(
      day,
    )
  ) {
    return 'Não informada'
  }

  const today =
    new Date()

  let years =
    today.getFullYear() -
    year

  let months =
    today.getMonth() +
    1 -
    month

  if (
    today.getDate() <
    day
  ) {
    months -=
      1
  }

  if (
    months <
    0
  ) {
    years -=
      1

    months +=
      12
  }

  if (
    years <
    0
  ) {
    return 'Não informada'
  }

  if (
    years ===
      0 &&
    months ===
      0
  ) {
    return 'Menos de 1 mês'
  }

  const parts:
    string[] =
    []

  if (
    years >
    0
  ) {
    parts.push(
      years ===
      1
        ? '1 ano'
        : `${years} anos`,
    )
  }

  if (
    months >
    0
  ) {
    parts.push(
      months ===
      1
        ? '1 mês'
        : `${months} meses`,
    )
  }

  return parts.join(
    ' e ',
  )
}

function normalizeText(
  value: string,
) {
  return value
    .normalize(
      'NFD',
    )
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .trim()
}

export function HorsesPage() {
  const today =
    getCurrentDateInputValue()

  const [
    horses,
    setHorses,
  ] = useState<
    HorseListItem[]
  >([])

  const [
    clients,
    setClients,
  ] = useState<
    Client[]
  >([])

  const [
    photoUrls,
    setPhotoUrls,
  ] = useState<
    Record<string, string>
  >({})

  const [
    pendingHorsePhoto,
    setPendingHorsePhoto,
  ] = useState<
    PendingHorsePhoto | null
  >(null)

  const [
    uploadingPhotoId,
    setUploadingPhotoId,
  ] = useState<
    string | null
  >(null)

  const [
    tradeHorse,
    setTradeHorse,
  ] = useState<
    HorseListItem | null
  >(null)

  const [
    tradeAmount,
    setTradeAmount,
  ] = useState(0)

  const [
    tradeDate,
    setTradeDate,
  ] = useState(
    today,
  )

  const [
    tradePaid,
    setTradePaid,
  ] = useState(true)

  const [
    buyerType,
    setBuyerType,
  ] = useState<BuyerType>(
    'client',
  )

  const [
    tradeClientId,
    setTradeClientId,
  ] = useState('')

  const [
    externalBuyerName,
    setExternalBuyerName,
  ] = useState('')

  const [
    keepsBoarding,
    setKeepsBoarding,
  ] = useState(true)

  const [
    tradeMonthlyFee,
    setTradeMonthlyFee,
  ] = useState(0)

  const [
    tradeSaving,
    setTradeSaving,
  ] = useState(false)

  const [
    tradeError,
    setTradeError,
  ] = useState<
    string | null
  >(null)

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  )

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    photoError,
    setPhotoError,
  ] = useState<
    string | null
  >(null)

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    let isMounted =
      true

    async function loadPage() {
      try {
        const [
          horseData,
          clientData,
        ] =
          await Promise.all([
            getHorses(),
            getClients(),
          ])

        const activeClients =
          clientData.filter(
            (client) =>
              client.active,
          )

        const nextPhotoUrls:
          Record<string, string> =
          {}

        await Promise.all(
          horseData.map(
            async (
              horse,
            ) => {
              if (
                !horse.photoPath
              ) {
                return
              }

              try {
                const photoUrl =
                  await getHorsePhotoUrl(
                    horse.photoPath,
                  )

                if (
                  photoUrl
                ) {
                  nextPhotoUrls[
                    horse.id
                  ] =
                    photoUrl
                }
              } catch {
                return
              }
            },
          ),
        )

        if (
          isMounted
        ) {
          setHorses(
            horseData,
          )

          setClients(
            activeClients,
          )

          setPhotoUrls(
            nextPhotoUrls,
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
            : 'Não foi possível carregar os cavalos.'

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

    loadPage()

    return () => {
      isMounted =
        false
    }
  }, [])

  const filteredHorses =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(
          search,
        )

      if (
        !normalizedSearch
      ) {
        return horses
      }

      return horses.filter(
        (horse) => {
          const searchableContent =
            [
              horse.name,
              horse.breed ??
                '',
              horse.clientName,
              horse.stallName ??
                '',
              getOwnershipLabel(
                horse.ownershipType,
              ),
              formatHorseAge(
                horse.birthDate,
              ),
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
      horses,
      search,
    ])

  const horseCountLabel =
    horses.length ===
    1
      ? '1 cavalo cadastrado'
      : `${horses.length} cavalos cadastrados`

  const tradeIsSale =
    tradeHorse?.ownershipType ===
    'haras'

  function handlePhotoSelection(
    horse: HorseListItem,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ??
      null

    event.target.value =
      ''

    if (!file) {
      return
    }

    setPhotoError(
      null,
    )

    setSuccessMessage(
      null,
    )

    if (
      !ALLOWED_SOURCE_IMAGE_TYPES.has(
        file.type,
      )
    ) {
      setPhotoError(
        'Use uma imagem JPG, PNG ou WebP.',
      )

      return
    }

    setPendingHorsePhoto({
      horseId:
        horse.id,

      horseName:
        horse.name,

      currentPhotoPath:
        horse.photoPath,

      file,
    })
  }

  async function handleAdjustedPhoto(
    file: File,
  ) {
    if (
      !pendingHorsePhoto
    ) {
      return
    }

    const {
      horseId,
      horseName,
      currentPhotoPath,
    } =
      pendingHorsePhoto

    setUploadingPhotoId(
      horseId,
    )

    setPhotoError(
      null,
    )

    setSuccessMessage(
      null,
    )

    try {
      const result =
        await uploadHorsePhoto(
          horseId,
          currentPhotoPath,
          file,
        )

      setHorses(
        (
          currentHorses,
        ) =>
          currentHorses.map(
            (horse) =>
              horse.id ===
              horseId
                ? {
                    ...horse,

                    photoPath:
                      result.photoPath,
                  }
                : horse,
          ),
      )

      setPhotoUrls(
        (
          currentPhotoUrls,
        ) => ({
          ...currentPhotoUrls,

          [horseId]:
            result.photoUrl,
        }),
      )

      setPendingHorsePhoto(
        null,
      )

      setSuccessMessage(
        `Foto de ${horseName} atualizada com sucesso.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a foto do cavalo.'

      setPhotoError(
        message,
      )
    } finally {
      setUploadingPhotoId(
        null,
      )
    }
  }

  function openTradeForm(
    horse: HorseListItem,
  ) {
    setTradeHorse(
      horse,
    )

    setTradeAmount(
      0,
    )

    setTradeDate(
      today,
    )

    setTradePaid(
      true,
    )

    setBuyerType(
      'client',
    )

    setTradeClientId(
      '',
    )

    setExternalBuyerName(
      '',
    )

    setKeepsBoarding(
      true,
    )

    setTradeMonthlyFee(
      0,
    )

    setTradeError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  function closeTradeForm() {
    if (
      tradeSaving
    ) {
      return
    }

    setTradeHorse(
      null,
    )

    setTradeError(
      null,
    )
  }

  function handleBuyerTypeChange(
    value: BuyerType,
  ) {
    setBuyerType(
      value,
    )

    setTradeError(
      null,
    )

    if (
      value ===
      'external'
    ) {
      setTradeClientId(
        '',
      )

      setKeepsBoarding(
        false,
      )

      setTradeMonthlyFee(
        0,
      )

      return
    }

    setExternalBuyerName(
      '',
    )

    setKeepsBoarding(
      true,
    )
  }

  async function handleTradeSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !tradeHorse
    ) {
      return
    }

    setTradeError(
      null,
    )

    setSuccessMessage(
      null,
    )

    if (
      !Number.isFinite(
        tradeAmount,
      ) ||
      tradeAmount <=
        0
    ) {
      setTradeError(
        tradeIsSale
          ? 'Informe o valor da venda.'
          : 'Informe o valor da compra.',
      )

      return
    }

    if (
      !tradeDate
    ) {
      setTradeError(
        tradeIsSale
          ? 'Informe a data da venda.'
          : 'Informe a data da compra.',
      )

      return
    }

    if (
      tradeDate >
      today
    ) {
      setTradeError(
        'A data da operação não pode estar no futuro.',
      )

      return
    }

    if (
      tradeIsSale &&
      buyerType ===
        'client' &&
      !tradeClientId
    ) {
      setTradeError(
        'Selecione o cliente comprador.',
      )

      return
    }

    if (
      tradeIsSale &&
      buyerType ===
        'external' &&
      !externalBuyerName.trim()
    ) {
      setTradeError(
        'Informe o nome do comprador.',
      )

      return
    }

    if (
      tradeIsSale &&
      buyerType ===
        'external' &&
      keepsBoarding
    ) {
      setTradeError(
        'Para continuar hospedado, o comprador precisa estar cadastrado como cliente.',
      )

      return
    }

    if (
      tradeIsSale &&
      keepsBoarding &&
      (
        !Number.isFinite(
          tradeMonthlyFee,
        ) ||
        tradeMonthlyFee <
          0
      )
    ) {
      setTradeError(
        'Informe uma mensalidade válida.',
      )

      return
    }

    const tradeAt =
      dateInputToIso(
        tradeDate,
      )

    setTradeSaving(
      true,
    )

    try {
      if (
        tradeIsSale
      ) {
        await registerHorseTrade(
          {
            horseId:
              tradeHorse.id,

            tradeType:
              'sale',

            amount:
              tradeAmount,

            tradeAt,

            counterpartyClientId:
              buyerType ===
              'client'
                ? tradeClientId
                : null,

            counterpartyName:
              buyerType ===
              'external'
                ? externalBuyerName.trim()
                : null,

            paid:
              tradePaid,

            paidAt:
              tradePaid
                ? tradeAt
                : null,

            keepsBoarding:
              buyerType ===
                'client'
                ? keepsBoarding
                : false,

            monthlyFee:
              buyerType ===
                  'client' &&
                keepsBoarding &&
                tradeMonthlyFee >
                  0
                ? tradeMonthlyFee
                : null,

            notes:
              null,
          },
        )
      } else {
        await registerHorseTrade(
          {
            horseId:
              tradeHorse.id,

            tradeType:
              'purchase',

            amount:
              tradeAmount,

            tradeAt,

            counterpartyClientId:
              tradeHorse.clientId,

            counterpartyName:
              tradeHorse.clientId
                ? null
                : tradeHorse.clientName,

            paid:
              tradePaid,

            paidAt:
              tradePaid
                ? tradeAt
                : null,

            keepsBoarding:
              null,

            monthlyFee:
              null,

            notes:
              null,
          },
        )
      }

      const refreshedHorses =
        await getHorses()

      setHorses(
        refreshedHorses,
      )

      const operationLabel =
        tradeIsSale
          ? 'Venda'
          : 'Compra'

      setTradeHorse(
        null,
      )

      setSuccessMessage(
        tradePaid
          ? `${operationLabel} de ${tradeHorse.name} registrada. O Financeiro foi atualizado automaticamente.`
          : `${operationLabel} de ${tradeHorse.name} registrada como pendente. O caixa só será alterado após a confirmação do pagamento.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a operação comercial.'

      setTradeError(
        message,
      )
    } finally {
      setTradeSaving(
        false,
      )
    }
  }

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
          Consulte os animais, proprietários, idades, baias e informações
          financeiras do haras.
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
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar cavalo..."
              aria-label="Buscar cavalo"
            />
          </div>

          <Link
            className="horses-feeding-today-button"
            to="/cavalos/alimentacao-hoje"
          >
            <Utensils
              size={17}
              strokeWidth={1.8}
            />

            Alimentação de hoje
          </Link>

          <Link
            className="horses-add-button"
            to="/cavalos/novo"
          >
            <Plus
              size={17}
            />

            Novo cavalo
          </Link>
        </div>
      </div>

      {photoError && (
        <div className="horses-message horses-message--error">
          {photoError}
        </div>
      )}

      {successMessage && (
        <div className="horses-message horses-message--success">
          {successMessage}
        </div>
      )}

      {tradeHorse && (
        <section className="horse-trade-panel">
          <div className="horse-trade-panel__header">
            <div>
              <span className="horse-trade-panel__eyebrow">
                Operação comercial
              </span>

              <h2>
                {tradeIsSale
                  ? `Registrar venda de ${tradeHorse.name}`
                  : `Registrar compra de ${tradeHorse.name}`}
              </h2>

              <p>
                {tradeIsSale
                  ? 'Registre a venda uma vez. O sistema atualiza propriedade, hospedagem e Financeiro.'
                  : 'Registre a compra uma vez. O cavalo passa a pertencer ao Haras e o Financeiro é atualizado quando houver pagamento.'}
              </p>
            </div>

            <button
              className="horse-trade-panel__close"
              type="button"
              onClick={
                closeTradeForm
              }
              disabled={
                tradeSaving
              }
              aria-label="Fechar operação comercial"
            >
              <X
                size={18}
              />
            </button>
          </div>

          <form
            className="horse-trade-form"
            onSubmit={
              handleTradeSubmit
            }
          >
            <div className="horse-trade-form__grid">
              <div className="horse-trade-field">
                <label htmlFor="tradeAmount">
                  {tradeIsSale
                    ? 'Valor da venda'
                    : 'Valor da compra'}
                </label>

                <MoneyInput
                  id="tradeAmount"
                  value={
                    tradeAmount
                  }
                  onChange={
                    setTradeAmount
                  }
                />

                <span>
                  Digite como em um PIX.
                </span>
              </div>

              <div className="horse-trade-field">
                <label htmlFor="tradeDate">
                  {tradeIsSale
                    ? 'Data da venda'
                    : 'Data da compra'}
                </label>

                <input
                  id="tradeDate"
                  name="tradeDate"
                  type="date"
                  max={
                    today
                  }
                  value={
                    tradeDate
                  }
                  onChange={(
                    event,
                  ) =>
                    setTradeDate(
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              {!tradeIsSale && (
                <div className="horse-trade-field">
                  <label>
                    Vendedor
                  </label>

                  <div className="horse-trade-field__readonly">
                    {tradeHorse.clientName}
                  </div>

                  <span>
                    É o proprietário atual do cavalo.
                  </span>
                </div>
              )}

              {tradeIsSale && (
                <>
                  <div className="horse-trade-field">
                    <label htmlFor="buyerType">
                      Comprador
                    </label>

                    <select
                      id="buyerType"
                      name="buyerType"
                      value={
                        buyerType
                      }
                      onChange={(
                        event,
                      ) =>
                        handleBuyerTypeChange(
                          event.target
                            .value as BuyerType,
                        )
                      }
                    >
                      <option value="client">
                        Cliente cadastrado
                      </option>

                      <option value="external">
                        Outro comprador
                      </option>
                    </select>
                  </div>

                  {buyerType ===
                    'client' ? (
                    <div className="horse-trade-field">
                      <label htmlFor="tradeClientId">
                        Cliente comprador
                      </label>

                      <select
                        id="tradeClientId"
                        name="tradeClientId"
                        value={
                          tradeClientId
                        }
                        onChange={(
                          event,
                        ) =>
                          setTradeClientId(
                            event.target.value,
                          )
                        }
                        required
                      >
                        <option value="">
                          Selecione o cliente
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
                  ) : (
                    <div className="horse-trade-field">
                      <label htmlFor="externalBuyerName">
                        Nome do comprador
                      </label>

                      <input
                        id="externalBuyerName"
                        name="externalBuyerName"
                        type="text"
                        value={
                          externalBuyerName
                        }
                        onChange={(
                          event,
                        ) =>
                          setExternalBuyerName(
                            event.target.value,
                          )
                        }
                        placeholder="Nome da pessoa ou empresa"
                        autoComplete="off"
                        required
                      />

                      <span>
                        Comprador externo não precisa ser cadastrado se o cavalo
                        sair do Haras.
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="horse-trade-field">
                <label htmlFor="tradePaymentStatus">
                  {tradeIsSale
                    ? 'Situação do recebimento'
                    : 'Situação do pagamento'}
                </label>

                <select
                  id="tradePaymentStatus"
                  name="tradePaymentStatus"
                  value={
                    tradePaid
                      ? 'paid'
                      : 'pending'
                  }
                  onChange={(
                    event,
                  ) =>
                    setTradePaid(
                      event.target.value ===
                        'paid',
                    )
                  }
                >
                  <option value="paid">
                    {tradeIsSale
                      ? 'Já foi recebido'
                      : 'Já foi pago'}
                  </option>

                  <option value="pending">
                    {tradeIsSale
                      ? 'Ainda não foi recebido'
                      : 'Ainda não foi pago'}
                  </option>
                </select>

                <span>
                  {tradePaid
                    ? 'Ao confirmar, o caixa do Financeiro será atualizado.'
                    : 'Enquanto estiver pendente, não altera o caixa real.'}
                </span>
              </div>

              {tradeIsSale &&
                buyerType ===
                  'client' && (
                <>
                  <div className="horse-trade-field">
                    <label htmlFor="keepsBoarding">
                      Continua hospedado no Haras?
                    </label>

                    <select
                      id="keepsBoarding"
                      name="keepsBoarding"
                      value={
                        keepsBoarding
                          ? 'yes'
                          : 'no'
                      }
                      onChange={(
                        event,
                      ) => {
                        const nextValue =
                          event.target.value ===
                          'yes'

                        setKeepsBoarding(
                          nextValue,
                        )

                        if (
                          !nextValue
                        ) {
                          setTradeMonthlyFee(
                            0,
                          )
                        }
                      }}
                    >
                      <option value="yes">
                        Sim
                      </option>

                      <option value="no">
                        Não
                      </option>
                    </select>

                    <span>
                      Se sair, o sistema libera a baia e encerra a rotina futura
                      do animal.
                    </span>
                  </div>

                  {keepsBoarding && (
                    <div className="horse-trade-field">
                      <label htmlFor="tradeMonthlyFee">
                        Nova mensalidade
                      </label>

                      <MoneyInput
                        id="tradeMonthlyFee"
                        value={
                          tradeMonthlyFee
                        }
                        onChange={
                          setTradeMonthlyFee
                        }
                      />

                      <span>
                        Digite como em um PIX. Pode ajustar novamente depois.
                      </span>
                    </div>
                  )}
                </>
              )}

              {tradeIsSale &&
                buyerType ===
                  'external' && (
                <div className="horse-trade-info">
                  <strong>
                    O cavalo sairá do Haras
                  </strong>

                  <span>
                    Para permanecer hospedado, primeiro cadastre o comprador em
                    Clientes.
                  </span>
                </div>
              )}
            </div>

            {tradeError && (
              <div className="horse-trade-form__error">
                {tradeError}
              </div>
            )}

            <div className="horse-trade-form__actions">
              <button
                className="horse-trade-cancel"
                type="button"
                onClick={
                  closeTradeForm
                }
                disabled={
                  tradeSaving
                }
              >
                Cancelar
              </button>

              <button
                className="horse-trade-submit"
                type="submit"
                disabled={
                  tradeSaving
                }
              >
                {tradeSaving
                  ? 'Registrando...'
                  : tradeIsSale
                    ? 'Confirmar venda'
                    : 'Confirmar compra'}
              </button>
            </div>
          </form>
        </section>
      )}

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
        horses.length ===
          0 && (
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
              <Plus
                size={17}
              />

              Novo cavalo
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        horses.length >
          0 &&
        filteredHorses.length ===
          0 && (
          <div className="horses-state">
            Nenhum cavalo encontrado para “{search}”.
          </div>
        )}

      {!loading &&
        !error &&
        filteredHorses.length >
          0 && (
          <div className="horses-grid">
            {filteredHorses.map(
              (horse) => {
                const photoUrl =
                  photoUrls[
                    horse.id
                  ]

                const uploadingPhoto =
                  uploadingPhotoId ===
                  horse.id

                return (
                  <article
                    className="horse-card"
                    key={
                      horse.id
                    }
                  >
                    <div className="horse-card__profile">
                      <div className="horse-card__photo-column">
                        <div className="horse-card__photo">
                          {photoUrl ? (
                            <img
                              src={
                                photoUrl
                              }
                              alt={`Foto de ${horse.name}`}
                            />
                          ) : (
                            <div className="horse-card__photo-placeholder">
                              <ImageIcon
                                size={28}
                                strokeWidth={1.6}
                              />

                              <span>
                                Sem foto
                              </span>
                            </div>
                          )}
                        </div>

                        <label
                          className={`horse-card__photo-button ${
                            uploadingPhoto
                              ? 'horse-card__photo-button--disabled'
                              : ''
                          }`}
                        >
                          <Camera
                            size={14}
                            strokeWidth={1.8}
                          />

                          {uploadingPhoto
                            ? 'Salvando...'
                            : photoUrl
                              ? 'Trocar foto'
                              : 'Adicionar foto'}

                          <input
                            className="horse-card__photo-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={
                              uploadingPhoto
                            }
                            onChange={(
                              event,
                            ) =>
                              handlePhotoSelection(
                                horse,
                                event,
                              )
                            }
                          />
                        </label>
                      </div>

                      <div className="horse-card__identity">
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

                        <div className="horse-card__badges">
                          <span className="horse-card__sex">
                            {getSexLabel(
                              horse.sex,
                            )}
                          </span>

                          <span
                            className={`horse-card__ownership horse-card__ownership--${horse.ownershipType}`}
                          >
                            {getOwnershipLabel(
                              horse.ownershipType,
                            )}
                          </span>
                        </div>
                      </div>
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
                            Proprietário
                          </span>

                          <strong>
                            {
                              horse.clientName
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="horse-card__detail">
                        <div className="horse-card__detail-icon">
                          <CalendarDays
                            size={17}
                            strokeWidth={1.7}
                          />
                        </div>

                        <div>
                          <span>
                            Idade
                          </span>

                          <strong>
                            {formatHorseAge(
                              horse.birthDate,
                            )}
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
                              horse.ownershipType,
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="horse-card__actions">
                      <Link
                        className="horse-card__feeding"
                        to={`/cavalos/${horse.id}/alimentacao`}
                      >
                        <Utensils
                          size={15}
                          strokeWidth={1.8}
                        />

                        Plano alimentar
                      </Link>

                      {horse.ownershipType ===
                        'client' &&
                        horse.active && (
                        <Link
                          className="horse-card__feeding"
                          to={`/cavalos/${horse.id}/mensalidade`}
                        >
                          <CircleDollarSign
                            size={15}
                            strokeWidth={1.8}
                          />

                          Editar mensalidade
                        </Link>
                      )}

                      {horse.active &&
                        horse.ownershipType ===
                          'client' && (
                        <button
                          className="horse-card__commercial horse-card__commercial--purchase"
                          type="button"
                          onClick={() =>
                            openTradeForm(
                              horse,
                            )
                          }
                        >
                          <ShoppingCart
                            size={15}
                            strokeWidth={1.8}
                          />

                          Registrar compra
                        </button>
                      )}

                      {horse.active &&
                        horse.ownershipType ===
                          'haras' && (
                        <button
                          className="horse-card__commercial horse-card__commercial--sale"
                          type="button"
                          onClick={() =>
                            openTradeForm(
                              horse,
                            )
                          }
                        >
                          <Tag
                            size={15}
                            strokeWidth={1.8}
                          />

                          Registrar venda
                        </button>
                      )}
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}

      {pendingHorsePhoto && (
        <ImageCropper
          file={
            pendingHorsePhoto.file
          }
          title={`Foto de ${pendingHorsePhoto.horseName}`}
          description="Ajuste o enquadramento dentro do quadrado antes de salvar."
          cropShape="square"
          confirmLabel="Salvar foto"
          onCancel={() =>
            setPendingHorsePhoto(
              null,
            )
          }
          onConfirm={
            handleAdjustedPhoto
          }
        />
      )}
    </section>
  )
}