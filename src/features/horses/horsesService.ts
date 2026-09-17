import type {
  CreateHorseInput,
  Horse,
  HorseOwnershipType,
  HorseSex,
  UpdateHorseInput,
} from '../../domain/horse.ts'

import type {
  Stall,
  StallStatus,
} from '../../domain/stall.ts'

import {
  supabase,
} from '../../lib/supabase.ts'

type HorseRow = {
  id: string
  name: string
  breed: string | null
  sex: HorseSex
  birth_date: string | null
  ownership_type: HorseOwnershipType
  client_id: string | null
  stall_id: string | null
  monthly_fee: number | string | null
  photo_path: string | null
  active: boolean
  created_at: string
}

type ClientRelation = {
  id: string
  name: string
}

type StallRelation = {
  id: string
  name: string
  status: StallStatus
}

type Relation<T> =
  | T
  | T[]
  | null

type HorseListRow =
  HorseRow & {
    client: Relation<ClientRelation>
    stall: Relation<StallRelation>
  }

type AvailableStallRow = {
  id: string
  name: string
  status: StallStatus
  notes: string | null
  maintenance_until: string | null
  created_at: string
}

type CorrectHorseMonthlyFeeRow = {
  horse_id: string
  monthly_fee: number | string
  current_charge_updated: boolean
}

type SetHorsePhotoPathRow = {
  horse_id: string
  saved_photo_path: string
}

type HorseUpdatePayload = {
  name: string
  breed: string | null
  sex: HorseSex
  client_id: string | null
  stall_id: string | null
  monthly_fee: number | null
  active: boolean
  birth_date?: string | null
  ownership_type?: HorseOwnershipType
}

export type HorseListItem =
  Horse & {
    clientName: string
    stallName: string | null
    stallStatus: StallStatus | null
  }

export type HorsePhotoUploadResult = {
  photoPath: string
  photoUrl: string
}

const MEDIA_BUCKET =
  'haras-media'

const MAX_IMAGE_SIZE_BYTES =
  5 * 1024 * 1024

const HORSE_PHOTO_SIGNED_URL_DURATION =
  60 * 60 * 24

const ALLOWED_HORSE_PHOTO_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])

const horseSelect = `
  id,
  name,
  breed,
  sex,
  birth_date,
  ownership_type,
  client_id,
  stall_id,
  monthly_fee,
  photo_path,
  active,
  created_at
`

const horseListSelect = `
  id,
  name,
  breed,
  sex,
  birth_date,
  ownership_type,
  client_id,
  stall_id,
  monthly_fee,
  photo_path,
  active,
  created_at,
  client:clients (
    id,
    name
  ),
  stall:stalls (
    id,
    name,
    status
  )
`

function getSingleRelation<T>(
  relation: Relation<T>,
): T | null {
  if (!relation) {
    return null
  }

  if (
    Array.isArray(
      relation,
    )
  ) {
    return relation[0] ??
      null
  }

  return relation
}

function mapHorse(
  row: HorseRow,
): Horse {
  return {
    id:
      row.id,

    name:
      row.name,

    breed:
      row.breed,

    sex:
      row.sex,

    birthDate:
      row.birth_date,

    ownershipType:
      row.ownership_type,

    clientId:
      row.client_id,

    stallId:
      row.stall_id,

    monthlyFee:
      row.monthly_fee ===
      null
        ? null
        : Number(
            row.monthly_fee,
          ),

    photoPath:
      row.photo_path,

    active:
      row.active,

    createdAt:
      row.created_at,
  }
}

function mapHorseListItem(
  row: HorseListRow,
): HorseListItem {
  const client =
    getSingleRelation(
      row.client,
    )

  const stall =
    getSingleRelation(
      row.stall,
    )

  return {
    ...mapHorse(
      row,
    ),

    clientName:
      client?.name ??
      (
        row.ownership_type ===
        'haras'
          ? 'Haras Hollanda'
          : 'Cliente não identificado'
      ),

    stallName:
      stall?.name ??
      null,

    stallStatus:
      stall?.status ??
      null,
  }
}

