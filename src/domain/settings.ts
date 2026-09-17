export type AppSettings = {
  harasName: string
  logoPath: string | null
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