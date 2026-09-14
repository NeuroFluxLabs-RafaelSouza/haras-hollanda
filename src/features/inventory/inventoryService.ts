import {
  calculateCurrentStock,
  isInventoryBelowMinimum,
  type CreateInventoryItemInput,
  type CreateInventoryMovementInput,
  type InventoryCategory,
  type InventoryItem,
  type InventoryItemSummary,
  type InventoryMovement,
  type InventoryMovementSourceType,
  type InventoryMovementType,
  type InventoryUnit,
  type UpdateInventoryItemInput,
} from '../../domain/inventory.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

export const INVENTORY_REPLENISHMENT_DAYS =
  7

export type InventoryOperationalSummary =
  InventoryItemSummary & {
    dailyConsumption: number
    autonomyDays: number | null
    needsReplenishment: boolean
  }

type InventoryItemRow = {
  id: string
  name: string

  category:
    InventoryCategory

  unit:
    InventoryUnit

  purchase_unit:
    InventoryUnit | null

  package_size:
    number | null

  minimum_stock: number
  active: boolean
  created_at: string
}

type InventoryMovementRow = {
  id: string
  item_id: string

  movement_type:
    InventoryMovementType

  quantity: number

  unit_cost:
    number | null

  notes:
    string | null

  movement_at: string

  source_type:
    InventoryMovementSourceType

  horse_id:
    string | null

  purchase_quantity:
    number | null

  purchase_unit:
    InventoryUnit | null

  package_size:
    number | null

  total_cost:
    number | null

  created_at: string
}

type FeedingPlanInventoryRow = {
  id: string
  horse_id: string
  inventory_item_id: string
}

type FeedingMealConsumptionRow = {
  feeding_plan_id: string
  quantity: number | string
}

type ActiveHorseRow = {
  id: string
}

const inventoryItemSelect = `
  id,
  name,
  category,
  unit,
  purchase_unit,
  package_size,
  minimum_stock,
  active,
  created_at
`

const inventoryMovementSelect = `
  id,
  item_id,
  movement_type,
  quantity,
  unit_cost,
  notes,
  movement_at,
  source_type,
  horse_id,
  purchase_quantity,
  purchase_unit,
  package_size,
  total_cost,
  created_at
`

function mapInventoryItem(
  row: InventoryItemRow,
): InventoryItem {
  return {
    id:
      row.id,

    name:
      row.name,

    category:
      row.category,

    unit:
      row.unit,

    purchaseUnit:
      row.purchase_unit,

    packageSize:
      row.package_size ===
      null
        ? null
        : Number(
            row.package_size,
          ),

    minimumStock:
      Number(
        row.minimum_stock,
      ),

    active:
      row.active,

    createdAt:
      row.created_at,
  }
}

function mapInventoryMovement(
  row: InventoryMovementRow,
): InventoryMovement {
  return {
    id:
      row.id,

    itemId:
      row.item_id,

    movementType:
      row.movement_type,

    quantity:
      Number(
        row.quantity,
      ),

    unitCost:
      row.unit_cost ===
      null
        ? null
        : Number(
            row.unit_cost,
          ),

    notes:
      row.notes,

    movementAt:
      row.movement_at,

    sourceType:
      row.source_type,

    horseId:
      row.horse_id,

    purchaseQuantity:
      row.purchase_quantity ===
      null
        ? null
        : Number(
            row.purchase_quantity,
          ),

    purchaseUnit:
      row.purchase_unit,

    packageSize:
      row.package_size ===
      null
        ? null
        : Number(
            row.package_size,
          ),

    totalCost:
      row.total_cost ===
      null
        ? null
        : Number(
            row.total_cost,
          ),

    createdAt:
      row.created_at,
  }
}

async function getDailyFeedingConsumptionByItem(): Promise<
  Map<string, number>
