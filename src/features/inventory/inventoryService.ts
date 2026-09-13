import {
  calculateCurrentStock,
  isInventoryBelowMinimum,
  type CreateInventoryItemInput,
  type CreateInventoryMovementInput,
  type InventoryCategory,
  type InventoryItem,
  type InventoryItemSummary,
  type InventoryMovement,
  type InventoryMovementType,
  type InventoryUnit,
  type UpdateInventoryItemInput,
} from '../../domain/inventory.ts'

import { supabase } from '../../lib/supabase.ts'

type InventoryItemRow = {
  id: string
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  minimum_stock: number
  active: boolean
  created_at: string
}

type InventoryMovementRow = {
  id: string
  item_id: string
  movement_type: InventoryMovementType
  quantity: number
  unit_cost: number | null
  notes: string | null
  movement_at: string
  created_at: string
}

const inventoryItemSelect = `
  id,
  name,
  category,
  unit,
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
  created_at
`

function mapInventoryItem(
  row: InventoryItemRow,
): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    minimumStock:
      Number(row.minimum_stock),
    active: row.active,
    createdAt: row.created_at,
  }
}

function mapInventoryMovement(
  row: InventoryMovementRow,
): InventoryMovement {
  return {
    id: row.id,
    itemId: row.item_id,
    movementType:
      row.movement_type,
    quantity:
      Number(row.quantity),
    unitCost:
      row.unit_cost === null
        ? null
        : Number(row.unit_cost),
    notes: row.notes,
    movementAt:
      row.movement_at,
    createdAt: row.created_at,
  }
}

export async function getInventoryItems(): Promise<
  InventoryItem[]
> {
  const { data, error } =
    await supabase
      .from('inventory_items')
      .select(inventoryItemSelect)
      .order('name', {
        ascending: true,
      })

  if (error) {
    throw new Error(
      `Erro ao buscar itens do estoque: ${error.message}`,
    )
  }

  return (data ?? []).map(
    (item) =>
      mapInventoryItem(
        item as InventoryItemRow,
      ),
  )
}

export async function getActiveInventoryItems(): Promise<
  InventoryItem[]
> {
  const { data, error } =
    await supabase
      .from('inventory_items')
      .select(inventoryItemSelect)
      .eq('active', true)
      .order('name', {
        ascending: true,
      })

  if (error) {
    throw new Error(
      `Erro ao buscar itens ativos do estoque: ${error.message}`,
    )
  }

  return (data ?? []).map(
    (item) =>
      mapInventoryItem(
        item as InventoryItemRow,
      ),
  )
}

export async function getInventoryItemById(
  itemId: string,
): Promise<InventoryItem> {
  const { data, error } =
    await supabase
      .from('inventory_items')
      .select(inventoryItemSelect)
      .eq('id', itemId)
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
  const { data, error } =
    await supabase
      .from('inventory_items')
      .insert({
        name: input.name,
        category: input.category,
        unit: input.unit,
        minimum_stock:
          input.minimumStock,
      })
      .select(inventoryItemSelect)
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
  const { data, error } =
    await supabase
      .from('inventory_items')
      .update({
        name: input.name,
        category: input.category,
        unit: input.unit,
        minimum_stock:
          input.minimumStock,
        active: input.active,
      })
      .eq('id', itemId)
      .select(inventoryItemSelect)
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
  const { data, error } =
    await supabase
      .from('inventory_movements')
      .select(inventoryMovementSelect)
      .order('movement_at', {
        ascending: false,
      })

  if (error) {
    throw new Error(
      `Erro ao buscar movimentações do estoque: ${error.message}`,
    )
  }

  return (data ?? []).map(
    (movement) =>
      mapInventoryMovement(
        movement as InventoryMovementRow,
      ),
  )
}

export async function getInventoryMovementsByItemId(
  itemId: string,
): Promise<InventoryMovement[]> {
  const { data, error } =
    await supabase
      .from('inventory_movements')
      .select(inventoryMovementSelect)
      .eq('item_id', itemId)
      .order('movement_at', {
        ascending: false,
      })

  if (error) {
    throw new Error(
      `Erro ao buscar movimentações do item: ${error.message}`,
    )
  }

  return (data ?? []).map(
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
  if (input.quantity <= 0) {
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

  const { data, error } =
    await supabase
      .from('inventory_movements')
      .insert({
        item_id: input.itemId,

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
  InventoryItemSummary[]
> {
  const [
    items,
    movements,
  ] = await Promise.all([
    getInventoryItems(),
    getInventoryMovements(),
  ])

  return items.map(
    (item) => {
      const itemMovements =
        movements.filter(
          (movement) =>
            movement.itemId ===
            item.id,
        )

      const currentStock =
        calculateCurrentStock(
          itemMovements,
        )

      return {
        item,

        currentStock,

        isBelowMinimum:
          isInventoryBelowMinimum(
            item,
            currentStock,
          ),
      }
    },
  )
}