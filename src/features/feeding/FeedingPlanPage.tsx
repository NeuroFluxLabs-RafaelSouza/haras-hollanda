import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react'

import {
  ArrowLeft,
  Clock,
  Plus,
  Save,
  Trash2,
  Utensils,
} from 'lucide-react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import type {
  Horse,
} from '../../domain/horse.ts'

import {
  INVENTORY_UNIT_LABELS,
  type InventoryItem,
} from '../../domain/inventory.ts'

import type {
  FeedingPlan,
} from '../../domain/feeding.ts'

import {
  getHorseById,
} from '../horses/horsesService.ts'

import {
  getActiveInventoryItems,
} from '../inventory/inventoryService.ts'

import {
  createFeedingPlan,
  createFeedingPlanMeal,
  deleteFeedingPlanMeal,
  getActiveFeedingPlanWithMealsByHorseId,
  updateFeedingPlan,
  updateFeedingPlanMeal,
} from './feedingService.ts'

import './FeedingPlanPage.css'

const MEAL_PERIODS = [
  'Manhã',
  'Tarde',
  'Noite',
] as const

type MealPeriod =
  (typeof MEAL_PERIODS)[number]

type MealDraft = {
  localId: string
  id: string | null
  name: MealPeriod
  scheduledTime: string
  quantity: string
  active: boolean
}

function createLocalId() {
  return `${Date.now()}-${Math.random()}`
}

function createDefaultMeals(): MealDraft[] {
  return [
    {
      localId:
        createLocalId(),

      id:
        null,

      name:
        'Manhã',

      scheduledTime:
        '07:00',

      quantity:
        '',

      active:
        true,
    },

    {
      localId:
        createLocalId(),

      id:
        null,

      name:
        'Tarde',

      scheduledTime:
        '17:00',

      quantity:
        '',

      active:
        true,
    },
  ]
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
      maximumFractionDigits: 3,
    },
  ).format(value)
}

function normalizeMealPeriod(
  name: string,
  scheduledTime: string,
): MealPeriod {
  if (
    name === 'Manhã' ||
    name === 'Tarde' ||
    name === 'Noite'
  ) {
    return name
  }

  const hour =
    Number(
      scheduledTime.slice(
        0,
        2,
      ),
    )

  if (
    Number.isNaN(hour)
  ) {
    return 'Manhã'
  }

  if (hour < 12) {
    return 'Manhã'
  }

  if (hour < 18) {
    return 'Tarde'
  }

  return 'Noite'
}

function getDefaultTimeForMeal(
  mealPeriod: MealPeriod,
) {
  if (
    mealPeriod === 'Manhã'
  ) {
    return '07:00'
  }

  if (
    mealPeriod === 'Tarde'
  ) {
    return '17:00'
  }

  return '20:00'
}

function getNextAvailableMealPeriod(
  meals: MealDraft[],
): MealPeriod | null {
  return (
    MEAL_PERIODS.find(
      (period) =>
        !meals.some(
          (meal) =>
            meal.name === period,
        ),
    ) ?? null
  )
}