function mapAvailableStall(
  row: AvailableStallRow,
): Stall {
  return {
    id:
      row.id,

    name:
      row.name,

    status:
      row.status,

    notes:
      row.notes,

    maintenanceUntil:
      row.maintenance_until,

    createdAt:
      row.created_at,
  }
}

function validateHorsePhotoFile(
  file: File,
) {
  if (
    !ALLOWED_HORSE_PHOTO_TYPES.has(
      file.type,
    )
  ) {
    throw new Error(
      'Use uma imagem JPG, PNG ou WebP.',
    )
  }

  if (
    file.size >
    MAX_IMAGE_SIZE_BYTES
  ) {
    throw new Error(
      'A foto deve ter no máximo 5 MB.',
    )
  }
}

export async function getHorsePhotoUrl(
  photoPath: string | null,
): Promise<string | null> {
  if (!photoPath) {
    return null
  }

  const {
    data,
    error,
  } = await supabase.storage
    .from(
      MEDIA_BUCKET,
    )
    .createSignedUrl(
      photoPath,
      HORSE_PHOTO_SIGNED_URL_DURATION,
    )

  if (error) {
    throw new Error(
      `Erro ao carregar foto do cavalo: ${error.message}`,
    )
  }

  if (
    !data.signedUrl
  ) {
    throw new Error(
      'O Storage não retornou uma URL para a foto do cavalo.',
    )
  }

  return data.signedUrl
}

export async function uploadHorsePhoto(
  horseId: string,
  currentPhotoPath: string | null,
  file: File,
): Promise<HorsePhotoUploadResult> {
  validateHorsePhotoFile(
    file,
  )

  const extension =
    file.type ===
    'image/png'
      ? 'png'
      : file.type ===
          'image/jpeg'
        ? 'jpg'
        : 'webp'

  const photoPath =
    `horses/${horseId}/photo-${Date.now()}.${extension}`

  const {
    error: uploadError,
  } = await supabase.storage
    .from(
      MEDIA_BUCKET,
    )
    .upload(
      photoPath,
      file,
      {
        contentType:
          file.type,

        upsert:
          false,
      },
    )

  if (uploadError) {
    throw new Error(
      `Erro ao enviar foto do cavalo: ${uploadError.message}`,
    )
  }

  const {
    data: updateData,
    error: updateError,
  } = await supabase.rpc(
    'set_horse_photo_path',
    {
      p_horse_id:
        horseId,

      p_photo_path:
        photoPath,
    },
  )

  if (updateError) {
    await supabase.storage
      .from(
        MEDIA_BUCKET,
      )
      .remove([
        photoPath,
      ])

    throw new Error(
      `Erro ao vincular foto ao cavalo: ${updateError.message}`,
    )
  }

  const updateResult =
    updateData?.[0] as
      | SetHorsePhotoPathRow
      | undefined

  if (
    !updateResult ||
    updateResult.horse_id !==
      horseId ||
    updateResult.saved_photo_path !==
      photoPath
  ) {
    await supabase.storage
      .from(
        MEDIA_BUCKET,
      )
      .remove([
        photoPath,
      ])

    throw new Error(
      'A foto foi enviada, mas não foi possível confirmar seu vínculo com o cavalo.',
    )
  }

  if (
    currentPhotoPath &&
    currentPhotoPath !==
      photoPath
  ) {
    await supabase.storage
      .from(
        MEDIA_BUCKET,
      )
      .remove([
        currentPhotoPath,
      ])
  }

  const photoUrl =
    await getHorsePhotoUrl(
      photoPath,
    )

  if (!photoUrl) {
    throw new Error(
      'A foto foi salva, mas não foi possível gerar sua visualização.',
    )
  }

  return {
    photoPath,
    photoUrl,
  }
}

export async function getHorses(): Promise<
  HorseListItem[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'horses',
    )
    .select(
      horseListSelect,
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
      `Erro ao buscar cavalos: ${error.message}`,
    )
  }

  return (
    data ??
    []
  ).map(
    (horse) =>
      mapHorseListItem(
        horse as HorseListRow,
      ),
  )
}

