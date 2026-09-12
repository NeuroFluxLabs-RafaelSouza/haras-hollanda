import type {
  CreateHorseInput,
  Horse,
  HorseSex,
  UpdateHorseInput,
} from '../../domain/horse.ts'

import type {
  Stall,
  StallStatus,
} from '../../domain/stall.ts'

import { supabase } from '../../lib/supabase.ts'

type HorseRow = {
  id: string
  name: string
  breed: string | null
  sex: HorseSex
  client_id: string
  stall_id: string | null
  monthly_fee: number | null
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

type HorseListRow = HorseRow & {
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

export type HorseListItem = Horse & {
  clientName: string
  stallName: string | null
  stallStatus: StallStatus | null
}

const horseSelect = `
  id,
  name,
  breed,
  sex,
  client_id,
  stall_id,
  monthly_fee,
  active,
  created_at
`

const horseListSelect = `
  id,
  name,
  breed,
  sex,
  client_id,
  stall_id,
  monthly_fee,
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

  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

function mapHorse(
  row: HorseRow,
): Horse {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    sex: row.sex,
    clientId: row.client_id,
    stallId: row.stall_id,
    monthlyFee: row.monthly_fee,
    active: row.active,
    createdAt: row.created_at,
  }
}

function mapHorseListItem(
  row: HorseListRow,
): HorseListItem {
  const client = getSingleRelation(row.client)
  const stall = getSingleRelation(row.stall)

  return {
    ...mapHorse(row),
    clientName:
      client?.name ?? 'Cliente não identificado',
    stallName:
      stall?.name ?? null,
    stallStatus:
      stall?.status ?? null,
  }
}

function mapAvailableStall(
  row: AvailableStallRow,
): Stall {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    notes: row.notes,
    maintenanceUntil: row.maintenance_until,
    createdAt: row.created_at,
  }
}

export async function getHorses(): Promise<
  HorseListItem[]
> {
  const { data, error } = await supabase
    .from('horses')
    .select(horseListSelect)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(
      `Erro ao buscar cavalos: ${error.message}`,
    )
  }

  return (data ?? []).map((horse) =>
    mapHorseListItem(horse as HorseListRow),
  )
}

export async function getHorseById(
  horseId: string,
): Promise<Horse> {
  const { data, error } = await supabase
    .from('horses')
    .select(horseSelect)
    .eq('id', horseId)
    .single()

  if (error) {
    throw new Error(
      `Erro ao buscar cavalo: ${error.message}`,
    )
  }

  return mapHorse(data as HorseRow)
}

export async function getAvailableStalls(): Promise<
  Stall[]
> {
  const [
    stallsResult,
    occupiedStallsResult,
  ] = await Promise.all([
    supabase
      .from('stalls')
      .select(`
        id,
        name,
        status,
        notes,
        maintenance_until,
        created_at
      `)
      .eq('status', 'operational')
      .order('name', { ascending: true }),

    supabase
      .from('horses')
      .select('stall_id')
      .eq('active', true)
      .not('stall_id', 'is', null),
  ])

  if (stallsResult.error) {
    throw new Error(
      `Erro ao buscar baias disponíveis: ${stallsResult.error.message}`,
    )
  }

  if (occupiedStallsResult.error) {
    throw new Error(
      `Erro ao verificar ocupação das baias: ${occupiedStallsResult.error.message}`,
    )
  }

  const occupiedStallIds = new Set(
    (occupiedStallsResult.data ?? [])
      .map((horse) => horse.stall_id)
      .filter(
        (stallId): stallId is string =>
          stallId !== null,
      ),
  )

  return (stallsResult.data ?? [])
    .map((stall) =>
      mapAvailableStall(
        stall as AvailableStallRow,
      ),
    )
    .filter(
      (stall) =>
        !occupiedStallIds.has(stall.id),
    )
}

export async function createHorse(
  input: CreateHorseInput,
): Promise<Horse> {
  const { data, error } = await supabase
    .from('horses')
    .insert({
      name: input.name,
      breed: input.breed,
      sex: input.sex,
      client_id: input.clientId,
      stall_id: input.stallId,
      monthly_fee: input.monthlyFee,
    })
    .select(horseSelect)
    .single()

  if (error) {
    throw new Error(
      `Erro ao cadastrar cavalo: ${error.message}`,
    )
  }

  return mapHorse(data as HorseRow)
}

export async function updateHorse(
  horseId: string,
  input: UpdateHorseInput,
): Promise<Horse> {
  const { data, error } = await supabase
    .from('horses')
    .update({
      name: input.name,
      breed: input.breed,
      sex: input.sex,
      client_id: input.clientId,
      stall_id: input.stallId,
      monthly_fee: input.monthlyFee,
      active: input.active,
    })
    .eq('id', horseId)
    .select(horseSelect)
    .single()

  if (error) {
    throw new Error(
      `Erro ao atualizar cavalo: ${error.message}`,
    )
  }

  return mapHorse(data as HorseRow)
}