export function FeedingPlanPage() {
  const {
    horseId,
  } = useParams()

  const navigate =
    useNavigate()

  const [
    horse,
    setHorse,
  ] = useState<Horse | null>(
    null,
  )

  const [
    products,
    setProducts,
  ] = useState<InventoryItem[]>(
    [],
  )

  const [
    existingPlan,
    setExistingPlan,
  ] = useState<FeedingPlan | null>(
    null,
  )

  const [
    productId,
    setProductId,
  ] = useState('')

  const [
    notes,
    setNotes,
  ] = useState('')

  const [
    meals,
    setMeals,
  ] = useState<MealDraft[]>(
    createDefaultMeals(),
  )

  const [
    removedMealIds,
    setRemovedMealIds,
  ] = useState<string[]>(
    [],
  )

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
    let isMounted = true

    async function loadPage() {
      if (!horseId) {
        setError(
          'Cavalo não identificado.',
        )

        setLoading(false)

        return
      }

      try {
        const [
          horseData,
          inventoryProducts,
          feedingData,
        ] = await Promise.all([
          getHorseById(
            horseId,
          ),

          getActiveInventoryItems(),

          getActiveFeedingPlanWithMealsByHorseId(
            horseId,
          ),
        ])

        if (!isMounted) {
          return
        }

        const feedingProducts =
          inventoryProducts.filter(
            (product) =>
              product.category ===
                'feed' &&
              product.unit ===
                'kg',
          )

        setHorse(
          horseData,
        )

        setProducts(
          feedingProducts,
        )

        if (feedingData) {
          setExistingPlan(
            feedingData.plan,
          )

          setProductId(
            feedingData.plan
              .inventoryItemId,
          )

          setNotes(
            feedingData.plan.notes ??
              '',
          )

          setMeals(
            feedingData.meals.map(
              (meal) => {
                const scheduledTime =
                  meal.scheduledTime.slice(
                    0,
                    5,
                  )

                return {
                  localId:
                    meal.id,

                  id:
                    meal.id,

                  name:
                    normalizeMealPeriod(
                      meal.name,
                      scheduledTime,
                    ),

                  scheduledTime,

                  quantity:
                    String(
                      meal.quantity,
                    ),

                  active:
                    meal.active,
                }
              },
            ),
          )

          return
        }

        if (
          feedingProducts.length ===
          1
        ) {
          setProductId(
            feedingProducts[0].id,
          )
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o plano alimentar.'

        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPage()

    return () => {
      isMounted = false
    }
  }, [horseId])

  const selectedProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product.id ===
            productId,
        ) ?? null,
      [
        products,
        productId,
      ],
    )

  const dailyQuantity =
    useMemo(
      () =>
        meals
          .filter(
            (meal) =>
              meal.active,
          )
          .reduce(
            (
              total,
              meal,
            ) =>
              total +
              parseQuantity(
                meal.quantity,
              ),
            0,
          ),
      [meals],
    )

  const nextAvailableMeal =
    useMemo(
      () =>
        getNextAvailableMealPeriod(
          meals,
        ),
      [meals],
    )

  function updateMealPeriod(
    localId: string,
    mealPeriod: MealPeriod,
  ) {
    setMeals(
      (currentMeals) =>
        currentMeals.map(
          (meal) =>
            meal.localId ===
            localId
              ? {
                  ...meal,

                  name:
                    mealPeriod,

                  scheduledTime:
                    getDefaultTimeForMeal(
                      mealPeriod,
                    ),
                }
              : meal,
        ),
    )
  }

  function updateMealField(
    localId: string,
    field:
      | 'scheduledTime'
      | 'quantity',
    value: string,
  ) {
    setMeals(
      (currentMeals) =>
        currentMeals.map(
          (meal) =>
            meal.localId ===
            localId
              ? {
                  ...meal,
                  [field]:
                    value,
                }
              : meal,
        ),
    )
  }

  function addMeal() {
    const mealPeriod =
      getNextAvailableMealPeriod(
        meals,
      )

    if (!mealPeriod) {
      return
    }

    setMeals(
      (currentMeals) => [
        ...currentMeals,

        {
          localId:
            createLocalId(),

          id:
            null,

          name:
            mealPeriod,

          scheduledTime:
            getDefaultTimeForMeal(
              mealPeriod,
            ),

          quantity:
            '',

          active:
            true,
        },
      ],
    )
  }

  function removeMeal(
    meal: MealDraft,
  ) {
    if (meal.id) {
      setRemovedMealIds(
        (currentIds) => [
          ...currentIds,
          meal.id as string,
        ],
      )
    }

    setMeals(
      (currentMeals) =>
        currentMeals.filter(
          (currentMeal) =>
            currentMeal.localId !==
            meal.localId,
        ),
    )
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)

    if (
      !horseId ||
      !horse
    ) {
      return
    }

    if (!productId) {
      setError(
        'Selecione a ração utilizada pelo cavalo.',
      )

      return
    }

    if (
      meals.length === 0
    ) {
      setError(
        'Cadastre pelo menos uma refeição.',
      )

      return
    }

    const uniqueMealNames =
      new Set(
        meals.map(
          (meal) =>
            meal.name,
        ),
      )

    if (
      uniqueMealNames.size !==
      meals.length
    ) {
      setError(
        'Não é possível cadastrar duas refeições no mesmo período.',
      )

      return
    }

    const invalidMeal =
      meals.find(
        (meal) =>
          !meal.scheduledTime ||
          parseQuantity(
            meal.quantity,
          ) <= 0,
      )

    if (invalidMeal) {
      setError(
        'Preencha corretamente o horário e a quantidade de todas as refeições.',
      )

      return
    }

    setSaving(true)

    try {
      let plan =
        existingPlan

      if (plan) {
        plan =
          await updateFeedingPlan(
            plan.id,
            {
              inventoryItemId:
                productId,

              notes:
                notes.trim() ||
                null,

              active:
                true,
            },
          )
      } else {
        plan =
          await createFeedingPlan({
            horseId,

            inventoryItemId:
              productId,

            notes:
              notes.trim() ||
              null,
          })
      }

      for (
        const mealId
        of removedMealIds
      ) {
        await deleteFeedingPlanMeal(
          mealId,
        )
      }

      for (
        const meal
        of meals
      ) {
        const quantity =
          parseQuantity(
            meal.quantity,
          )

        if (meal.id) {
          await updateFeedingPlanMeal(
            meal.id,
            {
              name:
                meal.name,

              scheduledTime:
                meal.scheduledTime,

              quantity,

              active:
                meal.active,
            },
          )

          continue
        }

        await createFeedingPlanMeal({
          feedingPlanId:
            plan.id,

          name:
            meal.name,

          scheduledTime:
            meal.scheduledTime,

          quantity,
        })
      }

      navigate('/cavalos')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o plano alimentar.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="feeding-plan-state">
        Carregando plano alimentar...
      </div>
    )
  }

  if (!horse) {
    return (
      <div className="feeding-plan-state feeding-plan-state--error">
        {error ??
          'Cavalo não encontrado.'}
      </div>
    )
  }

  return (
    <section className="feeding-plan-page">
      <header className="feeding-plan-header">
        <Link
          className="feeding-plan-header__back"
          to="/cavalos"
        >
          <ArrowLeft size={17} />
          Voltar aos cavalos
        </Link>

        <div>
          <p className="page-header__eyebrow">
            Alimentação
          </p>

          <h1 className="page-header__title">
            Plano alimentar —{' '}
            {horse.name}
          </h1>

          <p className="page-header__description">
            Defina uma vez o que o cavalo recebe diariamente. A rotina de
            alimentação usará estas informações automaticamente.
          </p>
        </div>
      </header>

      <form
        className="feeding-plan-form"
        onSubmit={handleSubmit}
      >
        <div className="feeding-plan-section">
          <div className="feeding-plan-section__heading">
            <div className="feeding-plan-section__icon">
              <Utensils
                size={19}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h2>
                Ração
              </h2>

              <p>
                Selecione um produto já cadastrado no estoque.
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="feeding-plan-empty">
              <strong>
                Nenhuma ração disponível
              </strong>

              <span>
                Cadastre uma ração em Produtos antes de montar o plano.
              </span>

              <Link
                to="/estoque/produtos/novo"
              >
                Cadastrar produto
              </Link>
            </div>
          ) : (
            <div className="feeding-plan-field">
              <label htmlFor="feedingProduct">
                Produto
              </label>

              <select
                id="feedingProduct"
                value={productId}
                onChange={(event) =>
                  setProductId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Selecione a ração
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ),
                )}
              </select>

              {selectedProduct && (
                <small>
                  Controle de estoque em{' '}
                  {
                    INVENTORY_UNIT_LABELS[
                      selectedProduct.unit
                    ]
                  }.
                </small>
              )}
            </div>
          )}
        </div>

        <div className="feeding-plan-section">
          <div className="feeding-plan-section__heading feeding-plan-section__heading--actions">
            <div className="feeding-plan-section__heading-main">
              <div className="feeding-plan-section__icon">
                <Clock
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2>
                  Refeições
                </h2>

                <p>
                  Escolha o período, horário e a quantidade servida.
                </p>
              </div>
            </div>

            <button
              className="feeding-plan-add-meal"
              type="button"
              onClick={addMeal}
              disabled={
                nextAvailableMeal ===
                null
              }
            >
              <Plus size={15} />

              {nextAvailableMeal
                ? 'Adicionar refeição'
                : '3 refeições definidas'}
            </button>
          </div>

          <div className="feeding-plan-meals">
            {meals.map(
              (
                meal,
                index,
              ) => (
                <div
                  className="feeding-plan-meal"
                  key={meal.localId}
                >
                  <div className="feeding-plan-meal__number">
                    {index + 1}
                  </div>

                  <div className="feeding-plan-field">
                    <label>
                      Período
                    </label>

                    <select
                      value={meal.name}
                      onChange={(event) =>
                        updateMealPeriod(
                          meal.localId,
                          event.target
                            .value as MealPeriod,
                        )
                      }
                    >
                      {MEAL_PERIODS.map(
                        (period) => {
                          const usedByAnotherMeal =
                            meals.some(
                              (
                                currentMeal,
                              ) =>
                                currentMeal.localId !==
                                  meal.localId &&
                                currentMeal.name ===
                                  period,
                            )

                          return (
                            <option
                              key={period}
                              value={period}
                              disabled={
                                usedByAnotherMeal
                              }
                            >
                              {period}
                            </option>
                          )
                        },
                      )}
                    </select>
                  </div>

                  <div className="feeding-plan-field">
                    <label>
                      Horário
                    </label>

                    <input
                      type="time"
                      value={
                        meal.scheduledTime
                      }
                      onChange={(event) =>
                        updateMealField(
                          meal.localId,
                          'scheduledTime',
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="feeding-plan-field">
                    <label>
                      Quantidade
                    </label>

                    <div className="feeding-plan-field__suffix">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={
                          meal.quantity
                        }
                        onChange={(event) =>
                          updateMealField(
                            meal.localId,
                            'quantity',
                            event.target.value,
                          )
                        }
                        placeholder="Ex: 2"
                      />

                      <span>
                        kg
                      </span>
                    </div>
                  </div>

                  <button
                    className="feeding-plan-meal__remove"
                    type="button"
                    aria-label={`Remover refeição ${meal.name}`}
                    onClick={() =>
                      removeMeal(
                        meal,
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="feeding-plan-section">
          <div className="feeding-plan-field">
            <label htmlFor="feedingNotes">
              Observação
            </label>

            <textarea
              id="feedingNotes"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Opcional. Ex: servir após o treino."
            />
          </div>

          <div className="feeding-plan-total">
            <span>
              Consumo diário planejado
            </span>

            <strong>
              {formatQuantity(
                dailyQuantity,
              )}{' '}
              kg/dia
            </strong>

            {selectedProduct && (
              <small>
                de {selectedProduct.name}
              </small>
            )}
          </div>
        </div>

        {error && (
          <div className="feeding-plan-error">
            {error}
          </div>
        )}

        <div className="feeding-plan-actions">
          <Link
            className="feeding-plan-actions__cancel"
            to="/cavalos"
          >
            Cancelar
          </Link>

          <button
            className="feeding-plan-actions__save"
            type="submit"
            disabled={
              saving ||
              products.length === 0
            }
          >
            <Save size={16} />

            {saving
              ? 'Salvando...'
              : existingPlan
                ? 'Salvar alterações'
                : 'Salvar plano alimentar'}
          </button>
        </div>
      </form>
    </section>
  )
}