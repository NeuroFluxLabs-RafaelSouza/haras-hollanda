import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  Boxes,
  Plus,
  Search,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_UNIT_LABELS,
  type InventoryItemSummary,
} from '../../domain/inventory.ts'

import {
  getInventorySummary,
} from './inventoryService.ts'

import './InventoryPage.css'

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

function formatQuantity(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      maximumFractionDigits: 2,
    },
  ).format(value)
}

function getUnitLabel(
  unit:
    InventoryItemSummary[
      'item'
    ]['unit'],
  quantity: number,
) {
  if (quantity === 1) {
    return INVENTORY_UNIT_LABELS[
      unit
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
    unit
  ]
}

export function InventoryPage() {
  const [
    items,
    setItems,
  ] = useState<InventoryItemSummary[]>(
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

    async function loadInventory() {
      try {
        const data =
          await getInventorySummary()

        if (isMounted) {
          setItems(data)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o estoque.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInventory()

    return () => {
      isMounted = false
    }
  }, [])

  const activeItems =
    useMemo(
      () =>
        items.filter(
          ({ item }) =>
            item.active,
        ),
      [items],
    )

  const lowStockItems =
    useMemo(
      () =>
        activeItems.filter(
          (item) =>
            item.isBelowMinimum,
        ),
      [activeItems],
    )

  const filteredItems =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(search)

      if (!normalizedSearch) {
        return activeItems
      }

      return activeItems.filter(
        ({ item }) => {
          const category =
            INVENTORY_CATEGORY_LABELS[
              item.category
            ]

          return [
            item.name,
            category,
          ].some(
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
      activeItems,
      search,
    ])

  return (
    <section className="inventory-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          Controle operacional
        </p>

        <h1 className="page-header__title">
          Estoque
        </h1>

        <p className="page-header__description">
          Acompanhe insumos, quantidades disponíveis e níveis mínimos do
          haras.
        </p>
      </header>

      <div className="inventory-metrics">
        <article className="inventory-metric">
          <div className="inventory-metric__icon">
            <Boxes
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <span>
              Itens ativos
            </span>

            <strong>
              {loading
                ? '...'
                : activeItems.length}
            </strong>
          </div>
        </article>

        <article className="inventory-metric">
          <div className="inventory-metric__icon inventory-metric__icon--warning">
            <AlertTriangle
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <span>
              Estoque baixo
            </span>

            <strong>
              {loading
                ? '...'
                : lowStockItems.length}
            </strong>
          </div>
        </article>
      </div>

      <div className="inventory-toolbar">
        <div className="inventory-search">
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
            placeholder="Buscar item..."
            aria-label="Buscar item do estoque"
          />
        </div>

        <Link
          className="inventory-add-button"
          to="/estoque/novo"
        >
          <Plus size={17} />
          Novo item
        </Link>
      </div>

      {error && (
        <div className="inventory-state inventory-state--error">
          {error}
        </div>
      )}

      {loading && (
        <div className="inventory-state">
          Carregando estoque...
        </div>
      )}

      {!loading &&
        !error &&
        activeItems.length === 0 && (
          <div className="inventory-empty">
            <Archive
              size={26}
              strokeWidth={1.6}
            />

            <strong>
              Nenhum item cadastrado
            </strong>

            <span>
              Cadastre o primeiro item para começar a controlar o estoque.
            </span>
          </div>
        )}

      {!loading &&
        !error &&
        activeItems.length > 0 &&
        filteredItems.length === 0 && (
          <div className="inventory-state">
            Nenhum item encontrado para “{search}”.
          </div>
        )}

      {!loading &&
        !error &&
        filteredItems.length > 0 && (
          <div className="inventory-grid">
            {filteredItems.map(
              ({
                item,
                currentStock,
                isBelowMinimum,
              }) => (
                <article
                  className={`inventory-card ${
                    isBelowMinimum
                      ? 'inventory-card--warning'
                      : ''
                  }`}
                  key={item.id}
                >
                  <div className="inventory-card__header">
                    <div>
                      <span className="inventory-card__category">
                        {
                          INVENTORY_CATEGORY_LABELS[
                            item.category
                          ]
                        }
                      </span>

                      <h2>
                        {item.name}
                      </h2>
                    </div>

                    <span
                      className={`inventory-card__status ${
                        isBelowMinimum
                          ? 'inventory-card__status--warning'
                          : 'inventory-card__status--ok'
                      }`}
                    >
                      {isBelowMinimum
                        ? 'Estoque baixo'
                        : 'Normal'}
                    </span>
                  </div>

                  <div className="inventory-card__stock">
                    <div>
                      <span>
                        Estoque atual
                      </span>

                      <strong>
                        {formatQuantity(
                          currentStock,
                        )}{' '}
                        {getUnitLabel(
                          item.unit,
                          currentStock,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Estoque mínimo
                      </span>

                      <strong>
                        {formatQuantity(
                          item.minimumStock,
                        )}{' '}
                        {getUnitLabel(
                          item.unit,
                          item.minimumStock,
                        )}
                      </strong>
                    </div>
                  </div>

                  {isBelowMinimum && (
                    <div className="inventory-card__alert">
                      <AlertTriangle
                        size={15}
                        strokeWidth={1.8}
                      />

                      <span>
                        Reposição recomendada.
                      </span>
                    </div>
                  )}

                  <div className="inventory-card__actions">
                    <Link
                      className="inventory-card__movement inventory-card__movement--entry"
                      to={`/estoque/${item.id}/movimentar?type=entry`}
                    >
                      <ArrowDown
                        size={15}
                      />
                      Registrar entrada
                    </Link>

                    <Link
                      className="inventory-card__movement inventory-card__movement--exit"
                      to={`/estoque/${item.id}/movimentar?type=exit`}
                    >
                      <ArrowUp
                        size={15}
                      />
                      Registrar saída
                    </Link>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
    </section>
  )
}