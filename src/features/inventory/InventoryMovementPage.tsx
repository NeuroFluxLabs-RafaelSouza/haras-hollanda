import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Package,
} from 'lucide-react'

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import {
  MoneyInput,
} from '../../components/ui/MoneyInput.tsx'

import {
  INVENTORY_UNIT_LABELS,
  type InventoryItem,
  type InventoryMovementType,
} from '../../domain/inventory.ts'

import {
  createInventoryMovement,
  getInventoryCurrentStock,
  getInventoryItemById,
} from './inventoryService.ts'

import './InventoryMovementPage.css'

function getCurrentDateTimeLocal() {
  const now = new Date()

  const year =
    now.getFullYear()

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    now.getDate(),
  ).padStart(2, '0')

  const hours = String(
    now.getHours(),
  ).padStart(2, '0')

  const minutes = String(
    now.getMinutes(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function parseQuantity(
  value: string,
) {
  const normalizedValue =
    value
      .trim()
      .replace(',', '.')

  const parsedValue =
    Number(normalizedValue)

  if (
    Number.isNaN(parsedValue)
  ) {
    return 0
  }

  return parsedValue
}

function formatQuantity(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(value)
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  ).format(value)
}

function getUnitLabel(
  item: InventoryItem,
  quantity: number,
) {
  if (quantity === 1) {
    return INVENTORY_UNIT_LABELS[
      item.unit
    ]
  }

  const pluralLabels = {
    kg: 'Kg',
    bag: 'Sacos',
    bale: 'Fardos',
    liter: 'Litros',
    unit: 'Unidades',
    box: 'Caixas',
  }

  return pluralLabels[
    item.unit
  ]
}

export function InventoryMovementPage() {
  const navigate = useNavigate()

  const {
    itemId,
  } = useParams()

  const [
    searchParams,
  ] = useSearchParams()

  const requestedType =
    searchParams.get('type')

  const initialMovementType:
    InventoryMovementType =
      requestedType === 'exit'
        ? 'exit'
        : 'entry'

  const [
    item,
    setItem,
  ] = useState<InventoryItem | null>(
    null,
  )

  const [
    currentStock,
    setCurrentStock,
  ] = useState(0)

  const [
    movementType,
    setMovementType,
  ] = useState<InventoryMovementType>(
    initialMovementType,
  )

  const [
    quantity,
    setQuantity,
  ] = useState('')

  const [
    unitCost,
    setUnitCost,
  ] = useState(0)

  const [
    movementAt,
    setMovementAt,
  ] = useState(
    getCurrentDateTimeLocal(),
  )

  const [
    notes,
    setNotes,
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
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (
      requestedType === 'entry' ||
      requestedType === 'exit'
    ) {
      setMovementType(
        requestedType,
      )
    }
  }, [requestedType])

  useEffect(() => {
    let isMounted = true

    async function loadItem() {
      if (!itemId) {
        setError(
          'Item de estoque não identificado.',
        )

        setLoading(false)

        return
      }

      try {
        const [
          itemData,
          stock,
        ] = await Promise.all([
          getInventoryItemById(
            itemId,
          ),

          getInventoryCurrentStock(
            itemId,
          ),
        ])

        if (!isMounted) {
          return
        }

        setItem(
          itemData,
        )

        setCurrentStock(
          stock,
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o item.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadItem()

    return () => {
      isMounted = false
    }
  }, [itemId])

  const parsedQuantity =
    useMemo(
      () =>
        parseQuantity(
          quantity,
        ),
      [quantity],
    )

  const totalValue =
    useMemo(
      () =>
        movementType === 'entry'
          ? parsedQuantity *
            unitCost
          : 0,
      [
        movementType,
        parsedQuantity,
        unitCost,
      ],
    )

  const projectedStock =
    useMemo(() => {
      if (
        movementType === 'entry'
      ) {
        return (
          currentStock +
          parsedQuantity
        )
      }

      return (
        currentStock -
        parsedQuantity
      )
    }, [
      currentStock,
      movementType,
      parsedQuantity,
    ])

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)

    if (
      !itemId ||
      !item
    ) {
      return
    }

    if (
      parsedQuantity <= 0
    ) {
      setError(
        'Informe uma quantidade maior que zero.',
      )

      return
    }

    if (
      movementType ===
        'exit' &&
      parsedQuantity >
        currentStock
    ) {
      setError(
        `Estoque insuficiente. Disponível: ${formatQuantity(
          currentStock,
        )} ${getUnitLabel(
          item,
          currentStock,
        )}.`,
      )

      return
    }

    if (!movementAt) {
      setError(
        'Informe a data e o horário da movimentação.',
      )

      return
    }

    const movementDate =
      new Date(movementAt)

    if (
      Number.isNaN(
        movementDate.getTime(),
      )
    ) {
      setError(
        'Informe uma data e horário válidos.',
      )

      return
    }

    setSaving(true)

    try {
      await createInventoryMovement({
        itemId,

        movementType,

        quantity:
          parsedQuantity,

        unitCost:
          movementType ===
            'entry' &&
          unitCost > 0
            ? unitCost
            : null,

        notes:
          notes.trim() ||
          null,

        movementAt:
          movementDate.toISOString(),
      })

      navigate('/estoque')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a movimentação.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="inventory-movement-state">
        Carregando item...
      </div>
    )
  }

  if (!item) {
    return (
      <div className="inventory-movement-state inventory-movement-state--error">
        {error ??
          'Item não encontrado.'}
      </div>
    )
  }

  return (
    <section className="inventory-movement-page">
      <header className="inventory-movement-header">
        <Link
          className="inventory-movement-header__back"
          to="/estoque"
        >
          <ArrowLeft size={17} />
          Estoque
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Movimentação
          </p>

          <h1 className="page-header__title">
            {item.name}
          </h1>

          <p className="page-header__description">
            Registre entradas e saídas para manter o saldo do estoque
            atualizado.
          </p>
        </div>
      </header>

      <div className="inventory-movement-summary">
        <div className="inventory-movement-summary__icon">
          <Package
            size={20}
            strokeWidth={1.8}
          />
        </div>

        <div>
          <span>
            Estoque atual
          </span>

          <strong>
            {formatQuantity(
              currentStock,
            )}{' '}
            {getUnitLabel(
              item,
              currentStock,
            )}
          </strong>
        </div>
      </div>

      <form
        className="inventory-movement-form"
        onSubmit={handleSubmit}
      >
        <div className="inventory-movement-form__header">
          <div>
            <h2>
              Registrar movimentação
            </h2>

            <p>
              Informe o tipo e os dados da movimentação.
            </p>
          </div>
        </div>

        <div className="inventory-movement-type">
          <button
            type="button"
            className={`inventory-movement-type__button ${
              movementType ===
              'entry'
                ? 'inventory-movement-type__button--active'
                : ''
            }`}
            onClick={() =>
              setMovementType(
                'entry',
              )
            }
          >
            <ArrowDown size={17} />
            Entrada
          </button>

          <button
            type="button"
            className={`inventory-movement-type__button ${
              movementType ===
              'exit'
                ? 'inventory-movement-type__button--active'
                : ''
            }`}
            onClick={() =>
              setMovementType(
                'exit',
              )
            }
          >
            <ArrowUp size={17} />
            Saída
          </button>
        </div>

        <div className="inventory-movement-form__grid">
          <div className="inventory-movement-field">
            <label htmlFor="quantity">
              Quantidade
            </label>

            <input
              id="quantity"
              name="quantity"
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value,
                )
              }
              placeholder="Ex: 20"
              autoComplete="off"
            />

            <span className="inventory-movement-field__help">
              Unidade:{' '}
              {
                INVENTORY_UNIT_LABELS[
                  item.unit
                ]
              }
            </span>
          </div>

          <div className="inventory-movement-field">
            <label htmlFor="movementAt">
              Data e horário
            </label>

            <input
              id="movementAt"
              name="movementAt"
              type="datetime-local"
              value={movementAt}
              onChange={(event) =>
                setMovementAt(
                  event.target.value,
                )
              }
              required
            />
          </div>

          {movementType ===
            'entry' && (
            <div className="inventory-movement-field inventory-movement-field--full">
              <label htmlFor="unitCost">
                Custo unitário
              </label>

              <MoneyInput
                id="unitCost"
                value={unitCost}
                onChange={
                  setUnitCost
                }
                aria-label="Custo unitário"
              />

              <span className="inventory-movement-field__help">
                Digite apenas os números. O valor é formatado automaticamente.
              </span>
            </div>
          )}

          <div className="inventory-movement-field inventory-movement-field--full">
            <label htmlFor="notes">
              Observação
            </label>

            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              placeholder={
                movementType ===
                'entry'
                  ? 'Ex: Compra realizada no fornecedor habitual.'
                  : 'Ex: Retirada para alimentação dos animais.'
              }
              rows={4}
            />
          </div>
        </div>

        <div className="inventory-movement-preview">
          <div>
            <span>
              Saldo atual
            </span>

            <strong>
              {formatQuantity(
                currentStock,
              )}{' '}
              {getUnitLabel(
                item,
                currentStock,
              )}
            </strong>
          </div>

          <div>
            <span>
              {movementType ===
              'entry'
                ? 'Entrada'
                : 'Saída'}
            </span>

            <strong>
              {movementType ===
              'entry'
                ? '+'
                : '-'}
              {formatQuantity(
                parsedQuantity,
              )}
            </strong>
          </div>

          <div>
            <span>
              Saldo após movimentação
            </span>

            <strong
              className={
                projectedStock < 0
                  ? 'inventory-movement-preview__danger'
                  : ''
              }
            >
              {formatQuantity(
                projectedStock,
              )}{' '}
              {getUnitLabel(
                item,
                projectedStock,
              )}
            </strong>
          </div>
        </div>

        {movementType ===
          'entry' && (
          <div className="inventory-movement-total">
            <span>
              Valor total da entrada
            </span>

            <strong>
              {formatCurrency(
                totalValue,
              )}
            </strong>

            <small>
              {formatQuantity(
                parsedQuantity,
              )}{' '}
              ×{' '}
              {formatCurrency(
                unitCost,
              )}
            </small>
          </div>
        )}

        {error && (
          <div className="inventory-movement-form__error">
            {error}
          </div>
        )}

        <div className="inventory-movement-form__actions">
          <Link
            className="inventory-movement-cancel"
            to="/estoque"
          >
            Cancelar
          </Link>

          <button
            className="inventory-movement-submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Registrando...'
              : movementType ===
                  'entry'
                ? 'Registrar entrada'
                : 'Registrar saída'}
          </button>
        </div>
      </form>
    </section>
  )
}