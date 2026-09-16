import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowDown,
  ArrowLeft,
  Boxes,
  Check,
  PackagePlus,
  Search,
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
  calculatePurchaseStockQuantity,
  calculatePurchaseTotal,
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_UNIT_LABELS,
  type InventoryItem,
  type InventoryUnit,
} from '../../domain/inventory.ts'

import {
  createInventoryMovement,
  getActiveInventoryItems,
  getInventoryCurrentStock,
} from './inventoryService.ts'

import './InventoryPurchasePage.css'

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
      maximumFractionDigits: 3,
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
  unit: InventoryUnit,
  quantity: number,
) {
  if (
    quantity === 1
  ) {
    return INVENTORY_UNIT_LABELS[
      unit
    ]
  }

  return PLURAL_UNIT_LABELS[
    unit
  ]
}

function getCurrentDateTimeLocal() {
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

  const hours =
    String(
      now.getHours(),
    ).padStart(
      2,
      '0',
    )

  const minutes =
    String(
      now.getMinutes(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function InventoryPurchasePage() {
  const navigate =
    useNavigate()

  const [
    searchParams,
  ] = useSearchParams()

  const productFromUrl =
    searchParams.get(
      'product',
    )

  const [
    products,
    setProducts,
  ] = useState<
    InventoryItem[]
  >([])

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState(
    productFromUrl ??
    '',
  )

  const [
    search,
    setSearch,
  ] = useState('')

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
    currentStock,
    setCurrentStock,
  ] = useState(0)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    loadingStock,
    setLoadingStock,
  ] = useState(false)

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

    async function loadProducts() {
      try {
        const data =
          await getActiveInventoryItems()

        if (
          !isMounted
        ) {
          return
        }

        setProducts(
          data,
        )

        const productExists =
          productFromUrl &&
          data.some(
            (product) =>
              product.id ===
              productFromUrl,
          )

        if (
          productExists
        ) {
          setSelectedProductId(
            productFromUrl,
          )

          return
        }

        if (
          data.length === 1
        ) {
          setSelectedProductId(
            data[0].id,
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
            : 'Não foi possível carregar os produtos.'

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

    loadProducts()

    return () => {
      isMounted =
        false
    }
  }, [
    productFromUrl,
  ])

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            selectedProductId,
        ) ??
        null,
      [
        products,
        selectedProductId,
      ],
    )

  useEffect(() => {
    let isMounted =
      true

    async function loadCurrentStock() {
      if (
        !selectedProduct
      ) {
        setCurrentStock(
          0,
        )

        return
      }

      setLoadingStock(
        true,
      )

      try {
        const stock =
          await getInventoryCurrentStock(
            selectedProduct.id,
          )

        if (
          isMounted
        ) {
          setCurrentStock(
            stock,
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
            : 'Não foi possível consultar o saldo do produto.'

        setError(
          message,
        )
      } finally {
        if (
          isMounted
        ) {
          setLoadingStock(
            false,
          )
        }
      }
    }

    loadCurrentStock()

    return () => {
      isMounted =
        false
    }
  }, [
    selectedProduct,
  ])

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(
          search,
        )

      if (
        !normalizedSearch
      ) {
        return products
      }

      return products.filter(
        (product) => {
          const category =
            INVENTORY_CATEGORY_LABELS[
              product.category
            ]

          return [
            product.name,
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
      products,
      search,
    ])

  const purchaseUnit =
    selectedProduct?.purchaseUnit ??
    selectedProduct?.unit ??
    'unit'

  const packageSize =
    selectedProduct?.packageSize ??
    1

  const parsedQuantity =
    useMemo(
      () =>
        parseQuantity(
          quantity,
        ),
      [
        quantity,
      ],
    )

  const stockQuantity =
    useMemo(
      () =>
        calculatePurchaseStockQuantity(
          parsedQuantity,
          packageSize,
        ),
      [
        parsedQuantity,
        packageSize,
      ],
    )

  const totalCost =
    useMemo(
      () =>
        calculatePurchaseTotal(
          parsedQuantity,
          unitCost,
        ),
      [
        parsedQuantity,
        unitCost,
      ],
    )

  const projectedStock =
    currentStock +
    stockQuantity

  function handleSelectProduct(
    productId: string,
  ) {
    setSelectedProductId(
      productId,
    )

    setQuantity('')
    setUnitCost(0)
    setError(null)
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(
      null,
    )

    if (
      !selectedProduct
    ) {
      setError(
        'Selecione o produto da compra.',
      )

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
      unitCost <= 0
    ) {
      setError(
        `Informe o valor pago por ${
          INVENTORY_UNIT_LABELS[
            purchaseUnit
          ]
        }.`,
      )

      return
    }

    if (
      totalCost <= 0
    ) {
      setError(
        'O valor total da compra precisa ser maior que zero.',
      )

      return
    }

    if (
      !movementAt
    ) {
      setError(
        'Informe a data e o horário da compra.',
      )

      return
    }

    const movementDate =
      new Date(
        movementAt,
      )

    if (
      Number.isNaN(
        movementDate.getTime(),
      )
    ) {
      setError(
        'Informe uma data e um horário válidos.',
      )

      return
    }

    setSaving(
      true,
    )

    try {
      await createInventoryMovement({
        itemId:
          selectedProduct.id,

        movementType:
          'entry',

        quantity:
          stockQuantity,

        unitCost,

        notes:
          notes.trim() ||
          null,

        movementAt:
          movementDate.toISOString(),

        sourceType:
          'purchase',

        horseId:
          null,

        purchaseQuantity:
          parsedQuantity,

        purchaseUnit,

        packageSize,

        totalCost,
      })

      navigate(
        '/estoque',
      )
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

  return (
    <section className="inventory-purchase-page">
      <header className="inventory-purchase-header">
        <Link
          className="inventory-purchase-header__back"
          to="/estoque"
        >
          <ArrowLeft
            size={17}
          />

          Voltar ao estoque
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Estoque
          </p>

          <h1 className="page-header__title">
            Registrar compra
          </h1>

          <p className="page-header__description">
            Escolha o produto, informe a compra uma única vez e deixe o sistema
            atualizar o estoque e registrar a despesa no financeiro
            automaticamente.
          </p>
        </div>
      </header>

      <form
        className="inventory-purchase-form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="inventory-purchase-section">
          <div className="inventory-purchase-section__heading">
            <div className="inventory-purchase-section__icon">
              <Boxes
                size={19}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2>
                Produto
              </h2>

              <p>
                Selecione um produto já cadastrado.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="inventory-purchase-state">
              Carregando produtos...
            </div>
          ) : products.length ===
            0 ? (
            <div className="inventory-purchase-empty">
              <strong>
                Nenhum produto cadastrado
              </strong>

              <span>
                Cadastre um produto antes de registrar uma compra.
              </span>

              <Link
                to="/estoque/produtos/novo"
              >
                <PackagePlus
                  size={16}
                />

                Cadastrar produto
              </Link>
            </div>
          ) : (
            <>
              <div className="inventory-purchase-search">
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
                  placeholder="Buscar produto..."
                  aria-label="Buscar produto"
                />
              </div>

              <div className="inventory-purchase-products">
                {filteredProducts.map(
                  (
                    product,
                  ) => {
                    const isSelected =
                      product.id ===
                      selectedProductId

                    return (
                      <button
                        type="button"
                        className={`inventory-purchase-product ${
                          isSelected
                            ? 'inventory-purchase-product--selected'
                            : ''
                        }`}
                        key={
                          product.id
                        }
                        onClick={() =>
                          handleSelectProduct(
                            product.id,
                          )
                        }
                      >
                        <div>
                          <span>
                            {
                              INVENTORY_CATEGORY_LABELS[
                                product.category
                              ]
                            }
                          </span>

                          <strong>
                            {
                              product.name
                            }
                          </strong>
                        </div>

                        <div className="inventory-purchase-product__purchase">
                          {product.purchaseUnit &&
                          product.packageSize ? (
                            <>
                              {
                                INVENTORY_UNIT_LABELS[
                                  product.purchaseUnit
                                ]
                              }
                              {' · '}
                              {formatQuantity(
                                product.packageSize,
                              )}{' '}
                              {
                                INVENTORY_UNIT_LABELS[
                                  product.unit
                                ]
                              }
                            </>
                          ) : (
                            <>
                              Compra em{' '}
                              {
                                INVENTORY_UNIT_LABELS[
                                  product.unit
                                ]
                              }
                            </>
                          )}
                        </div>

                        <div className="inventory-purchase-product__check">
                          {isSelected && (
                            <Check
                              size={16}
                            />
                          )}
                        </div>
                      </button>
                    )
                  },
                )}
              </div>
            </>
          )}
        </div>

        {selectedProduct && (
          <div className="inventory-purchase-section">
            <div className="inventory-purchase-section__heading">
              <div className="inventory-purchase-section__icon">
                <ArrowDown
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2>
                  Dados da compra
                </h2>

                <p>
                  Informe apenas os dados que vieram na compra.
                </p>
              </div>
            </div>

            <div className="inventory-purchase-grid">
              <div className="inventory-purchase-field">
                <label htmlFor="quantity">
                  Quantidade comprada
                </label>

                <div className="inventory-purchase-field__suffix">
                  <input
                    id="quantity"
                    type="text"
                    inputMode="decimal"
                    value={
                      quantity
                    }
                    onChange={(
                      event,
                    ) =>
                      setQuantity(
                        event.target.value,
                      )
                    }
                    placeholder="Ex: 10"
                    autoComplete="off"
                  />

                  <span>
                    {getUnitLabel(
                      purchaseUnit,
                      parsedQuantity,
                    )}
                  </span>
                </div>

                {selectedProduct.packageSize &&
                  selectedProduct.purchaseUnit && (
                    <small>
                      Cada{' '}
                      {
                        INVENTORY_UNIT_LABELS[
                          selectedProduct.purchaseUnit
                        ]
                      }{' '}
                      possui{' '}
                      {formatQuantity(
                        selectedProduct.packageSize,
                      )}{' '}
                      {
                        INVENTORY_UNIT_LABELS[
                          selectedProduct.unit
                        ]
                      }.
                    </small>
                  )}
              </div>

              <div className="inventory-purchase-field">
                <label htmlFor="unitCost">
                  Valor por{' '}
                  {
                    INVENTORY_UNIT_LABELS[
                      purchaseUnit
                    ]
                  }
                </label>

                <MoneyInput
                  id="unitCost"
                  value={
                    unitCost
                  }
                  onChange={
                    setUnitCost
                  }
                />

                <small>
                  Esse valor também será utilizado para registrar a despesa no
                  Financeiro.
                </small>
              </div>

              <div className="inventory-purchase-field">
                <label htmlFor="movementAt">
                  Data e horário
                </label>

                <input
                  id="movementAt"
                  type="datetime-local"
                  value={
                    movementAt
                  }
                  onChange={(
                    event,
                  ) =>
                    setMovementAt(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="inventory-purchase-field inventory-purchase-field--full">
                <label htmlFor="notes">
                  Observação
                </label>

                <textarea
                  id="notes"
                  value={
                    notes
                  }
                  onChange={(
                    event,
                  ) =>
                    setNotes(
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Opcional. Ex: Compra realizada no fornecedor habitual."
                />
              </div>
            </div>

            <div className="inventory-purchase-preview">
              <div>
                <span>
                  Estoque atual
                </span>

                <strong>
                  {loadingStock
                    ? '...'
                    : `${formatQuantity(
                        currentStock,
                      )} ${getUnitLabel(
                        selectedProduct.unit,
                        currentStock,
                      )}`}
                </strong>
              </div>

              <div>
                <span>
                  Entrada
                </span>

                <strong className="inventory-purchase-preview__positive">
                  +
                  {formatQuantity(
                    stockQuantity,
                  )}{' '}
                  {getUnitLabel(
                    selectedProduct.unit,
                    stockQuantity,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Novo saldo
                </span>

                <strong>
                  {formatQuantity(
                    projectedStock,
                  )}{' '}
                  {getUnitLabel(
                    selectedProduct.unit,
                    projectedStock,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Total da compra
                </span>

                <strong>
                  {formatCurrency(
                    totalCost,
                  )}
                </strong>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="inventory-purchase-error">
            {error}
          </div>
        )}

        <div className="inventory-purchase-actions">
          <Link
            to="/estoque"
            className="inventory-purchase-actions__cancel"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="inventory-purchase-actions__submit"
            disabled={
              saving ||
              !selectedProduct
            }
          >
            <ArrowDown
              size={16}
            />

            {saving
              ? 'Registrando...'
              : 'Registrar compra'}
          </button>
        </div>
      </form>
    </section>
  )
}