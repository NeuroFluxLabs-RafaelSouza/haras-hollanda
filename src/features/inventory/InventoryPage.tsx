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
  Gauge,
  PackageSearch,
  Search,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_UNIT_LABELS,
  type InventoryUnit,
} from '../../domain/inventory.ts'

import {
  INVENTORY_REPLENISHMENT_DAYS,
  getInventorySummary,
  type InventoryOperationalSummary,
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
      maximumFractionDigits: 3,
    },
  ).format(value)
}

function formatAutonomy(
  value: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      maximumFractionDigits: 1,
    },
  ).format(value)
}

const PLURAL_UNIT_LABELS: Record<
  InventoryUnit,
  string
> = {
  kg: 'Kg',
  bag: 'Sacos',
  bale: 'Fardos',
  liter: 'Litros',
  unit: 'Unidades',
  box: 'Caixas',
}

function getUnitLabel(
  unit: InventoryUnit,
  quantity: number,
) {
  if (quantity === 1) {
    return INVENTORY_UNIT_LABELS[
      unit
    ]
  }

  return PLURAL_UNIT_LABELS[
    unit
  ]
}

function getInventoryStatus(
  summary: InventoryOperationalSummary,
) {
  if (
    summary.currentStock <= 0
  ) {
    return {
      label: 'Sem estoque',
      className:
        'inventory-card__status--critical',
    }
  }

  if (
    summary.autonomyDays !== null &&
    summary.autonomyDays <= 3
  ) {
    return {
      label: 'Crítico',
      className:
        'inventory-card__status--critical',
    }
  }

  if (
    summary.needsReplenishment
  ) {
    return {
      label: 'Repor em breve',
      className:
        'inventory-card__status--warning',
    }
  }

  return {
    label: 'Normal',
    className:
      'inventory-card__status--ok',
  }
}

export function InventoryPage() {
  const [
    items,
    setItems,
  ] = useState<
    InventoryOperationalSummary[]
  >([])

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

  const replenishmentItems =
    useMemo(
      () =>
        activeItems.filter(
          (summary) =>
            summary.needsReplenishment,
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
      <header className="inventory-page-header">
        <div>
          <p className="page-header__eyebrow">
            Controle operacional
          </p>

          <h1 className="page-header__title">
            Estoque
          </h1>

          <p className="page-header__description">
            Veja o que está disponível e antecipe reposições sem precisar
            fazer contas manualmente.
          </p>
        </div>

        <div className="inventory-page-header__actions">
          <Link
            className="inventory-page-header__secondary"
            to="/estoque/produtos"
          >
            <PackageSearch size={17} />
            Produtos
          </Link>

          <Link
            className="inventory-page-header__primary"
            to="/estoque/compra"
          >
            <ArrowDown size={17} />
            Registrar compra
          </Link>
        </div>
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
              Reposição em breve
            </span>

            <strong>
              {loading
                ? '...'
                : replenishmentItems.length}
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
            placeholder="Buscar no estoque..."
            aria-label="Buscar item do estoque"
          />
        </div>
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
              Nenhum produto no estoque
            </strong>

            <span>
              Cadastre um produto e depois registre a primeira compra.
            </span>

            <Link
              to="/estoque/produtos/novo"
            >
              Cadastrar produto
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        activeItems.length > 0 &&
        filteredItems.length === 0 && (
          <div className="inventory-state">
            Nenhum produto encontrado para “{search}”.
          </div>
        )}

      {!loading &&
        !error &&
        filteredItems.length > 0 && (
          <div className="inventory-grid">
            {filteredItems.map(
              (summary) => {
                const {
                  item,
                  currentStock,
                  dailyConsumption,
                  autonomyDays,
                  needsReplenishment,
                } = summary

                const status =
                  getInventoryStatus(
                    summary,
                  )

                const hasConsumptionForecast =
                  dailyConsumption > 0 &&
                  autonomyDays !== null

                return (
                  <article
                    className={`inventory-card ${
                      needsReplenishment
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
                        className={`inventory-card__status ${status.className}`}
                      >
                        {status.label}
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

                    {hasConsumptionForecast && (
                      <div
                        className={`inventory-card__forecast ${
                          autonomyDays <=
                          INVENTORY_REPLENISHMENT_DAYS
                            ? 'inventory-card__forecast--warning'
                            : ''
                        }`}
                      >
                        <Gauge
                          size={16}
                          strokeWidth={1.8}
                        />

                        <div>
                          <span>
                            Consumo planejado
                          </span>

                          <strong>
                            {formatQuantity(
                              dailyConsumption,
                            )}{' '}
                            {
                              INVENTORY_UNIT_LABELS[
                                item.unit
                              ]
                            }
                            /dia
                            {' · '}
                            aproximadamente{' '}
                            {formatAutonomy(
                              autonomyDays,
                            )}{' '}
                            dias de autonomia
                          </strong>
                        </div>
                      </div>
                    )}

                    {item.purchaseUnit &&
                      item.packageSize && (
                        <div className="inventory-card__package">
                          <Boxes
                            size={15}
                            strokeWidth={1.8}
                          />

                          <span>
                            Compra em{' '}
                            {getUnitLabel(
                              item.purchaseUnit,
                              2,
                            )}
                            {' · '}
                            {formatQuantity(
                              item.packageSize,
                            )}{' '}
                            {
                              INVENTORY_UNIT_LABELS[
                                item.unit
                              ]
                            }{' '}
                            por{' '}
                            {
                              INVENTORY_UNIT_LABELS[
                                item.purchaseUnit
                              ]
                            }
                          </span>
                        </div>
                      )}

                    {needsReplenishment && (
                      <div className="inventory-card__alert">
                        <AlertTriangle
                          size={15}
                          strokeWidth={1.8}
                        />

                        <span>
                          {hasConsumptionForecast &&
                          autonomyDays <=
                            INVENTORY_REPLENISHMENT_DAYS
                            ? `Planeje a reposição. O estoque atual cobre aproximadamente ${formatAutonomy(
                                autonomyDays,
                              )} dias.`
                            : 'Reposição recomendada.'}
                        </span>
                      </div>
                    )}

                    <div className="inventory-card__actions">
                      <Link
                        className="inventory-card__movement inventory-card__movement--entry"
                        to={`/estoque/compra?product=${item.id}`}
                      >
                        <ArrowDown size={15} />
                        Registrar compra
                      </Link>

                      <Link
                        className="inventory-card__movement inventory-card__movement--exit"
                        to={`/estoque/${item.id}/movimentar?type=exit`}
                      >
                        <ArrowUp size={15} />
                        Saída manual
                      </Link>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
    </section>
  )
}