export type FeedingPlan = {
  id: string
  horseId: string
  inventoryItemId: string
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type FeedingPlanMeal = {
  id: string
  feedingPlanId: string
  name: string
  scheduledTime: string
  quantity: number
  active: boolean
  createdAt: string
}

export type FeedingConfirmation = {
  id: string
  feedingPlanId: string
  feedingMealId: string
  horseId: string
  inventoryItemId: string
  inventoryMovementId: string
  feedingDate: string
  plannedQuantity: number
  actualQuantity: number
  notes: string | null
  confirmedAt: string
  createdAt: string
}

export type FeedingPlanWithMeals = {
  plan: FeedingPlan
  meals: FeedingPlanMeal[]
}

export type CreateFeedingPlanInput = {
  horseId: string
  inventoryItemId: string
  notes?: string | null
}

export type UpdateFeedingPlanInput = {
  inventoryItemId: string
  notes?: string | null
  active: boolean
}

export type CreateFeedingPlanMealInput = {
  feedingPlanId: string
  name: string
  scheduledTime: string
  quantity: number
}

export type UpdateFeedingPlanMealInput = {
  name: string
  scheduledTime: string
  quantity: number
  active: boolean
}

export type ConfirmFeedingInput = {
  feedingMealId: string
  feedingDate: string
  actualQuantity?: number | null
  notes?: string | null
}

export type ConfirmFeedingResult = {
  confirmationId: string
  inventoryMovementId: string
  previousStock: number
  newStock: number
  plannedQuantity: number
  actualQuantity: number
}

export type ConfirmFeedingBatchInput = {
  feedingMealIds: string[]
  feedingDate: string
}

export type ConfirmFeedingBatchResult = {
  requestedCount: number
  confirmedCount: number
  skippedCount: number
  totalQuantity: number
}

export type DailyFeedingRoutineItem = {
  feedingPlanId: string
  feedingMealId: string

  horseId: string
  horseName: string

  stallId: string | null
  stallName: string | null

  inventoryItemId: string
  productName: string

  period: string
  scheduledTime: string
  plannedQuantity: number

  confirmed: boolean
  confirmationId: string | null
  actualQuantity: number | null
  confirmedAt: string | null
}

export function calculateDailyFeedingQuantity(
  meals: FeedingPlanMeal[],
) {
  return meals
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
        meal.quantity,
      0,
    )
}