> {
  const [
    plansResult,
    mealsResult,
    horsesResult,
  ] = await Promise.all([
    supabase
      .from('feeding_plans')
      .select(`
        id,
        horse_id,
        inventory_item_id
      `)
      .eq(
        'active',
        true,
      ),

    supabase
      .from('feeding_plan_meals')
      .select(`
        feeding_plan_id,
        quantity
      `)
      .eq(
        'active',
        true,
      ),

    supabase
      .from('horses')
      .select('id')
      .eq(
        'active',
        true,
      ),
  ])

  if (plansResult.error) {
    throw new Error(
      `Erro ao buscar planos alimentares: ${plansResult.error.message}`,
    )
  }

  if (mealsResult.error) {
    throw new Error(
      `Erro ao buscar consumo alimentar: ${mealsResult.error.message}`,
    )
  }

  if (horsesResult.error) {
    throw new Error(
      `Erro ao verificar cavalos ativos: ${horsesResult.error.message}`,
    )
  }

  const activeHorseIds =
    new Set(
      (
        horsesResult.data ??
        []
      ).map(
        (horse) =>
          (
            horse as ActiveHorseRow
          ).id,
      ),
    )

  const inventoryItemByPlanId =
    new Map<
      string,
      string
    >()

  for (
    const row
    of plansResult.data ??
      []
  ) {
    const plan =
      row as FeedingPlanInventoryRow

    if (
      !activeHorseIds.has(
        plan.horse_id,
      )
    ) {
      continue
    }

    inventoryItemByPlanId.set(
      plan.id,
      plan.inventory_item_id,
    )
  }

  const consumptionByItem =
    new Map<
      string,
      number
    >()

  for (
    const row
    of mealsResult.data ??
      []
  ) {
    const meal =
      row as FeedingMealConsumptionRow

    const itemId =
      inventoryItemByPlanId.get(
        meal.feeding_plan_id,
      )

    if (!itemId) {
      continue
    }

    const quantity =
      Number(
        meal.quantity,
      )

    if (
      !Number.isFinite(
        quantity,
      ) ||
      quantity <=
        0
    ) {
      continue
    }

    const currentConsumption =
      consumptionByItem.get(
        itemId,
      ) ??
      0

    consumptionByItem.set(
      itemId,
      currentConsumption +
        quantity,
    )
  }

  return consumptionByItem
}

export async function getInventoryItems(): Promise<
  InventoryItem[]
