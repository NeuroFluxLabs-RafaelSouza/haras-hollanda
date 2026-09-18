import {
  useCallback,
  useEffect,
  useMemo,
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
  Plus,
  ReceiptText,
  UserRound,
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
  HorseTrade,
} from '../../domain/horseTrade.ts'

import type {
  HorseLineage,
} from '../../domain/horseLineage.ts'

import {
  getClients,
} from '../clients/clientsService.ts'

import {
  createHorseLineage,
  getHorseLineages,
} from './horseLineagesService.ts'

import {
  registerHorsePurchaseWithLineage,
} from './horsePurchaseService.ts'

import {
  confirmHorseTradePayment,
  getPendingHorseTrades,
  registerHorseTrade,
} from './horseTradesService.ts'

import {
  getHorses,
  type HorseListItem,
} from './horsesService.ts'

import './HorseCommercialPage.css'

type CommercialMode =
  | 'purchase'
  | 'sale'

type BuyerMode =
  | 'client'
  | 'external'

type CommercialClientList =
  Awaited<
    ReturnType<
      typeof getClients
    >
  >

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

function uniqueParentNames(
  values: string[],
) {
  return Array.from(
    new Set(
      values
        .map(
          (value) =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  ).sort(
    (
      first,
      second,
    ) =>
      first.localeCompare(
        second,
        'pt-BR',
      ),
  )
}

export function HorseCommercialPage() {
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
    lineages,
    setLineages,
  ] = useState<
    HorseLineage[]
  >([])

  const [
    pendingTrades,
    setPendingTrades,
  ] = useState<
    HorseTrade[]
  >([])

  const [
    purchaseHorseId,
    setPurchaseHorseId,
  ] = useState(
    initialMode ===
      'purchase'
      ? horseFromUrl ??
        ''
      : '',
  )

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
            lineagesData,
            pendingData,
          ] =
            await Promise.all([
              getHorses(),
              getClients(),
              getHorseLineages(),
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

          setLineages(
            lineagesData,
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

  const purchaseHorses =
    useMemo(
      () =>
        horses.filter(
          (horse) =>
            horse.active &&
            horse.ownershipType ===
              'client' &&
            horse.clientId !==
              null,
        ),
      [
        horses,
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

  const selectedPurchaseHorse =
    useMemo(
      () =>
        purchaseHorses.find(
          (horse) =>
            horse.id ===
            purchaseHorseId,
        ) ??
        null,
      [
        purchaseHorseId,
        purchaseHorses,
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
      !selectedPurchaseHorse
    ) {
      setPurchaseFatherName(
        '',
      )

      setPurchaseMotherName(
        '',
      )

      return
    }

    setPurchaseFatherName(
      selectedPurchaseHorse.lineageFatherName ??
        '',
    )

    setPurchaseMotherName(
      selectedPurchaseHorse.lineageMotherName ??
        '',
    )
  }, [
    selectedPurchaseHorse,
  ])

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

  const purchaseHorseOptions =
    useMemo<
      SearchableSelectOption[]
    >(
      () =>
        purchaseHorses.map(
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
        purchaseHorses,
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

  const fatherOptions =
    useMemo<
      SearchableSelectOption[]
    >(
      () =>
        uniqueParentNames(
          lineages.map(
            (lineage) =>
              lineage.fatherName,
          ),
        ).map(
          (father) => ({
            value:
              father,

            label:
              father,
          }),
        ),
      [
        lineages,
      ],
    )

  const motherOptions =
    useMemo<
      SearchableSelectOption[]
    >(
      () =>
        uniqueParentNames(
          lineages.map(
            (lineage) =>
              lineage.motherName,
          ),
        ).map(
          (mother) => ({
            value:
              mother,

            label:
              mother,
          }),
        ),
      [
        lineages,
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

  async function handlePurchaseSubmit(
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
      !selectedPurchaseHorse
    ) {
      setError(
        'Selecione o cavalo que será comprado pelo Haras.',
      )

      return
    }

    if (
      !selectedPurchaseHorse.clientId
    ) {
      setError(
        'O cavalo selecionado não possui proprietário cadastrado.',
      )

      return
    }

    const trimmedFatherName =
      purchaseFatherName.trim()

    const trimmedMotherName =
      purchaseMotherName.trim()

    if (
      !trimmedFatherName
    ) {
      setError(
        'Selecione o pai do cavalo.',
      )

      return
    }

    if (
      !trimmedMotherName
    ) {
      setError(
        'Selecione a mãe do cavalo.',
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

    setSaving(
      true,
    )

    try {
      const lineage =
        await createHorseLineage(
          {
            fatherName:
              trimmedFatherName,

            motherName:
              trimmedMotherName,
          },
        )

      const tradeAt =
        dateInputToIso(
          purchaseDate,
        )

      await registerHorsePurchaseWithLineage(
        {
          horseId:
            selectedPurchaseHorse.id,

          lineageId:
            lineage.id,

          amount:
            purchaseAmount,

          tradeAt,

          counterpartyClientId:
            selectedPurchaseHorse.clientId,

          counterpartyName:
            selectedPurchaseHorse.ownerName,

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

      setSuccessMessage(
        purchasePaid
          ? `Compra de ${selectedPurchaseHorse.name} registrada e enviada ao Financeiro.`
          : `Compra de ${selectedPurchaseHorse.name} registrada como pendente.`,
      )

      setPurchaseHorseId(
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
            Registre compras e vendas. O sistema cuida da propriedade,
            hospedagem e integração financeira.
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
                    Selecione o animal. O sistema reaproveita os dados já
                    cadastrados sempre que possível.
                  </p>
                </div>
              </div>

              <div className="horse-commercial-grid">
                <div className="horse-commercial-field horse-commercial-field--full">
                  <label htmlFor="purchaseHorse">
                    Cavalo
                  </label>

                  <SearchableSelect
                    id="purchaseHorse"
                    value={
                      purchaseHorseId
                    }
                    options={
                      purchaseHorseOptions
                    }
                    placeholder="Pesquise o cavalo..."
                    emptyMessage="Nenhum cavalo encontrado."
                    onChange={
                      setPurchaseHorseId
                    }
                  />

                  <div className="horse-commercial-new-horse">
                    <div>
                      <strong>
                        Não encontrou o cavalo?
                      </strong>

                      <span>
                        Cadastre agora e volte para a compra com o animal já
                        selecionado.
                      </span>
                    </div>

                    <Link
                      to="/cavalos/novo?returnTo=comercial&mode=purchase"
                    >
                      <Plus
                        size={15}
                      />

                      Novo cavalo
                    </Link>
                  </div>
                </div>

                {selectedPurchaseHorse && (
                  <div className="horse-commercial-context horse-commercial-field--full">
                    <UserRound
                      size={18}
                    />

                    <div>
                      <span>
                        Vendedor
                      </span>

                      <strong>
                        {selectedPurchaseHorse.ownerName}
                      </strong>

                      <small>
                        Identificado automaticamente pelo proprietário atual.
                      </small>
                    </div>
                  </div>
                )}

                <div className="horse-commercial-field">
                  <label>
                    Pai
                  </label>

                  <SearchableSelect
                    id="purchaseFather"
                    value={
                      purchaseFatherName
                    }
                    options={
                      fatherOptions
                    }
                    placeholder="Pesquise o pai..."
                    emptyMessage="Nenhum pai cadastrado."
                    onChange={
                      setPurchaseFatherName
                    }
                  />

                  <small>
                    Pesquise entre os pais já cadastrados.
                  </small>
                </div>

                <div className="horse-commercial-field">
                  <label>
                    Mãe
                  </label>

                  <SearchableSelect
                    id="purchaseMother"
                    value={
                      purchaseMotherName
                    }
                    options={
                      motherOptions
                    }
                    placeholder="Pesquise a mãe..."
                    emptyMessage="Nenhuma mãe cadastrada."
                    onChange={
                      setPurchaseMotherName
                    }
                  />

                  <small>
                    Pesquise entre as mães já cadastradas.
                  </small>
                </div>

                <div className="horse-commercial-field">
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
                    Apenas animais pertencentes ao Haras aparecem para venda.
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
                    emptyMessage="Nenhum cavalo encontrado."
                    onChange={
                      setSaleHorseId
                    }
                  />

                  <div className="horse-commercial-new-horse">
                    <div>
                      <strong>
                        Não encontrou o cavalo?
                      </strong>

                      <span>
                        Cadastre agora e volte para a venda com o animal já
                        selecionado.
                      </span>
                    </div>

                    <Link
                      to="/cavalos/novo?returnTo=comercial&mode=sale"
                    >
                      <Plus
                        size={15}
                      />

                      Novo cavalo
                    </Link>
                  </div>
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

                      if (!stays) {
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

                {pendingTrades.length}
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
                  (trade) => {
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
                            {horseName}
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