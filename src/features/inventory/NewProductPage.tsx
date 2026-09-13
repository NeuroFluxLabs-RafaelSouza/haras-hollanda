import {
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  PackagePlus,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_UNIT_LABELS,
  type InventoryCategory,
  type InventoryUnit,
} from '../../domain/inventory.ts'

import {
  createInventoryItem,
} from './inventoryService.ts'

import './NewProductPage.css'

const categories =
  Object.entries(
    INVENTORY_CATEGORY_LABELS,
  ) as [
    InventoryCategory,
    string,
  ][]

const units =
  Object.entries(
    INVENTORY_UNIT_LABELS,
  ) as [
    InventoryUnit,
    string,
  ][]

function parseDecimal(
  value: string,
) {
  const normalizedValue =
    value
      .trim()
      .replace(',', '.')

  const number =
    Number(normalizedValue)

  if (
    Number.isNaN(number)
  ) {
    return 0
  }

  return number
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

export function NewProductPage() {
  const navigate =
    useNavigate()

  const [
    name,
    setName,
  ] = useState('')

  const [
    category,
    setCategory,
  ] = useState<InventoryCategory>(
    'feed',
  )

  const [
    unit,
    setUnit,
  ] = useState<InventoryUnit>(
    'kg',
  )

  const [
    purchaseUnit,
    setPurchaseUnit,
  ] = useState<
    InventoryUnit | ''
  >('bag')

  const [
    packageSize,
    setPackageSize,
  ] = useState('40')

  const [
    minimumStock,
    setMinimumStock,
  ] = useState('3')

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

  const isFeed =
    category === 'feed'

  const packageSizeValue =
    useMemo(
      () =>
        parseDecimal(
          packageSize,
        ),
      [packageSize],
    )

  const minimumStockValue =
    useMemo(
      () =>
        parseDecimal(
          minimumStock,
        ),
      [minimumStock],
    )

  const convertedMinimumStock =
    useMemo(() => {
      if (
        isFeed &&
        packageSizeValue > 0
      ) {
        return (
          minimumStockValue *
          packageSizeValue
        )
      }

      return minimumStockValue
    }, [
      isFeed,
      minimumStockValue,
      packageSizeValue,
    ])

  function handleCategoryChange(
    value: InventoryCategory,
  ) {
    setCategory(value)

    if (
      value === 'feed'
    ) {
      setUnit('kg')
      setPurchaseUnit('bag')
      setPackageSize('40')
      setMinimumStock('3')

      return
    }

    setPurchaseUnit('')
    setPackageSize('')
    setMinimumStock('0')
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)

    const trimmedName =
      name.trim()

    if (!trimmedName) {
      setError(
        'Informe o nome do produto.',
      )

      return
    }

    if (
      minimumStockValue < 0
    ) {
      setError(
        'O estoque mínimo não pode ser negativo.',
      )

      return
    }

    if (
      purchaseUnit &&
      packageSizeValue <= 0
    ) {
      setError(
        'Informe a quantidade existente em cada embalagem.',
      )

      return
    }

    setSaving(true)

    try {
      await createInventoryItem({
        name:
          trimmedName,

        category,

        unit,

        minimumStock:
          convertedMinimumStock,

        purchaseUnit:
          purchaseUnit ||
          null,

        packageSize:
          purchaseUnit
            ? packageSizeValue
            : null,
      })

      navigate(
        '/estoque/produtos',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o produto.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="new-product-page">
      <header className="new-product-header">
        <Link
          className="new-product-header__back"
          to="/estoque/produtos"
        >
          <ArrowLeft size={17} />
          Produtos
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Estoque
          </p>

          <h1 className="page-header__title">
            Novo produto
          </h1>

          <p className="page-header__description">
            Cadastre o produto uma vez para utilizá-lo nas compras,
            movimentações e rotinas do haras.
          </p>
        </div>
      </header>

      <form
        className="new-product-form"
        onSubmit={handleSubmit}
      >
        <div className="new-product-form__heading">
          <div className="new-product-form__icon">
            <PackagePlus
              size={20}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2>
              Dados do produto
            </h2>

            <p>
              Defina como o produto é comprado e como o saldo será
              controlado.
            </p>
          </div>
        </div>

        <div className="new-product-form__content">
          <div className="new-product-field new-product-field--full">
            <label htmlFor="productName">
              Nome do produto
            </label>

            <input
              id="productName"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Ex: Ração Premium"
              autoComplete="off"
              required
            />
          </div>

          <div className="new-product-form__grid">
            <div className="new-product-field">
              <label htmlFor="category">
                Categoria
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  handleCategoryChange(
                    event.target
                      .value as InventoryCategory,
                  )
                }
              >
                {categories.map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="new-product-field">
              <label htmlFor="unit">
                Unidade de controle
              </label>

              {isFeed ? (
                <input
                  id="unit"
                  value="Kg"
                  disabled
                  readOnly
                />
              ) : (
                <select
                  id="unit"
                  value={unit}
                  onChange={(event) =>
                    setUnit(
                      event.target
                        .value as InventoryUnit,
                    )
                  }
                >
                  {units.map(
                    ([
                      value,
                      label,
                    ]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              )}

              {isFeed && (
                <span className="new-product-field__help">
                  Rações são controladas em kg para que o consumo dos cavalos
                  possa ser descontado com precisão.
                </span>
              )}
            </div>

            <div className="new-product-field">
              <label htmlFor="purchaseUnit">
                Unidade de compra
              </label>

              {isFeed ? (
                <input
                  id="purchaseUnit"
                  value="Saco"
                  disabled
                  readOnly
                />
              ) : (
                <select
                  id="purchaseUnit"
                  value={purchaseUnit}
                  onChange={(event) =>
                    setPurchaseUnit(
                      event.target
                        .value as
                        | InventoryUnit
                        | '',
                    )
                  }
                >
                  <option value="">
                    Mesma unidade do estoque
                  </option>

                  {units.map(
                    ([
                      value,
                      label,
                    ]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              )}
            </div>

            <div className="new-product-field">
              <label htmlFor="packageSize">
                {isFeed
                  ? 'Peso por saco'
                  : 'Quantidade por embalagem'}
              </label>

              <div className="new-product-field__with-suffix">
                <input
                  id="packageSize"
                  type="text"
                  inputMode="decimal"
                  value={packageSize}
                  onChange={(event) =>
                    setPackageSize(
                      event.target.value,
                    )
                  }
                  disabled={
                    !purchaseUnit
                  }
                  autoComplete="off"
                />

                <span>
                  {
                    INVENTORY_UNIT_LABELS[
                      unit
                    ]
                  }
                </span>
              </div>

              <span className="new-product-field__help">
                {purchaseUnit
                  ? `Cada ${
                      INVENTORY_UNIT_LABELS[
                        purchaseUnit
                      ]
                    } possui esta quantidade em ${
                      INVENTORY_UNIT_LABELS[
                        unit
                      ]
                    }.`
                  : 'Não há conversão de embalagem para este produto.'}
              </span>
            </div>

            <div className="new-product-field new-product-field--full">
              <label htmlFor="minimumStock">
                {isFeed
                  ? 'Estoque mínimo em sacos'
                  : `Estoque mínimo em ${
                      INVENTORY_UNIT_LABELS[
                        unit
                      ]
                    }`}
              </label>

              <input
                id="minimumStock"
                type="text"
                inputMode="decimal"
                value={minimumStock}
                onChange={(event) =>
                  setMinimumStock(
                    event.target.value,
                  )
                }
                autoComplete="off"
              />

              {isFeed && (
                <span className="new-product-field__help">
                  {formatQuantity(
                    minimumStockValue,
                  )}{' '}
                  {minimumStockValue ===
                  1
                    ? 'saco'
                    : 'sacos'}
                  {' = '}
                  <strong>
                    {formatQuantity(
                      convertedMinimumStock,
                    )}{' '}
                    kg
                  </strong>
                  {' '}de estoque mínimo.
                </span>
              )}
            </div>
          </div>

          {isFeed && (
            <div className="new-product-conversion">
              <div>
                <span>
                  Configuração
                </span>

                <strong>
                  1 saco ={' '}
                  {formatQuantity(
                    packageSizeValue,
                  )}{' '}
                  kg
                </strong>
              </div>

              <p>
                Nas compras o administrador informa a quantidade de sacos.
                O saldo do estoque permanece em kg para permitir as baixas da
                alimentação.
              </p>
            </div>
          )}

          {error && (
            <div className="new-product-form__error">
              {error}
            </div>
          )}
        </div>

        <div className="new-product-form__actions">
          <Link
            className="new-product-form__cancel"
            to="/estoque/produtos"
          >
            Cancelar
          </Link>

          <button
            className="new-product-form__submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Cadastrando...'
              : 'Cadastrar produto'}
          </button>
        </div>
      </form>
    </section>
  )
}