> {
  const {
    data,
    error,
  } = await supabase
    .from('inventory_items')
    .select(
      inventoryItemSelect,
    )
    .order(
      'name',
      {
        ascending:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar itens do estoque: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (item) =>
      mapInventoryItem(
        item as InventoryItemRow,
      ),
  )
}

export async function getActiveInventoryItems(): Promise<
  InventoryItem[]
> {
  const {
    data,
    error,
  } = await supabase
    .from('inventory_items')
    .select(
      inventoryItemSelect,
    )
    .eq(
      'active',
      true,
    )
    .order(
      'name',
      {
        ascending:
          true,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar itens ativos do estoque: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (item) =>
      mapInventoryItem(
        item as InventoryItemRow,
      ),
  )
}

export async function getInventoryItemById(
  itemId: string,
): Promise<InventoryItem> {
  const {
    data,
    error,
  } = await supabase
    .from('inventory_items')
    .select(
      inventoryItemSelect,
    )
    .eq(
      'id',
      itemId,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao buscar item do estoque: ${error.message}`,
    )
  }

  return mapInventoryItem(
    data as InventoryItemRow,
  )
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<InventoryItem> {
  const {
    data,
    error,
  } = await supabase
    .from('inventory_items')
    .insert({
      name:
        input.name,

      category:
        input.category,

      unit:
        input.unit,

      purchase_unit:
        input.purchaseUnit ??
        null,

      package_size:
        input.packageSize ??
        null,

      minimum_stock:
        input.minimumStock,
    })
    .select(
      inventoryItemSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao cadastrar item no estoque: ${error.message}`,
    )
  }

  return mapInventoryItem(
    data as InventoryItemRow,
  )
}

export async function updateInventoryItem(
  itemId: string,
  input: UpdateInventoryItemInput,
): Promise<InventoryItem> {
  const {
    data,
    error,
  } = await supabase
    .from('inventory_items')
    .update({
      name:
        input.name,

      category:
        input.category,

      unit:
        input.unit,

      purchase_unit:
        input.purchaseUnit ??
        null,

      package_size:
        input.packageSize ??
        null,

      minimum_stock:
        input.minimumStock,

      active:
        input.active,
    })
    .eq(
      'id',
      itemId,
    )
    .select(
      inventoryItemSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar item do estoque: ${error.message}`,
    )
  }

  return mapInventoryItem(
    data as InventoryItemRow,
  )
}

export async function getInventoryMovements(): Promise<
  InventoryMovement[]
> {
  const {
    data,
    error,
  } = await supabase
    .from('inventory_movements')
    .select(
      inventoryMovementSelect,
    )
    .order(
      'movement_at',
      {
        ascending:
          false,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar movimentações do estoque: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (movement) =>
      mapInventoryMovement(
        movement as InventoryMovementRow,
      ),
  )
}

export async function getInventoryMovementsByItemId(
  itemId: string,
): Promise<InventoryMovement[]> {
  const {
    data,
    error,
  } = await supabase
    .from('inventory_movements')
    .select(
      inventoryMovementSelect,
    )
    .eq(
      'item_id',
      itemId,
    )
    .order(
      'movement_at',
      {
        ascending:
          false,
      },
    )

  if (error) {
    throw new Error(
      `Erro ao buscar movimentações do item: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (movement) =>
      mapInventoryMovement(
        movement as InventoryMovementRow,
      ),
  )
}

export async function getInventoryCurrentStock(
  itemId: string,
): Promise<number> {
  const movements =
    await getInventoryMovementsByItemId(
      itemId,
    )

  return calculateCurrentStock(
    movements,
  )
}

export async function createInventoryMovement(
  input: CreateInventoryMovementInput,
): Promise<InventoryMovement> {
  if (
    input.quantity <=
    0
  ) {
    throw new Error(
      'A quantidade da movimentação deve ser maior que zero.',
    )
  }

  if (
    input.movementType ===
    'exit'
  ) {
    const currentStock =
      await getInventoryCurrentStock(
        input.itemId,
      )

    if (
      input.quantity >
      currentStock
    ) {
      throw new Error(
        `Estoque insuficiente. Disponível: ${currentStock}.`,
      )
    }
  }

  const sourceType =
    input.sourceType ??
    'manual'

  const {
    data,
    error,
  } = await supabase
    .from('inventory_movements')
    .insert({
      item_id:
        input.itemId,

      movement_type:
        input.movementType,

      quantity:
        input.quantity,

      unit_cost:
        input.unitCost,

      notes:
        input.notes,

      movement_at:
        input.movementAt,

      source_type:
        sourceType,

      horse_id:
        input.horseId ??
        null,

      purchase_quantity:
        input.purchaseQuantity ??
        null,

      purchase_unit:
        input.purchaseUnit ??
        null,

      package_size:
        input.packageSize ??
        null,

      total_cost:
        input.totalCost ??
        null,
    })
    .select(
      inventoryMovementSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao registrar movimentação: ${error.message}`,
    )
  }

  return mapInventoryMovement(
    data as InventoryMovementRow,
  )
}

export async function getInventorySummary(): Promise<
  InventoryOperationalSummary[]
> {
  const [
    items,
    movements,
    consumptionByItem,
  ] = await Promise.all([
    getInventoryItems(),
    getInventoryMovements(),
    getDailyFeedingConsumptionByItem(),
  ])

  const movementsByItem =
    new Map<
      string,
      InventoryMovement[]
    >()

  for (
    const movement
    of movements
  ) {
    const itemMovements =
      movementsByItem.get(
        movement.itemId,
      ) ??
      []

    itemMovements.push(
      movement,
    )

    movementsByItem.set(
      movement.itemId,
      itemMovements,
    )
  }

  return items.map(
    (item) => {
      const itemMovements =
        movementsByItem.get(
          item.id,
        ) ??
        []

      const currentStock =
        calculateCurrentStock(
          itemMovements,
        )

      const isBelowMinimum =
        isInventoryBelowMinimum(
          item,
          currentStock,
        )

      const dailyConsumption =
        consumptionByItem.get(
          item.id,
        ) ??
        0

      const autonomyDays =
        dailyConsumption >
        0
          ? Math.max(
              0,
              currentStock /
                dailyConsumption,
            )
          : null

      const needsReplenishment =
        isBelowMinimum ||
        (
          autonomyDays !==
            null &&
          autonomyDays <=
            INVENTORY_REPLENISHMENT_DAYS
        )

      return {
        item,

        currentStock,

        isBelowMinimum,

        dailyConsumption,

        autonomyDays,

        needsReplenishment,
      }
    },
  )
}