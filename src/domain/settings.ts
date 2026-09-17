export type AppSettings = {
  harasName: string
  monthlyDueDay: number
  financialAlertDays: number
  inventoryReplenishmentDays: number
  updatedAt: string
}

export type UpdateAppSettingsInput = {
  harasName: string
  monthlyDueDay: number
  financialAlertDays: number
  inventoryReplenishmentDays: number
}