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
  logo_path: string | null
  monthly_due_day: number
  financial_alert_days: number
  inventory_replenishment_days: number
  created_at: string
  updated_at: string
}

const MEDIA_BUCKET =
  'haras-media'

const MAX_IMAGE_SIZE_BYTES =
  5 * 1024 * 1024

const SIGNED_URL_DURATION_SECONDS =
  60 * 60 * 24

export const APP_SETTINGS_UPDATED_EVENT =
  'haras-settings-updated'

const settingsSelect = `
  id,
  haras_name,
  logo_path,
  monthly_due_day,
  financial_alert_days,
  inventory_replenishment_days,
  created_at,
  updated_at
`

function notifySettingsUpdated() {
  if (
    typeof window ===
    'undefined'
  ) {
    return
  }

  window.dispatchEvent(
    new Event(
      APP_SETTINGS_UPDATED_EVENT,
    ),
  )
}

function mapAppSettings(
  row: AppSettingsRow,
): AppSettings {
  return {
    harasName:
      row.haras_name,

    logoPath:
      row.logo_path,

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

function getImageExtension(
  file: File,
) {
  switch (
    file.type
  ) {
    case 'image/jpeg':
      return 'jpg'

    case 'image/png':
      return 'png'

    case 'image/webp':
      return 'webp'

    default:
      throw new Error(
        'Use uma imagem JPG, PNG ou WebP.',
      )
  }
}

function validateImageFile(
  file: File,
) {
  if (
    file.size <=
    0
  ) {
    throw new Error(
      'O arquivo selecionado está vazio.',
    )
  }

  if (
    file.size >
    MAX_IMAGE_SIZE_BYTES
  ) {
    throw new Error(
      'A imagem deve ter no máximo 5 MB.',
    )
  }

  getImageExtension(
    file,
  )
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

export async function getHarasLogoUrl(
  logoPath: string | null,
): Promise<string | null> {
  if (
    !logoPath
  ) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .storage
    .from(
      MEDIA_BUCKET,
    )
    .createSignedUrl(
      logoPath,
      SIGNED_URL_DURATION_SECONDS,
    )

  if (
    error ||
    !data?.signedUrl
  ) {
    return null
  }

  return data.signedUrl
}

export async function uploadHarasLogo(
  file: File,
): Promise<AppSettings> {
  validateImageFile(
    file,
  )

  const currentSettings =
    await getAppSettings()

  const extension =
    getImageExtension(
      file,
    )

  const logoPath =
    `branding/logo-${Date.now()}.${extension}`

  const {
    error: uploadError,
  } =
    await supabase
      .storage
      .from(
        MEDIA_BUCKET,
      )
      .upload(
        logoPath,
        file,
        {
          cacheControl:
            '3600',

          upsert:
            false,
        },
      )

  if (uploadError) {
    throw new Error(
      `Erro ao enviar logo: ${uploadError.message}`,
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
      logo_path:
        logoPath,

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
    await supabase
      .storage
      .from(
        MEDIA_BUCKET,
      )
      .remove([
        logoPath,
      ])

    throw new Error(
      `Erro ao salvar logo: ${error.message}`,
    )
  }

  if (
    currentSettings.logoPath &&
    currentSettings.logoPath !==
      logoPath
  ) {
    await supabase
      .storage
      .from(
        MEDIA_BUCKET,
      )
      .remove([
        currentSettings.logoPath,
      ])
  }

  const settings =
    mapAppSettings(
      data as AppSettingsRow,
    )

  notifySettingsUpdated()

  return settings
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

  const settings =
    mapAppSettings(
      data as AppSettingsRow,
    )

  notifySettingsUpdated()

  return settings
}