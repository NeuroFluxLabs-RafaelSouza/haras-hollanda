import {
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

import './NewInventoryItemPage.css'

export function NewInventoryItemPage() {
  const navigate = useNavigate()

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
    'bag',
  )

  const [
    minimumStock,
    setMinimumStock,
  ] = useState('0')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)

    const trimmedName =
      name.trim()

    if (!trimmedName) {
      setError(
        'Informe o nome do item.',
      )

      return
    }

    const parsedMinimumStock =
      Number(
        minimumStock.replace(
          ',',
          '.',
        ),
      )

    if (
      Number.isNaN(
        parsedMinimumStock,
      ) ||
      parsedMinimumStock < 0
    ) {
      setError(
        'Informe um estoque mínimo válido.',
      )

      return
    }

    setSaving(true)

    try {
      await createInventoryItem({
        name: trimmedName,
        category,
        unit,
        minimumStock:
          parsedMinimumStock,
      })

      navigate('/estoque')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar o item.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const categoryOptions =
    Object.entries(
      INVENTORY_CATEGORY_LABELS,
    ) as [
      InventoryCategory,
      string,
    ][]

  const unitOptions =
    Object.entries(
      INVENTORY_UNIT_LABELS,
    ) as [
      InventoryUnit,
      string,
    ][]

  return (
    <section className="new-inventory-item-page">
      <header className="new-inventory-item-header">
        <Link
          className="new-inventory-item-header__back"
          to="/estoque"
        >
          <ArrowLeft size={17} />
          Estoque
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Cadastro
          </p>

          <h1 className="page-header__title">
            Novo item
          </h1>

          <p className="page-header__description">
            Cadastre rações, feno, medicamentos e outros insumos utilizados
            no haras.
          </p>
        </div>
      </header>

      <form
        className="new-inventory-item-form"
        onSubmit={handleSubmit}
      >
        <div className="new-inventory-item-form__header">
          <div className="new-inventory-item-form__icon">
            <PackagePlus
              size={19}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2>
              Dados do item
            </h2>

            <p>
              Defina como este produto será controlado no estoque.
            </p>
          </div>
        </div>

        <div className="new-inventory-item-form__grid">
          <div className="new-inventory-item-field new-inventory-item-field--full">
            <label htmlFor="name">
              Nome do item
            </label>

            <input
              id="name"
              name="name"
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

          <div className="new-inventory-item-field">
            <label htmlFor="category">
              Categoria
            </label>

            <select
              id="category"
              name="category"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target
                    .value as InventoryCategory,
                )
              }
            >
              {categoryOptions.map(
                ([value, label]) => (
                  <option
                    value={value}
                    key={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="new-inventory-item-field">
            <label htmlFor="unit">
              Unidade de controle
            </label>

            <select
              id="unit"
              name="unit"
              value={unit}
              onChange={(event) =>
                setUnit(
                  event.target
                    .value as InventoryUnit,
                )
              }
            >
              {unitOptions.map(
                ([value, label]) => (
                  <option
                    value={value}
                    key={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="new-inventory-item-field new-inventory-item-field--full">
            <label htmlFor="minimumStock">
              Estoque mínimo
            </label>

            <input
              id="minimumStock"
              name="minimumStock"
              type="text"
              inputMode="decimal"
              value={minimumStock}
              onChange={(event) =>
                setMinimumStock(
                  event.target.value,
                )
              }
              placeholder="Ex: 5"
            />

            <span className="new-inventory-item-field__help">
              Quando o estoque atingir esse valor, o sistema sinalizará que
              uma reposição é recomendada.
            </span>
          </div>
        </div>

        {error && (
          <div className="new-inventory-item-form__error">
            {error}
          </div>
        )}

        <div className="new-inventory-item-form__actions">
          <Link
            className="new-inventory-item-cancel"
            to="/estoque"
          >
            Cancelar
          </Link>

          <button
            className="new-inventory-item-submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Cadastrando...'
              : 'Cadastrar item'}
          </button>
        </div>
      </form>
    </section>
  )
}