export async function getHorseById(
  horseId: string,
): Promise<Horse> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'horses',
    )
    .select(
      horseSelect,
    )
    .eq(
      'id',
      horseId,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao buscar cavalo: ${error.message}`,
    )
  }

  return mapHorse(
    data as HorseRow,
  )
}

export async function getAvailableStalls(): Promise<
  Stall[]
> {
  const [
    stallsResult,
    occupiedStallsResult,
  ] = await Promise.all([
    supabase
      .from(
        'stalls',
      )
      .select(`
        id,
        name,
        status,
        notes,
        maintenance_until,
        created_at
      `)
      .eq(
        'status',
        'operational',
      )
      .order(
        'name',
        {
          ascending:
            true,
        },
      ),

    supabase
      .from(
        'horses',
      )
      .select(
        'stall_id',
      )
      .eq(
        'active',
        true,
      )
      .not(
        'stall_id',
        'is',
        null,
      ),
  ])

  if (
    stallsResult.error
  ) {
    throw new Error(
      `Erro ao buscar baias disponíveis: ${stallsResult.error.message}`,
    )
  }

  if (
    occupiedStallsResult.error
  ) {
    throw new Error(
      `Erro ao verificar ocupação das baias: ${occupiedStallsResult.error.message}`,
    )
  }

  const occupiedStallIds =
    new Set(
      (
        occupiedStallsResult.data ??
        []
      )
        .map(
          (horse) =>
            horse.stall_id,
        )
        .filter(
          (
            stallId,
          ): stallId is string =>
            stallId !==
            null,
        ),
    )

  return (
    stallsResult.data ??
    []
  )
    .map(
      (stall) =>
        mapAvailableStall(
          stall as AvailableStallRow,
        ),
    )
    .filter(
      (stall) =>
        !occupiedStallIds.has(
          stall.id,
        ),
    )
}

export async function createHorse(
  input: CreateHorseInput,
): Promise<Horse> {
  const {
    data,
    error,
  } = await supabase
    .from(
      'horses',
    )
    .insert({
      name:
        input.name,

      breed:
        input.breed,

      sex:
        input.sex,

      ownership_type:
        'client',

      client_id:
        input.clientId,

      stall_id:
        input.stallId,

      monthly_fee:
        input.monthlyFee,
    })
    .select(
      horseSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao cadastrar cavalo: ${error.message}`,
    )
  }

  return mapHorse(
    data as HorseRow,
  )
}

export async function updateHorse(
  horseId: string,
  input: UpdateHorseInput,
): Promise<Horse> {
  const payload:
    HorseUpdatePayload = {
      name:
        input.name,

      breed:
        input.breed,

      sex:
        input.sex,

      client_id:
        input.clientId,

      stall_id:
        input.stallId,

      monthly_fee:
        input.monthlyFee,

      active:
        input.active,
    }

  if (
    input.birthDate !==
    undefined
  ) {
    payload.birth_date =
      input.birthDate
  }

  if (
    input.ownershipType !==
    undefined
  ) {
    payload.ownership_type =
      input.ownershipType

    if (
      input.ownershipType ===
      'haras'
    ) {
      payload.client_id =
        null

      payload.monthly_fee =
        null
    }
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'horses',
    )
    .update(
      payload,
    )
    .eq(
      'id',
      horseId,
    )
    .select(
      horseSelect,
    )
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar cavalo: ${error.message}`,
    )
  }

  return mapHorse(
    data as HorseRow,
  )
}

export async function updateHorseMonthlyFee(
  horseId: string,
  monthlyFee: number | null,
): Promise<Horse> {
  if (
    monthlyFee ===
      null ||
    !Number.isFinite(
      monthlyFee,
    ) ||
    monthlyFee <=
      0
  ) {
    throw new Error(
      'Informe uma mensalidade maior que zero.',
    )
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'correct_horse_monthly_fee',
    {
      p_horse_id:
        horseId,

      p_monthly_fee:
        monthlyFee,
    },
  )

  if (error) {
    throw new Error(
      `Erro ao atualizar mensalidade: ${error.message}`,
    )
  }

  const result =
    data?.[0] as
      | CorrectHorseMonthlyFeeRow
      | undefined

  if (!result) {
    throw new Error(
      'A mensalidade foi processada, mas o banco não retornou o resultado esperado.',
    )
  }

  return getHorseById(
    result.horse_id,
  )
}