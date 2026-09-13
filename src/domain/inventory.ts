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

export type InventoryMovementSourceType =
  | 'manual'
  | 'purchase'
  | 'feeding'
  | 'adjustment'

export type InventoryItem = {
  id: string
  name: string
  category: InventoryCategory

  /*
   * Unidade real usada para controlar o saldo.
   *
   * Exemplo:
   * Ração Premium → kg
   */
  unit: InventoryUnit

  /*
   * Unidade comercial utilizada na compra.
   *
   * Exemplo:
   * Ração Premium → bag
   */
  purchaseUnit: InventoryUnit | null

  /*
   * Quantidade da unidade base existente
   * dentro de uma embalagem comercial.
   *
   * Exemplo:
   * 1 saco = 40 kg
   */
  packageSize: number | null

  minimumStock: number
  active: boolean
  createdAt: string
}

export type InventoryMovement = {
  id: string
  itemId: string

  movementType:
    InventoryMovementType

  /*
   * Quantidade movimentada na unidade
   * real do estoque.
   *
   * Exemplo:
   * compra de 10 sacos de 40 kg
   * quantity = 400
   */
  quantity: number

  /*
   * Custo da unidade comercial.
   *
   * Exemplo:
   * R$ 95,00 por saco.
   */
  unitCost: number | null

  notes: string | null
  movementAt: string

  sourceType:
    InventoryMovementSourceType

  horseId: string | null

  /*
   * Dados comerciais da compra.
   *
   * Exemplo:
   * purchaseQuantity = 10
   * purchaseUnit = bag
   * packageSize = 40
   * totalCost = 950
   */
  purchaseQuantity: number | null
  purchaseUnit: InventoryUnit | null
  packageSize: number | null
  totalCost: number | null

  createdAt: string
}

export type CreateInventoryItemInput = {
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  minimumStock: number

  purchaseUnit?: InventoryUnit | null
  packageSize?: number | null
}

export type UpdateInventoryItemInput = {
  name: string
  category: InventoryCategory
  unit: InventoryUnit
  minimumStock: number
  active: boolean

  purchaseUnit?: InventoryUnit | null
  packageSize?: number | null
}

export type CreateInventoryMovementInput = {
  itemId: string
  movementType:
    InventoryMovementType

  quantity: number
  unitCost: number | null
  notes: string | null
  movementAt: string

  /*
   * Estes campos são opcionais para manter
   * compatibilidade com as telas atuais.
   *
   * Quando não forem informados:
   * sourceType → manual
   */
  sourceType?:
    InventoryMovementSourceType

  horseId?: string | null

  purchaseQuantity?: number | null
  purchaseUnit?: InventoryUnit | null
  packageSize?: number | null
  totalCost?: number | null
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

export const INVENTORY_MOVEMENT_SOURCE_LABELS: Record<
  InventoryMovementSourceType,
  string
> = {
  manual: 'Manual',
  purchase: 'Compra',
  feeding: 'Alimentação',
  adjustment: 'Ajuste',
}

export function calculateCurrentStock(
  movements: InventoryMovement[],
) {
  return movements.reduce(
    (
      total,
      movement,
    ) => {
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

export function calculatePurchaseStockQuantity(
  purchaseQuantity: number,
  packageSize: number,
) {
  return (
    purchaseQuantity *
    packageSize
  )
}

export function calculatePurchaseTotal(
  purchaseQuantity: number,
  unitCost: number,
) {
  return (
    purchaseQuantity *
    unitCost
  )
}