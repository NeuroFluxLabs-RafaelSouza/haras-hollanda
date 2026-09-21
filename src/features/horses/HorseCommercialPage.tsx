import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SubmitEvent,
} from 'react'

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  GitBranch,
  ReceiptText,
} from 'lucide-react'

import {
  Link,
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
  HorseSex,
} from '../../domain/horse.ts'

import {
  HORSE_BREEDS,
} from '../../domain/horseBreeds.ts'

import type {
  HorseTrade,
} from '../../domain/horseTrade.ts'

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
  registerHorsePurchaseWithLineage,
} from './horsePurchaseService.ts'

import {
  confirmHorseTradePayment,
  createHorseWithOptionalPurchase,
  getPendingHorseTrades,
  registerHorseTrade,
} from './horseTradesService.ts'

import {
  getAvailableStalls,
  getHorses,
  type HorseListItem,
} from './horsesService.ts'

import './HorseCommercialPage.css'

type CommercialMode =
  | 'purchase'
  | 'sale'

type SellerMode =
  | 'client'
  | 'external'

type BuyerMode =
  | 'client'
  | 'external'

type CommercialClientList =
  Awaited<
    ReturnType<
      typeof getClients
    >
  >

const breedOptions:
  SearchableSelectOption[] =
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

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style:
        'currency',

      currency:
        'BRL',
    },
  ).format(
    value,
  )
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(
      value,
    ),
  )
}

function getTradeLabel(
  trade: HorseTrade,
) {
  return trade.tradeType ===
    'purchase'
    ? 'Compra'
    : 'Venda'
}

function getHorseLineageLabel(
  horse: HorseListItem,
) {
  if (
    horse.lineageFatherName &&
    horse.lineageMotherName
  ) {
    return `${horse.lineageFatherName} × ${horse.lineageMotherName}`
  }

  if (
    horse.lineageText?.trim()
  ) {
    return horse.lineageText
  }

  return 'Não informada'
}

