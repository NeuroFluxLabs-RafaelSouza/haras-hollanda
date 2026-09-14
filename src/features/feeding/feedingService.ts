import {
  type ConfirmFeedingBatchInput,
  type ConfirmFeedingBatchResult,
  type ConfirmFeedingInput,
  type ConfirmFeedingResult,
  type CreateFeedingPlanInput,
  type CreateFeedingPlanMealInput,
  type DailyFeedingRoutineItem,
  type FeedingConfirmation,
  type FeedingPlan,
  type FeedingPlanMeal,
  type FeedingPlanWithMeals,
  type UpdateFeedingPlanInput,
  type UpdateFeedingPlanMealInput,
} from '../../domain/feeding.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

type Relation<T> =
  | T
  | T[]
  | null

type FeedingPlanRow = {
  id: string
  horse_id: string
  inventory_item_id: string
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

type FeedingPlanMealRow = {
  id: string
  feeding_plan_id: string
  name: string
  scheduled_time: string
  quantity: number | string
  active: boolean
  created_at: string
}

type FeedingConfirmationRow = {
  id: string
  feeding_plan_id: string
  feeding_meal_id: string
  horse_id: string
  inventory_item_id: string
  inventory_movement_id: string
  feeding_date: string
  planned_quantity: number | string
  actual_quantity: number | string
  notes: string | null
  confirmed_at: string
  created_at: string
}

type ConfirmFeedingRow = {
  confirmation_id: string
  inventory_movement_id: string
  previous_stock: number | string
  new_stock: number | string
  planned_quantity: number | string
  actual_quantity: number | string
}

type ConfirmFeedingBatchRow = {
  requested_count: number | string
  confirmed_count: number | string
  skipped_count: number | string
  total_quantity: number | string
}

type DailyStallRelation = {
  id: string
  name: string
}

type DailyHorseRelation = {
  id: string
  name: string
  stall_id: string | null
  active: boolean
  stall: Relation<DailyStallRelation>
}

type DailyProductRelation = {
  id: string
  name: string
  active: boolean
}

type DailyPlanRelation = {
  id: string
  horse_id: string
  inventory_item_id: string
  active: boolean
  horse: Relation<DailyHorseRelation>
  product: Relation<DailyProductRelation>
}

type DailyFeedingMealRow = {
  id: string
  feeding_plan_id: string
  name: string
  scheduled_time: string
  quantity: number | string
  active: boolean
  plan: Relation<DailyPlanRelation>
}

const feedingPlanSelect = `
  id,
  horse_id,
  inventory_item_id,
  active,
  notes,
  created_at,
  updated_at
`

const feedingPlanMealSelect = `
  id,
  feeding_plan_id,
  name,
  scheduled_time,
  quantity,
  active,
  created_at
`

const feedingConfirmationSelect = `
  id,
  feeding_plan_id,
  feeding_meal_id,
  horse_id,
  inventory_item_id,
  inventory_movement_id,
  feeding_date,
  planned_quantity,
  actual_quantity,
  notes,
  confirmed_at,
  created_at
`

const dailyFeedingRoutineSelect = `
  id,
  feeding_plan_id,
  name,
  scheduled_time,
  quantity,
  active,
  plan:feeding_plans!inner (
    id,
    horse_id,
    inventory_item_id,
    active,
    horse:horses!inner (
      id,
      name,
      stall_id,
      active,
      stall:stalls (
        id,
        name
      )
    ),
    product:inventory_items!inner (
      id,
      name,
      active
    )
  )
`

function getSingleRelation<T>(
  relation: Relation<T>,
): T | null {
  if (!relation) {
    return null
  }

  if (Array.isArray(relation)) {
    return relation[0] ??
      null
  }

  return relation
}

function mapFeedingPlan(
  row: FeedingPlanRow,
): FeedingPlan {
  return {
    id:
      row.id,

    horseId:
      row.horse_id,

    inventoryItemId:
      row.inventory_item_id,

    active:
      row.active,

    notes:
      row.notes,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

function mapFeedingPlanMeal(
  row: FeedingPlanMealRow,
): FeedingPlanMeal {
  return {
    id:
      row.id,

    feedingPlanId:
      row.feeding_plan_id,

    name:
      row.name,

    scheduledTime:
      row.scheduled_time,

    quantity:
      Number(
        row.quantity,
      ),

    active:
      row.active,

    createdAt:
      row.created_at,
  }
}

function mapFeedingConfirmation(
  row: FeedingConfirmationRow,
): FeedingConfirmation {
  return {
    id:
      row.id,

    feedingPlanId:
      row.feeding_plan_id,

    feedingMealId:
      row.feeding_meal_id,

    horseId:
      row.horse_id,

    inventoryItemId:
      row.inventory_item_id,

    inventoryMovementId:
      row.inventory_movement_id,

    feedingDate:
      row.feeding_date,

    plannedQuantity:
      Number(
        row.planned_quantity,
      ),

    actualQuantity:
      Number(
        row.actual_quantity,
      ),

    notes:
      row.notes,

    confirmedAt:
      row.confirmed_at,

    createdAt:
      row.created_at,
  }
}

function mapConfirmFeedingResult(
  row: ConfirmFeedingRow,
): ConfirmFeedingResult {
  return {
    confirmationId:
      row.confirmation_id,

    inventoryMovementId:
      row.inventory_movement_id,

    previousStock:
      Number(
        row.previous_stock,
      ),

    newStock:
      Number(
        row.new_stock,
      ),

    plannedQuantity:
      Number(
        row.planned_quantity,
      ),

    actualQuantity:
      Number(
        row.actual_quantity,
      ),
  }
}

function mapConfirmFeedingBatchResult(
  row: ConfirmFeedingBatchRow,
): ConfirmFeedingBatchResult {
  return {
    requestedCount:
      Number(
        row.requested_count,
      ),

    confirmedCount:
      Number(
        row.confirmed_count,
      ),

    skippedCount:
      Number(
        row.skipped_count,
      ),

    totalQuantity:
      Number(
        row.total_quantity,
      ),
  }
}

export async function getActiveFeedingPlanByHorseId(
  horseId: string,
): Promise<FeedingPlan | null> {
  const {
    data,
    error,
  } = await supabase
    .from('feeding_plans')
    .select(
      feedingPlanSelect,
    )
    .eq(
      'horse_id',
      horseId,
    )
    .eq(
      'active',
      true,
    )
    .maybeSingle()

  if (error) {
    throw new Error(
      `Erro ao buscar plano alimentar: ${error.message}`,
    )
  }

  if (!data) {
    return null
  }

  return mapFeedingPlan(
    data as FeedingPlanRow,
  )
}

export async function getFeedingPlanById(
  feedingPlanId: string,
): Promise<FeedingPlan> {
  const {
    data,
    error,
  } = await supabase
    .from('feeding_plans')
    .select(
      feedingPlanSelect,
    )
    .eq(
      'id',
      feedingPlanId,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao buscar plano alimentar: ${error.message}`,
    )
  }

  return mapFeedingPlan(
    data as FeedingPlanRow,
  )
}

export async function getFeedingPlanMeals(
  feedingPlanId: string,
): Promise<FeedingPlanMeal[]> {
  const {
    data,
    error,
  } = await supabase
    .from('feeding_plan_meals')
    .select(
      feedingPlanMealSelect,
    )
    .eq(
      'feeding_plan_id',
      feedingPlanId,
    )
    .order(
      'scheduled_time',
      {
        ascending: true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar refeições do plano alimentar: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (meal) =>
      mapFeedingPlanMeal(
        meal as FeedingPlanMealRow,
      ),
  )
}

export async function getActiveFeedingPlanWithMealsByHorseId(
  horseId: string,
): Promise<FeedingPlanWithMeals | null> {
  const plan =
    await getActiveFeedingPlanByHorseId(
      horseId,
    )

  if (!plan) {
    return null
  }

  const meals =
    await getFeedingPlanMeals(
      plan.id,
    )

  return {
    plan,
    meals,
  }
}

export async function createFeedingPlan(
  input: CreateFeedingPlanInput,
): Promise<FeedingPlan> {
  const existingPlan =
    await getActiveFeedingPlanByHorseId(
      input.horseId,
    )

  if (existingPlan) {
    throw new Error(
      'Este cavalo já possui um plano alimentar ativo.',
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from('feeding_plans')
    .insert({
      horse_id:
        input.horseId,

      inventory_item_id:
        input.inventoryItemId,

      active:
        true,

      notes:
        input.notes ??
        null,
    })
    .select(
      feedingPlanSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao criar plano alimentar: ${error.message}`,
    )
  }

  return mapFeedingPlan(
    data as FeedingPlanRow,
  )
}

export async function updateFeedingPlan(
  feedingPlanId: string,
  input: UpdateFeedingPlanInput,
): Promise<FeedingPlan> {
  const {
    data,
    error,
  } = await supabase
    .from('feeding_plans')
    .update({
      inventory_item_id:
        input.inventoryItemId,

      notes:
        input.notes ??
        null,

      active:
        input.active,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      feedingPlanId,
    )
    .select(
      feedingPlanSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar plano alimentar: ${error.message}`,
    )
  }

  return mapFeedingPlan(
    data as FeedingPlanRow,
  )
}

export async function deactivateFeedingPlan(
  feedingPlanId: string,
): Promise<void> {
  const {
    error,
  } = await supabase
    .from('feeding_plans')
    .update({
      active:
        false,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      feedingPlanId,
    )

  if (error) {
    throw new Error(
      `Erro ao desativar plano alimentar: ${error.message}`,
    )
  }
}

export async function createFeedingPlanMeal(
  input: CreateFeedingPlanMealInput,
): Promise<FeedingPlanMeal> {
  if (
    input.quantity <=
    0
  ) {
    throw new Error(
      'A quantidade da refeição deve ser maior que zero.',
    )
  }

  const trimmedName =
    input.name.trim()

  if (!trimmedName) {
    throw new Error(
      'Informe o nome da refeição.',
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from('feeding_plan_meals')
    .insert({
      feeding_plan_id:
        input.feedingPlanId,

      name:
        trimmedName,

      scheduled_time:
        input.scheduledTime,

      quantity:
        input.quantity,

      active:
        true,
    })
    .select(
      feedingPlanMealSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao criar refeição: ${error.message}`,
    )
  }

  return mapFeedingPlanMeal(
    data as FeedingPlanMealRow,
  )
}

export async function updateFeedingPlanMeal(
  mealId: string,
  input: UpdateFeedingPlanMealInput,
): Promise<FeedingPlanMeal> {
  if (
    input.quantity <=
    0
  ) {
    throw new Error(
      'A quantidade da refeição deve ser maior que zero.',
    )
  }

  const trimmedName =
    input.name.trim()

  if (!trimmedName) {
    throw new Error(
      'Informe o nome da refeição.',
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from('feeding_plan_meals')
    .update({
      name:
        trimmedName,

      scheduled_time:
        input.scheduledTime,

      quantity:
        input.quantity,

      active:
        input.active,
    })
    .eq(
      'id',
      mealId,
    )
    .select(
      feedingPlanMealSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar refeição: ${error.message}`,
    )
  }

  return mapFeedingPlanMeal(
    data as FeedingPlanMealRow,
  )
}

export async function deleteFeedingPlanMeal(
  mealId: string,
): Promise<void> {
  const {
    error,
  } = await supabase
    .from('feeding_plan_meals')
    .delete()
    .eq(
      'id',
      mealId,
    )

  if (error) {
    throw new Error(
      `Erro ao excluir refeição: ${error.message}`,
    )
  }
}

export async function getFeedingConfirmationsByDate(
  feedingDate: string,
): Promise<FeedingConfirmation[]> {
  const {
    data,
    error,
  } = await supabase
    .from('feeding_confirmations')
    .select(
      feedingConfirmationSelect,
    )
    .eq(
      'feeding_date',
      feedingDate,
    )
    .order(
      'confirmed_at',
      {
        ascending: true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar confirmações de alimentação: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (confirmation) =>
      mapFeedingConfirmation(
        confirmation as FeedingConfirmationRow,
      ),
  )
}

export async function getDailyFeedingRoutine(
  feedingDate: string,
): Promise<DailyFeedingRoutineItem[]> {
  const [
    mealsResult,
    confirmations,
  ] = await Promise.all([
    supabase
      .from('feeding_plan_meals')
      .select(
        dailyFeedingRoutineSelect,
      )
      .eq(
        'active',
        true,
      ),

    getFeedingConfirmationsByDate(
      feedingDate,
    ),
  ])

  if (mealsResult.error) {
    throw new Error(
      `Erro ao carregar rotina de alimentação: ${mealsResult.error.message}`,
    )
  }

  const confirmationByMealId =
    new Map(
      confirmations.map(
        (confirmation) => [
          confirmation.feedingMealId,
          confirmation,
        ],
      ),
    )

  const routineItems =
    (
      mealsResult.data ??
      []
    )
      .map(
        (row) => {
          const meal =
            row as DailyFeedingMealRow

          const plan =
            getSingleRelation(
              meal.plan,
            )

          if (
            !plan ||
            !plan.active
          ) {
            return null
          }

          const horse =
            getSingleRelation(
              plan.horse,
            )

          const product =
            getSingleRelation(
              plan.product,
            )

          if (
            !horse ||
            !horse.active ||
            !product ||
            !product.active
          ) {
            return null
          }

          const stall =
            getSingleRelation(
              horse.stall,
            )

          const confirmation =
            confirmationByMealId.get(
              meal.id,
            ) ??
            null

          const item: DailyFeedingRoutineItem = {
            feedingPlanId:
              plan.id,

            feedingMealId:
              meal.id,

            horseId:
              horse.id,

            horseName:
              horse.name,

            stallId:
              stall?.id ??
              null,

            stallName:
              stall?.name ??
              null,

            inventoryItemId:
              product.id,

            productName:
              product.name,

            period:
              meal.name,

            scheduledTime:
              meal.scheduled_time.slice(
                0,
                5,
              ),

            plannedQuantity:
              Number(
                meal.quantity,
              ),

            confirmed:
              confirmation !==
              null,

            confirmationId:
              confirmation?.id ??
              null,

            actualQuantity:
              confirmation?.actualQuantity ??
              null,

            confirmedAt:
              confirmation?.confirmedAt ??
              null,
          }

          return item
        },
      )
      .filter(
        (
          item,
        ): item is DailyFeedingRoutineItem =>
          item !== null,
      )

  return routineItems
}

export async function confirmFeeding(
  input: ConfirmFeedingInput,
): Promise<ConfirmFeedingResult> {
  if (
    input.actualQuantity !==
      undefined &&
    input.actualQuantity !==
      null &&
    input.actualQuantity <=
      0
  ) {
    throw new Error(
      'A quantidade fornecida deve ser maior que zero.',
    )
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'confirm_feeding',
    {
      p_feeding_meal_id:
        input.feedingMealId,

      p_feeding_date:
        input.feedingDate,

      p_actual_quantity:
        input.actualQuantity ??
        null,

      p_notes:
        input.notes?.trim() ||
        null,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao confirmar alimentação: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | ConfirmFeedingRow
      | undefined

  if (!result) {
    throw new Error(
      'A confirmação foi executada, mas o banco não retornou o resultado esperado.',
    )
  }

  return mapConfirmFeedingResult(
    result,
  )
}

export async function confirmFeedingBatch(
  input: ConfirmFeedingBatchInput,
): Promise<ConfirmFeedingBatchResult> {
  const uniqueMealIds =
    Array.from(
      new Set(
        input.feedingMealIds,
      ),
    )

  if (
    uniqueMealIds.length ===
    0
  ) {
    throw new Error(
      'Nenhuma refeição pendente foi informada.',
    )
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'confirm_feeding_batch',
    {
      p_feeding_meal_ids:
        uniqueMealIds,

      p_feeding_date:
        input.feedingDate,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao confirmar refeições em lote: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | ConfirmFeedingBatchRow
      | undefined

  if (!result) {
    throw new Error(
      'A confirmação em lote foi executada, mas o banco não retornou o resultado esperado.',
    )
  }

  return mapConfirmFeedingBatchResult(
    result,
  )
}