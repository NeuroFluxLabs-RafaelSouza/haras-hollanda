import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeft,
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
  type InventoryItem,
  type InventoryUnit,
} from '../../domain/inventory.ts'

import {
  getInventoryItems,
} from './inventoryService.ts'

import './ProductsPage.css'

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

function getPurchaseDescription(
  item: InventoryItem,
) {
  if (
    !item.purchaseUnit ||
    !item.packageSize
  ) {
    return `Compra em ${
      INVENTORY_UNIT_LABELS[
        item.unit
      ]
    }`
  }

  return `${INVENTORY_UNIT_LABELS[
    item.purchaseUnit
  ]} de ${formatQuantity(
    item.packageSize,
  )} ${
    INVENTORY_UNIT_LABELS[
      item.unit
    ]
  }`
}

export function ProductsPage() {
  const [
    products,
    setProducts,
  ] = useState<InventoryItem[]>(
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

    async function loadProducts() {
      try {
        const data =
          await getInventoryItems()

        if (isMounted) {
          setProducts(data)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os produtos.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        normalizeText(search)

      if (!normalizedSearch) {
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

  const activeProducts =
    products.filter(
      (product) =>
        product.active,
    ).length

  return (
    <section className="products-page">
      <Link
        className="products-page__back"
        to="/estoque"
      >
        <ArrowLeft
          size={17}
          strokeWidth={1.8}
        />

        Voltar ao estoque
      </Link>

      <header className="products-header">
        <div>
          <p className="page-header__eyebrow">
            Estoque
          </p>

          <h1 className="page-header__title">
            Produtos
          </h1>

          <p className="page-header__description">
            Cadastre cada produto uma única vez e reutilize essas informações
            nas compras, no estoque e na alimentação dos cavalos.
          </p>
        </div>

        <Link
          className="products-header__add"
          to="/estoque/produtos/novo"
        >
          <Plus size={17} />
          Novo produto
        </Link>
      </header>

      <div className="products-summary">
        <div className="products-summary__icon">
          <Boxes
            size={19}
            strokeWidth={1.8}
          />
        </div>

        <div>
          <span>
            Produtos ativos
          </span>

          <strong>
            {loading
              ? '...'
              : activeProducts}
          </strong>
        </div>
      </div>

      <div className="products-toolbar">
        <div className="products-search">
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
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
          />
        </div>
      </div>

      {error && (
        <div className="products-state products-state--error">
          {error}
        </div>
      )}

      {loading && (
        <div className="products-state">
          Carregando produtos...
        </div>
      )}

      {!loading &&
        !error &&
        products.length === 0 && (
          <div className="products-empty">
            <Boxes
              size={28}
              strokeWidth={1.6}
            />

            <strong>
              Nenhum produto cadastrado
            </strong>

            <span>
              Cadastre o primeiro produto para começar a utilizá-lo no
              estoque.
            </span>

            <Link
              to="/estoque/produtos/novo"
            >
              <Plus size={16} />
              Cadastrar produto
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        products.length > 0 &&
        filteredProducts.length ===
          0 && (
          <div className="products-state">
            Nenhum produto encontrado para “{search}”.
          </div>
        )}

      {!loading &&
        !error &&
        filteredProducts.length >
          0 && (
          <div className="products-list">
            {filteredProducts.map(
              (product) => (
                <article
                  className="product-card"
                  key={product.id}
                >
                  <div className="product-card__main">
                    <div className="product-card__icon">
                      <Boxes
                        size={18}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="product-card__identity">
                      <span>
                        {
                          INVENTORY_CATEGORY_LABELS[
                            product.category
                          ]
                        }
                      </span>

                      <h2>
                        {product.name}
                      </h2>
                    </div>
                  </div>

                  <div className="product-card__details">
                    <div>
                      <span>
                        Controle
                      </span>

                      <strong>
                        {
                          INVENTORY_UNIT_LABELS[
                            product.unit
                          ]
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Compra
                      </span>

                      <strong>
                        {getPurchaseDescription(
                          product,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Estoque mínimo
                      </span>

                      <strong>
                        {formatQuantity(
                          product.minimumStock,
                        )}{' '}
                        {getUnitLabel(
                          product.unit,
                          product.minimumStock,
                        )}
                      </strong>
                    </div>
                  </div>

                  <span
                    className={`product-card__status ${
                      product.active
                        ? 'product-card__status--active'
                        : 'product-card__status--inactive'
                    }`}
                  >
                    {product.active
                      ? 'Ativo'
                      : 'Inativo'}
                  </span>
                </article>
              ),
            )}
          </div>
        )}
    </section>
  )
}