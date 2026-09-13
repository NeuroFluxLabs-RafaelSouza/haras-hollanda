export type InventoryCategory =
  | 'feed'
  | 'hay'
  | 'bedding'
  | 'medication'
  | 'supplement'
  | 'equipment'
  | 'other'

export type InventoryUnit =
  | 'kg'
  | 'bag'
  | 'bale'
  | 'liter'
  | 'unit'
  | 'box'

export type InventoryMovementType =
  | 'entry'
  | 'exit'

export type InventoryItem = {
  id: string
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  minimumStock: number
  active: boolean
  createdAt: string
}

export type InventoryMovement = {
  id: string
  itemId: string
  movementType: InventoryMovementType
  quantity: number
  unitCost: number | null
  notes: string | null
  movementAt: string
  createdAt: string
}

export type CreateInventoryItemInput = {
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  minimumStock: number
}

export type UpdateInventoryItemInput = {
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  minimumStock: number
  active: boolean
}

export type CreateInventoryMovementInput = {
  itemId: string
  movementType: InventoryMovementType
  quantity: number
  unitCost: number | null
  notes: string | null
  movementAt: string
}

export type InventoryItemSummary = {
  item: InventoryItem
  currentStock: number
  isBelowMinimum: boolean
}

export const INVENTORY_CATEGORY_LABELS: Record<
  InventoryCategory,
  string
> = {
  feed: 'Ração',
  hay: 'Feno',
  bedding: 'Cama',
  medication: 'Medicamento',
  supplement: 'Suplemento',
  equipment: 'Equipamento',
  other: 'Outro',
}

export const INVENTORY_UNIT_LABELS: Record<
  InventoryUnit,
  string
> = {
  kg: 'Kg',
  bag: 'Saco',
  bale: 'Fardo',
  liter: 'Litro',
  unit: 'Unidade',
  box: 'Caixa',
}

export const INVENTORY_MOVEMENT_LABELS: Record<
  InventoryMovementType,
  string
> = {
  entry: 'Entrada',
  exit: 'Saída',
}

export function calculateCurrentStock(
  movements: InventoryMovement[],
) {
  return movements.reduce(
    (total, movement) => {
      if (
        movement.movementType ===
        'entry'
      ) {
        return (
          total +
          movement.quantity
        )
      }

      return (
        total -
        movement.quantity
      )
    },
    0,
  )
}

export function isInventoryBelowMinimum(
  item: InventoryItem,
  currentStock: number,
) {
  return (
    currentStock <=
    item.minimumStock
  )
}