export function HorseCommercialPage() {
  const purchaseSubmittingRef =
    useRef(false)

  const today =
    getCurrentDateInputValue()

  const [
    searchParams,
  ] = useSearchParams()

  const horseFromUrl =
    searchParams.get(
      'horse',
    )

  const modeFromUrl =
    searchParams.get(
      'mode',
    )

  const initialMode:
    CommercialMode =
    modeFromUrl ===
      'sale'
      ? 'sale'
      : 'purchase'

  const [
    mode,
    setMode,
  ] =
    useState<CommercialMode>(
      initialMode,
    )

  const [
    horses,
    setHorses,
  ] = useState<
    HorseListItem[]
  >([])

  const [
    clients,
    setClients,
  ] =
    useState<CommercialClientList>(
      [],
    )

  const [
    availableStalls,
    setAvailableStalls,
  ] = useState<
    Stall[]
  >([])

  const [
    pendingTrades,
    setPendingTrades,
  ] = useState<
    HorseTrade[]
  >([])

  const [
    purchaseName,
    setPurchaseName,
  ] = useState('')

  const [
    purchaseBreed,
    setPurchaseBreed,
  ] = useState('')

  const [
    purchaseSex,
    setPurchaseSex,
  ] =
    useState<HorseSex>(
      'male',
    )

  const [
    purchaseBirthDate,
    setPurchaseBirthDate,
  ] = useState('')

  const [
    purchaseStallId,
    setPurchaseStallId,
  ] = useState('')

  const [
    sellerMode,
    setSellerMode,
  ] =
    useState<SellerMode>(
      'external',
    )

  const [
    sellerClientId,
    setSellerClientId,
  ] = useState('')

  const [
    externalSellerName,
    setExternalSellerName,
  ] = useState('')

  const [
    purchaseFatherName,
    setPurchaseFatherName,
  ] = useState('')

  const [
    purchaseMotherName,
    setPurchaseMotherName,
  ] = useState('')

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
    purchasePaid,
    setPurchasePaid,
  ] = useState(true)

  const [
    purchaseNotes,
    setPurchaseNotes,
  ] = useState('')

  const [
    saleHorseId,
    setSaleHorseId,
  ] = useState(
    initialMode ===
      'sale'
      ? horseFromUrl ??
        ''
      : '',
  )

  const [
    buyerMode,
    setBuyerMode,
  ] =
    useState<BuyerMode>(
      'client',
    )

  const [
    buyerClientId,
    setBuyerClientId,
  ] = useState('')

  const [
    externalBuyerName,
    setExternalBuyerName,
  ] = useState('')

  const [
    saleAmount,
    setSaleAmount,
  ] = useState(0)

  const [
    saleDate,
    setSaleDate,
  ] = useState(
    today,
  )

  const [
    saleReceived,
    setSaleReceived,
  ] = useState(true)

  const [
    keepsBoarding,
    setKeepsBoarding,
  ] = useState<
    boolean | null
  >(null)

  const [
    monthlyFee,
    setMonthlyFee,
  ] = useState(0)

  const [
    saleNotes,
    setSaleNotes,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    processingTradeId,
    setProcessingTradeId,
  ] = useState<
    string | null
  >(null)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  const loadCommercialData =
    useCallback(
      async () => {
        try {
          setError(
            null,
          )

          const [
            horsesData,
            clientsData,
            stallsData,
            pendingData,
          ] =
            await Promise.all([
              getHorses(),
              getClients(),
              getAvailableStalls(),
              getPendingHorseTrades(),
            ])

          setHorses(
            horsesData,
          )

          setClients(
            clientsData.filter(
              (client) =>
                client.active,
            ),
          )

          setAvailableStalls(
            stallsData,
          )

          setPendingTrades(
            pendingData,
          )
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar a área comercial.'

          setError(
            message,
          )
        } finally {
          setLoading(
            false,
          )
        }
      },
      [],
    )

  useEffect(() => {
    void loadCommercialData()
  }, [
    loadCommercialData,
  ])

  const existingPurchaseHorse =
    useMemo(
      () => {
        if (
          initialMode !==
            'purchase' ||
          !horseFromUrl
        ) {
          return null
        }

        return (
          horses.find(
            (horse) =>
              horse.id ===
                horseFromUrl &&
              horse.active &&
              horse.ownershipType ===
                'client',
          ) ??
          null
        )
      },
      [
        horseFromUrl,
        horses,
        initialMode,
      ],
    )

  const saleHorses =
    useMemo(
      () =>
        horses.filter(
          (horse) =>
            horse.active &&
            horse.ownershipType ===
              'haras',
        ),
      [
        horses,
      ],
    )

  const selectedSaleHorse =
    useMemo(
      () =>
        saleHorses.find(
          (horse) =>
            horse.id ===
            saleHorseId,
        ) ??
        null,
      [
        saleHorseId,
        saleHorses,
      ],
    )

  useEffect(() => {
    if (
      !existingPurchaseHorse
    ) {
      return
    }

    setPurchaseName(
      existingPurchaseHorse.name,
    )

    setPurchaseBreed(
      existingPurchaseHorse.breed ??
        '',
    )

    setPurchaseSex(
      existingPurchaseHorse.sex,
    )

    setPurchaseBirthDate(
      existingPurchaseHorse.birthDate ??
        '',
    )

    setPurchaseStallId(
      existingPurchaseHorse.stallId ??
        '',
    )

    setPurchaseFatherName(
      existingPurchaseHorse.lineageFatherName ??
        '',
    )

    setPurchaseMotherName(
      existingPurchaseHorse.lineageMotherName ??
        '',
    )

    if (
      existingPurchaseHorse.clientId
    ) {
      setSellerMode(
        'client',
      )

      setSellerClientId(
        existingPurchaseHorse.clientId,
      )

      setExternalSellerName(
        '',
      )
    }
  }, [
    existingPurchaseHorse,
  ])

  const selectedSeller =
    useMemo(
      () =>
        clients.find(
          (client) =>
            client.id ===
            sellerClientId,
        ) ??
        null,
      [
        clients,
        sellerClientId,
      ],
    )

  const selectedBuyer =
    useMemo(
      () =>
        clients.find(
          (client) =>
            client.id ===
            buyerClientId,
        ) ??
        null,
      [
        buyerClientId,
        clients,
      ],
    )

  const saleHorseOptions =
    useMemo<
      SearchableSelectOption[]
    >(
      () =>
        saleHorses.map(
          (horse) => ({
            value:
              horse.id,

            label:
              horse.breed
                ? `${horse.name} · ${horse.breed}`
                : horse.name,
          }),
        ),
      [
        saleHorses,
      ],
    )

  const clientOptions =
    useMemo<
      SearchableSelectOption[]
    >(
      () =>
        clients.map(
          (client) => ({
            value:
              client.id,

            label:
              client.name,
          }),
        ),
      [
        clients,
      ],
    )

  function getHorseName(
    horseId: string,
  ) {
    return (
      horses.find(
        (horse) =>
          horse.id ===
          horseId,
      )?.name ??
      'Cavalo'
    )
  }

  function getCounterpartyName(
    trade: HorseTrade,
  ) {
    if (
      trade.counterpartyName
    ) {
      return trade.counterpartyName
    }

    if (
      trade.counterpartyClientId
    ) {
      return (
        clients.find(
          (client) =>
            client.id ===
            trade.counterpartyClientId,
        )?.name ??
        'Não informado'
      )
    }

    return 'Não informado'
  }

  function handleModeChange(
    nextMode: CommercialMode,
  ) {
    setMode(
      nextMode,
    )

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  function handleSellerModeChange(
    nextMode: SellerMode,
  ) {
    setSellerMode(
      nextMode,
    )

    setError(
      null,
    )

    if (
      nextMode ===
      'client'
    ) {
      setExternalSellerName(
        '',
      )

      return
    }

    setSellerClientId(
      '',
    )
  }

  function handleBuyerModeChange(
    nextMode: BuyerMode,
  ) {
    setBuyerMode(
      nextMode,
    )

    setError(
      null,
    )

    if (
      nextMode ===
      'client'
    ) {
      setExternalBuyerName(
        '',
      )

      return
    }

    setBuyerClientId(
      '',
    )

    setKeepsBoarding(
      false,
    )

    setMonthlyFee(
      0,
    )
  }

  function resetNewPurchaseFields() {
    setPurchaseName(
      '',
    )

    setPurchaseBreed(
      '',
    )

    setPurchaseSex(
      'male',
    )

    setPurchaseBirthDate(
      '',
    )

    setPurchaseStallId(
      '',
    )

    setSellerMode(
      'external',
    )

    setSellerClientId(
      '',
    )

    setExternalSellerName(
      '',
    )

    setPurchaseFatherName(
      '',
    )

    setPurchaseMotherName(
      '',
    )

    setPurchaseAmount(
      0,
    )

    setPurchaseDate(
      today,
    )

    setPurchasePaid(
      true,
    )

    setPurchaseNotes(
      '',
    )
  }

  async function handlePurchaseSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      purchaseSubmittingRef.current ||
      saving ||
      loading
    ) {
      return
    }

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    const trimmedName =
      purchaseName.trim()

    const trimmedFatherName =
      purchaseFatherName.trim()

    const trimmedMotherName =
      purchaseMotherName.trim()

    if (
      !existingPurchaseHorse &&
      !trimmedName
    ) {
      setError(
        'Informe o nome do cavalo.',
      )

      return
    }

    if (
      !existingPurchaseHorse &&
      !purchaseBreed
    ) {
      setError(
        'Selecione a raça do cavalo.',
      )

      return
    }

    if (
      purchaseBirthDate &&
      purchaseBirthDate >
        today
    ) {
      setError(
        'A data de nascimento não pode estar no futuro.',
      )

      return
    }

    if (
      sellerMode ===
        'client' &&
      !selectedSeller
    ) {
      setError(
        'Selecione o vendedor.',
      )

      return
    }

    if (
      sellerMode ===
        'external' &&
      !externalSellerName.trim()
    ) {
      setError(
        'Informe o nome do vendedor.',
      )

      return
    }

    if (
      !trimmedFatherName
    ) {
      setError(
        'Informe o pai do cavalo.',
      )

      return
    }

    if (
      !trimmedMotherName
    ) {
      setError(
        'Informe a mãe do cavalo.',
      )

      return
    }

    if (
      !Number.isFinite(
        purchaseAmount,
      ) ||
      purchaseAmount <=
        0
    ) {
      setError(
        'Informe o valor da compra.',
      )

      return
    }

    if (
      !purchaseDate
    ) {
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

    purchaseSubmittingRef.current =
      true

    setSaving(
      true,
    )

    try {
      const existingLineageId =
        existingPurchaseHorse &&
        existingPurchaseHorse
          .lineageFatherName ===
          trimmedFatherName &&
        existingPurchaseHorse
          .lineageMotherName ===
          trimmedMotherName
          ? existingPurchaseHorse.lineageId
          : null

      const lineageId =
        existingLineageId ??
        (
          await createHorseLineage(
            {
              fatherName:
                trimmedFatherName,

              motherName:
                trimmedMotherName,
            },
          )
        ).id

      const tradeAt =
        dateInputToIso(
          purchaseDate,
        )

      const counterpartyClientId =
        sellerMode ===
        'client'
          ? selectedSeller?.id ??
            null
          : null

      const counterpartyName =
        sellerMode ===
        'client'
          ? selectedSeller?.name ??
            null
          : externalSellerName.trim()

      const horseName =
        existingPurchaseHorse?.name ??
        trimmedName

      if (
        existingPurchaseHorse
      ) {
        await registerHorsePurchaseWithLineage(
          {
            horseId:
              existingPurchaseHorse.id,

            lineageId,

            amount:
              purchaseAmount,

            tradeAt,

            counterpartyClientId,

            counterpartyName,

            paid:
              purchasePaid,

            paidAt:
              purchasePaid
                ? tradeAt
                : null,

            notes:
              purchaseNotes.trim() ||
              null,
          },
        )
      } else {
        await createHorseWithOptionalPurchase(
          {
            name:
              trimmedName,

            breed:
              purchaseBreed,

            sex:
              purchaseSex,

            birthDate:
              purchaseBirthDate ||
              null,

            lineageId,

            ownershipType:
              'haras',

            clientId:
              null,

            stallId:
              purchaseStallId ||
              null,

            monthlyFee:
              null,

            registerPurchase:
              true,

            purchaseAmount,

            purchaseAt:
              tradeAt,

            sellerClientId:
              counterpartyClientId,

            sellerName:
              counterpartyName,

            purchasePaid:
              purchasePaid,

            purchasePaidAt:
              purchasePaid
                ? tradeAt
                : null,

            purchaseNotes:
              purchaseNotes.trim() ||
              null,
          },
        )
      }

      setSuccessMessage(
        purchasePaid
          ? `Compra de ${horseName} registrada e enviada ao Financeiro.`
          : `Compra de ${horseName} registrada como pendente.`,
      )

      if (
        !existingPurchaseHorse
      ) {
        resetNewPurchaseFields()
      }

      await loadCommercialData()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a compra.'

      setError(
        message,
      )
    } finally {
      purchaseSubmittingRef.current =
        false

      setSaving(
        false,
      )
    }
  }

  async function handleSaleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    if (
      !selectedSaleHorse
    ) {
      setError(
        'Selecione o cavalo que será vendido.',
      )

      return
    }

    if (
      buyerMode ===
        'client' &&
      !selectedBuyer
    ) {
      setError(
        'Selecione o comprador.',
      )

      return
    }

    if (
      buyerMode ===
        'external' &&
      !externalBuyerName.trim()
    ) {
      setError(
        'Informe o nome do comprador.',
      )

      return
    }

    if (
      !Number.isFinite(
        saleAmount,
      ) ||
      saleAmount <=
        0
    ) {
      setError(
        'Informe o valor da venda.',
      )

      return
    }

    if (
      !saleDate
    ) {
      setError(
        'Informe a data da venda.',
      )

      return
    }

    if (
      saleDate >
      today
    ) {
      setError(
        'A data da venda não pode estar no futuro.',
      )

      return
    }

    if (
      keepsBoarding ===
      null
    ) {
      setError(
        'Informe se o cavalo continuará no Haras.',
      )

      return
    }

    if (
      buyerMode ===
        'external' &&
      keepsBoarding
    ) {
      setError(
        'Para continuar hospedado, o comprador precisa estar cadastrado como cliente.',
      )

      return
    }

    if (
      keepsBoarding &&
      (
        !Number.isFinite(
          monthlyFee,
        ) ||
        monthlyFee <=
          0
      )
    ) {
      setError(
        'Informe a mensalidade para o cavalo que continuará hospedado.',
      )

      return
    }

    setSaving(
      true,
    )

    try {
      const tradeAt =
        dateInputToIso(
          saleDate,
        )

      await registerHorseTrade(
        {
          horseId:
            selectedSaleHorse.id,

          tradeType:
            'sale',

          amount:
            saleAmount,

          tradeAt,

          counterpartyClientId:
            buyerMode ===
            'client'
              ? selectedBuyer?.id ??
                null
              : null,

          counterpartyName:
            buyerMode ===
            'client'
              ? selectedBuyer?.name ??
                null
              : externalBuyerName.trim(),

          paid:
            saleReceived,

          paidAt:
            saleReceived
              ? tradeAt
              : null,

          keepsBoarding,

          monthlyFee:
            keepsBoarding
              ? monthlyFee
              : null,

          notes:
            saleNotes.trim() ||
            null,
        },
      )

      setSuccessMessage(
        saleReceived
          ? `Venda de ${selectedSaleHorse.name} registrada e recebimento enviado ao Financeiro.`
          : `Venda de ${selectedSaleHorse.name} registrada como recebimento pendente.`,
      )

      setSaleHorseId(
        '',
      )

      setBuyerMode(
        'client',
      )

      setBuyerClientId(
        '',
      )

      setExternalBuyerName(
        '',
      )

      setSaleAmount(
        0,
      )

      setSaleDate(
        today,
      )

      setSaleReceived(
        true,
      )

      setKeepsBoarding(
        null,
      )

      setMonthlyFee(
        0,
      )

      setSaleNotes(
        '',
      )

      await loadCommercialData()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a venda.'

      setError(
        message,
      )
    } finally {
      setSaving(
        false,
      )
    }
  }

  async function handleConfirmPendingTrade(
    trade: HorseTrade,
  ) {
    if (
      processingTradeId
    ) {
      return
    }

    setProcessingTradeId(
      trade.id,
    )

    setError(
      null,
    )

    setSuccessMessage(
      null,
    )

    try {
      const result =
        await confirmHorseTradePayment(
          trade.id,
        )

      const horseName =
        getHorseName(
          trade.horseId,
        )

      setSuccessMessage(
        result.alreadyPaid
          ? `A operação de ${horseName} já estava confirmada.`
          : trade.tradeType ===
              'purchase'
            ? `Pagamento da compra de ${horseName} confirmado.`
            : `Recebimento da venda de ${horseName} confirmado.`,
      )

      await loadCommercialData()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível confirmar a operação.'

      setError(
        message,
      )
    } finally {
      setProcessingTradeId(
        null,
      )
    }
  }

  return (
    <section className="horse-commercial-page">
      <header className="horse-commercial-header">
        <Link
          className="horse-commercial-header__back"
          to="/cavalos"
        >
          <ArrowLeft
            size={17}
          />

          Cavalos
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Gestão comercial
          </p>

          <h1 className="page-header__title">
            Comercial
          </h1>

          <p className="page-header__description">
            Compras e vendas ficam isoladas do cadastro de cavalos de clientes.
            O sistema registra a propriedade e a movimentação financeira ao confirmar.
          </p>
        </div>
      </header>

      {error && (
        <div className="horse-commercial-message horse-commercial-message--error">
          <AlertTriangle
            size={18}
          />

          <span>
            {error}
          </span>
        </div>
      )}

      {successMessage && (
        <div className="horse-commercial-message horse-commercial-message--success">
          <CheckCircle2
            size={18}
          />

          <span>
            {successMessage}
          </span>
        </div>
      )}

      <div className="horse-commercial-mode">
        <button
          className={`horse-commercial-mode__button ${
            mode ===
            'purchase'
              ? 'horse-commercial-mode__button--active'
              : ''
          }`}
          type="button"
          onClick={() =>
            handleModeChange(
              'purchase',
            )
          }
        >
          <ArrowDownToLine
            size={18}
          />

          Registrar compra
        </button>

        <button
          className={`horse-commercial-mode__button ${
            mode ===
            'sale'
              ? 'horse-commercial-mode__button--active'
              : ''
          }`}
          type="button"
          onClick={() =>
            handleModeChange(
              'sale',
            )
          }
        >
          <ArrowUpFromLine
            size={18}
          />

          Registrar venda
        </button>
      </div>

      {loading ? (
        <div className="horse-commercial-state">
          Carregando área comercial...
        </div>
      ) : (
        <>
          {mode ===
            'purchase' && (
            <form
              className="horse-commercial-panel"
              onSubmit={
                handlePurchaseSubmit
              }
            >
              <div className="horse-commercial-panel__heading">
                <div className="horse-commercial-panel__icon">
                  <ArrowDownToLine
                    size={20}
                  />
                </div>

                <div>
                  <h2>
                    Registrar compra
                  </h2>

                  <p>
                    Informe o animal diretamente aqui. Não é necessário
                    cadastrá-lo antes na área de cavalos.
                  </p>
                </div>
              </div>

              <div className="horse-commercial-grid">
                {existingPurchaseHorse ? (
                  <div className="horse-commercial-context horse-commercial-field--full">
                    <GitBranch
                      size={18}
                    />

                    <div>
                      <span>
                        Cavalo já cadastrado
                      </span>

                      <strong>
                        {existingPurchaseHorse.name}
                        {existingPurchaseHorse.breed
                          ? ` · ${existingPurchaseHorse.breed}`
                          : ''}
                      </strong>

                      <small>
                        Proprietário atual: {existingPurchaseHorse.ownerName}.
                        O vendedor foi preenchido automaticamente e pode ser alterado.
                      </small>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="horse-commercial-field">
                      <label htmlFor="purchaseName">
                        Nome do cavalo
                      </label>

                      <input
                        id="purchaseName"
                        type="text"
                        value={
                          purchaseName
                        }
                        onChange={(
                          event,
                        ) =>
                          setPurchaseName(
                            event.target.value,
                          )
                        }
                        placeholder="Ex: Apache"
                        autoComplete="off"
                      />
                    </div>

                    <div className="horse-commercial-field">
                      <label htmlFor="purchaseBreed">
                        Raça
                      </label>

                      <SearchableSelect
                        id="purchaseBreed"
                        value={
                          purchaseBreed
                        }
                        options={
                          breedOptions
                        }
                        placeholder="Pesquise uma raça..."
                        emptyMessage="Nenhuma raça encontrada."
                        onChange={
                          setPurchaseBreed
                        }
                      />
                    </div>

                    <div className="horse-commercial-field">
                      <label htmlFor="purchaseSex">
                        Sexo
                      </label>

                      <select
                        id="purchaseSex"
                        value={
                          purchaseSex
                        }
                        onChange={(
                          event,
                        ) =>
                          setPurchaseSex(
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

                    <div className="horse-commercial-field">
                      <label htmlFor="purchaseBirthDate">
                        Data de nascimento
                      </label>

                      <input
                        id="purchaseBirthDate"
                        type="date"
                        max={
                          today
                        }
                        value={
                          purchaseBirthDate
                        }
                        onChange={(
                          event,
                        ) =>
                          setPurchaseBirthDate(
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="horse-commercial-field">
                      <label htmlFor="purchaseStall">
                        Baia
                      </label>

                      <select
                        id="purchaseStall"
                        value={
                          purchaseStallId
                        }
                        onChange={(
                          event,
                        ) =>
                          setPurchaseStallId(
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
                  </>
                )}

                <div
                  className="horse-commercial-grid horse-commercial-field--full"
                  style={{
                    marginTop:
                      0,
                  }}
                >
                  {sellerMode ===
                    'client' ? (
                    <div className="horse-commercial-field">
                      <label htmlFor="sellerClient">
                        Cliente vendedor
                      </label>

                      <SearchableSelect
                        id="sellerClient"
                        value={
                          sellerClientId
                        }
                        options={
                          clientOptions
                        }
                        placeholder="Pesquise o cliente..."
                        emptyMessage="Nenhum cliente encontrado."
                        onChange={
                          setSellerClientId
                        }
                      />
                    </div>
                  ) : (
                    <div className="horse-commercial-field">
                      <label htmlFor="externalSeller">
                        Nome do vendedor
                      </label>

                      <input
                        id="externalSeller"
                        type="text"
                        value={
                          externalSellerName
                        }
                        onChange={(
                          event,
                        ) =>
                          setExternalSellerName(
                            event.target.value,
                          )
                        }
                        placeholder="Ex: João da Silva"
                        autoComplete="off"
                      />

                      <small>
                        O vendedor não precisa virar cliente do Haras.
                      </small>
                    </div>
                  )}

                  <div className="horse-commercial-field">
                    <label htmlFor="sellerMode">
                      Vendedor
                    </label>

                    <select
                      id="sellerMode"
                      value={
                        sellerMode
                      }
                      onChange={(
                        event,
                      ) =>
                        handleSellerModeChange(
                          event.target
                            .value as SellerMode,
                        )
                      }
                    >
                      <option value="client">
                        Cliente cadastrado
                      </option>

                      <option value="external">
                        Vendedor externo
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  className="horse-commercial-grid horse-commercial-field--full"
                  style={{
                    marginTop:
                      0,
                  }}
                >
                  <div className="horse-commercial-field">
                    <label htmlFor="purchaseFather">
                      Pai
                    </label>

                    <input
                      id="purchaseFather"
                      type="text"
                      value={
                        purchaseFatherName
                      }
                      onChange={(
                        event,
                      ) =>
                        setPurchaseFatherName(
                          event.target.value,
                        )
                      }
                      placeholder="Nome do pai"
                      autoComplete="off"
                    />
                  </div>

                  <div className="horse-commercial-field">
                    <label htmlFor="purchaseMother">
                      Mãe
                    </label>

                    <input
                      id="purchaseMother"
                      type="text"
                      value={
                        purchaseMotherName
                      }
                      onChange={(
                        event,
                      ) =>
                        setPurchaseMotherName(
                          event.target.value,
                        )
                      }
                      placeholder="Nome da mãe"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div
                  className="horse-commercial-field"
                  style={{
                    maxWidth:
                      '260px',
                  }}
                >
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
                </div>

                <div className="horse-commercial-field">
                  <label htmlFor="purchaseDate">
                    Data
                  </label>

                  <input
                    id="purchaseDate"
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
                  />
                </div>

                <div className="horse-commercial-field">
                  <label htmlFor="purchasePayment">
                    Pagamento
                  </label>

                  <select
                    id="purchasePayment"
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
                      Pagamento pendente
                    </option>
                  </select>
                </div>

                <div className="horse-commercial-field horse-commercial-field--full">
                  <label htmlFor="purchaseNotes">
                    Observação
                  </label>

                  <textarea
                    id="purchaseNotes"
                    value={
                      purchaseNotes
                    }
                    onChange={(
                      event,
                    ) =>
                      setPurchaseNotes(
                        event.target.value,
                      )
                    }
                    placeholder="Opcional"
                    rows={3}
                  />
                </div>
              </div>

              <div className="horse-commercial-panel__actions">
                <button
                  className="horse-commercial-submit"
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? 'Registrando...'
                    : 'Confirmar compra'}
                </button>
              </div>
            </form>
          )}

          {mode ===
            'sale' && (
            <form
              className="horse-commercial-panel"
              onSubmit={
                handleSaleSubmit
              }
            >
              <div className="horse-commercial-panel__heading">
                <div className="horse-commercial-panel__icon">
                  <ArrowUpFromLine
                    size={20}
                  />
                </div>

                <div>
                  <h2>
                    Registrar venda
                  </h2>

                  <p>
                    Selecione um animal que já pertence ao Haras.
                  </p>
                </div>
              </div>

              <div className="horse-commercial-grid">
                <div className="horse-commercial-field horse-commercial-field--full">
                  <label htmlFor="saleHorse">
                    Cavalo
                  </label>

                  <SearchableSelect
                    id="saleHorse"
                    value={
                      saleHorseId
                    }
                    options={
                      saleHorseOptions
                    }
                    placeholder="Pesquise o cavalo..."
                    emptyMessage="Nenhum cavalo do Haras encontrado."
                    onChange={
                      setSaleHorseId
                    }
                  />
                </div>

                {selectedSaleHorse && (
                  <div className="horse-commercial-context horse-commercial-field--full">
                    <GitBranch
                      size={18}
                    />

                    <div>
                      <span>
                        Linhagem
                      </span>

                      <strong>
                        {getHorseLineageLabel(
                          selectedSaleHorse,
                        )}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="horse-commercial-field">
                  <label htmlFor="buyerMode">
                    Comprador
                  </label>

                  <select
                    id="buyerMode"
                    value={
                      buyerMode
                    }
                    onChange={(
                      event,
                    ) =>
                      handleBuyerModeChange(
                        event.target
                          .value as BuyerMode,
                      )
                    }
                  >
                    <option value="client">
                      Cliente cadastrado
                    </option>

                    <option value="external">
                      Comprador externo
                    </option>
                  </select>
                </div>

                {buyerMode ===
                  'client' ? (
                  <div className="horse-commercial-field">
                    <label htmlFor="buyerClient">
                      Cliente
                    </label>

                    <SearchableSelect
                      id="buyerClient"
                      value={
                        buyerClientId
                      }
                      options={
                        clientOptions
                      }
                      placeholder="Pesquise o cliente..."
                      emptyMessage="Nenhum cliente encontrado."
                      onChange={
                        setBuyerClientId
                      }
                    />
                  </div>
                ) : (
                  <div className="horse-commercial-field">
                    <label htmlFor="externalBuyer">
                      Nome do comprador
                    </label>

                    <input
                      id="externalBuyer"
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
                      autoComplete="off"
                    />
                  </div>
                )}

                <div className="horse-commercial-field">
                  <label htmlFor="saleAmount">
                    Valor da venda
                  </label>

                  <MoneyInput
                    id="saleAmount"
                    value={
                      saleAmount
                    }
                    onChange={
                      setSaleAmount
                    }
                  />
                </div>

                <div className="horse-commercial-field">
                  <label htmlFor="saleDate">
                    Data
                  </label>

                  <input
                    id="saleDate"
                    type="date"
                    max={
                      today
                    }
                    value={
                      saleDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setSaleDate(
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="horse-commercial-field">
                  <label htmlFor="salePayment">
                    Recebimento
                  </label>

                  <select
                    id="salePayment"
                    value={
                      saleReceived
                        ? 'paid'
                        : 'pending'
                    }
                    onChange={(
                      event,
                    ) =>
                      setSaleReceived(
                        event.target.value ===
                          'paid',
                      )
                    }
                  >
                    <option value="paid">
                      Já foi recebido
                    </option>

                    <option value="pending">
                      Recebimento pendente
                    </option>
                  </select>
                </div>

                <div className="horse-commercial-field">
                  <label htmlFor="keepsBoarding">
                    Continua no Haras?
                  </label>

                  <select
                    id="keepsBoarding"
                    value={
                      keepsBoarding ===
                      null
                        ? ''
                        : keepsBoarding
                          ? 'yes'
                          : 'no'
                    }
                    onChange={(
                      event,
                    ) => {
                      const value =
                        event.target.value

                      if (
                        value ===
                        ''
                      ) {
                        setKeepsBoarding(
                          null,
                        )

                        return
                      }

                      const stays =
                        value ===
                        'yes'

                      setKeepsBoarding(
                        stays,
                      )

                      if (
                        !stays
                      ) {
                        setMonthlyFee(
                          0,
                        )
                      }
                    }}
                    disabled={
                      buyerMode ===
                      'external'
                    }
                  >
                    <option value="">
                      Selecione
                    </option>

                    <option value="yes">
                      Sim, continua hospedado
                    </option>

                    <option value="no">
                      Não, sai do Haras
                    </option>
                  </select>
                </div>

                {keepsBoarding && (
                  <div className="horse-commercial-field">
                    <label htmlFor="monthlyFee">
                      Nova mensalidade
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

                <div className="horse-commercial-field horse-commercial-field--full">
                  <label htmlFor="saleNotes">
                    Observação
                  </label>

                  <textarea
                    id="saleNotes"
                    value={
                      saleNotes
                    }
                    onChange={(
                      event,
                    ) =>
                      setSaleNotes(
                        event.target.value,
                      )
                    }
                    placeholder="Opcional"
                    rows={3}
                  />
                </div>
              </div>

              <div className="horse-commercial-panel__actions">
                <button
                  className="horse-commercial-submit"
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? 'Registrando...'
                    : 'Confirmar venda'}
                </button>
              </div>
            </form>
          )}

          <section className="horse-commercial-pending">
            <div className="horse-commercial-pending__heading">
              <div>
                <span>
                  Financeiro
                </span>

                <h2>
                  Pendências
                </h2>

                <p>
                  Operações que ainda aguardam pagamento ou recebimento.
                </p>
              </div>

              <div className="horse-commercial-pending__count">
                <Clock3
                  size={16}
                />

                {
                  pendingTrades.length
                }
              </div>
            </div>

            {pendingTrades.length ===
              0 ? (
              <div className="horse-commercial-empty">
                <CheckCircle2
                  size={22}
                />

                <div>
                  <strong>
                    Nenhuma pendência comercial
                  </strong>

                  <span>
                    Não há pagamentos ou recebimentos aguardando confirmação.
                  </span>
                </div>
              </div>
            ) : (
              <div className="horse-commercial-pending__list">
                {pendingTrades.map(
                  (
                    trade,
                  ) => {
                    const horseName =
                      getHorseName(
                        trade.horseId,
                      )

                    const processing =
                      processingTradeId ===
                      trade.id

                    return (
                      <article
                        className="horse-commercial-pending-card"
                        key={
                          trade.id
                        }
                      >
                        <div className="horse-commercial-pending-card__icon">
                          <ReceiptText
                            size={18}
                          />
                        </div>

                        <div className="horse-commercial-pending-card__content">
                          <span>
                            {getTradeLabel(
                              trade,
                            )}
                          </span>

                          <strong>
                            {
                              horseName
                            }
                          </strong>

                          <small>
                            {getCounterpartyName(
                              trade,
                            )}
                            {' · '}
                            {formatDate(
                              trade.tradeAt,
                            )}
                          </small>
                        </div>

                        <div className="horse-commercial-pending-card__value">
                          <strong>
                            {formatCurrency(
                              trade.amount,
                            )}
                          </strong>

                          <button
                            type="button"
                            disabled={
                              processing
                            }
                            onClick={() =>
                              void handleConfirmPendingTrade(
                                trade,
                              )
                            }
                          >
                            {processing
                              ? 'Confirmando...'
                              : trade.tradeType ===
                                  'purchase'
                                ? 'Confirmar pagamento'
                                : 'Confirmar recebimento'}
                          </button>
                        </div>
                      </article>
                    )
                  },
                )}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
