import type {
  AppSettings,
  UpdateAppSettingsInput,
} from '../../domain/settings.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

type AppSettingsRow = {
  id: number
  haras_name: string
  monthly_due_day: number
  financial_alert_days: number
  inventory_replenishment_days: number
  created_at: string
  updated_at: string
}

const settingsSelect = `
  id,
  haras_name,
  monthly_due_day,
  financial_alert_days,
  inventory_replenishment_days,
  created_at,
  updated_at
`

function mapAppSettings(
  row: AppSettingsRow,
): AppSettings {
  return {
    harasName:
      row.haras_name,

    monthlyDueDay:
      row.monthly_due_day,

    financialAlertDays:
      row.financial_alert_days,

    inventoryReplenishmentDays:
      row.inventory_replenishment_days,

    updatedAt:
      row.updated_at,
  }
}

export async function getAppSettings(): Promise<AppSettings> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'app_settings',
    )
    .select(
      settingsSelect,
    )
    .eq(
      'id',
      1,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao carregar configurações: ${error.message}`,
    )
  }

  return mapAppSettings(
    data as AppSettingsRow,
  )
}

export async function updateAppSettings(
  input: UpdateAppSettingsInput,
): Promise<AppSettings> {
  const harasName =
    input.harasName.trim()

  if (!harasName) {
    throw new Error(
      'Informe o nome do haras.',
    )
  }

  if (
    !Number.isInteger(
      input.monthlyDueDay,
    ) ||
    input.monthlyDueDay < 1 ||
    input.monthlyDueDay > 28
  ) {
    throw new Error(
      'O vencimento deve estar entre os dias 1 e 28.',
    )
  }

  if (
    !Number.isInteger(
      input.financialAlertDays,
    ) ||
    input.financialAlertDays < 0 ||
    input.financialAlertDays > 15
  ) {
    throw new Error(
      'O aviso financeiro deve estar entre 0 e 15 dias.',
    )
  }

  if (
    !Number.isInteger(
      input.inventoryReplenishmentDays,
    ) ||
    input.inventoryReplenishmentDays < 1 ||
    input.inventoryReplenishmentDays > 60
  ) {
    throw new Error(
      'A autonomia mínima deve estar entre 1 e 60 dias.',
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'app_settings',
    )
    .update({
      haras_name:
        harasName,

      monthly_due_day:
        input.monthlyDueDay,

      financial_alert_days:
        input.financialAlertDays,

      inventory_replenishment_days:
        input.inventoryReplenishmentDays,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      1,
    )
    .select(
      settingsSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao salvar configurações: ${error.message}`,
    )
  }

  return mapAppSettings(
    data as AppSettingsRow,
  )
}