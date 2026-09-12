import type {
  CreateStallInput,
  Stall,
  StallMaintenanceAlert,
  StallStatus,
  UpdateStallOperationalInput,
} from '../../domain/stall.ts'

import {
  createStallMaintenanceAlert,
} from '../../domain/stall.ts'

import { supabase } from '../../lib/supabase.ts'

type StallRow = {
  id: string
  name: string
  status: StallStatus
  notes: string | null
  maintenance_until: string | null
  created_at: string
}

const stallSelect = `
  id,
  name,
  status,
  notes,
  maintenance_until,
  created_at
`

function mapStall(row: StallRow): Stall {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    notes: row.notes,
    maintenanceUntil: row.maintenance_until,
    createdAt: row.created_at,
  }
}

export async function getStalls(): Promise<Stall[]> {
  const { data, error } = await supabase
    .from('stalls')
    .select(stallSelect)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar baias: ${error.message}`)
  }

  return (data ?? []).map((stall) =>
    mapStall(stall as StallRow),
  )
}

export async function getStallById(
  stallId: string,
): Promise<Stall> {
  const { data, error } = await supabase
    .from('stalls')
    .select(stallSelect)
    .eq('id', stallId)
    .single()

  if (error) {
    throw new Error(`Erro ao buscar baia: ${error.message}`)
  }

  return mapStall(data as StallRow)
}

export async function createStall(
  input: CreateStallInput,
): Promise<Stall> {
  const { data, error } = await supabase
    .from('stalls')
    .insert({
      name: input.name,
    })
    .select(stallSelect)
    .single()

  if (error) {
    throw new Error(`Erro ao cadastrar baia: ${error.message}`)
  }

  return mapStall(data as StallRow)
}

export async function updateStallOperational(
  stallId: string,
  input: UpdateStallOperationalInput,
): Promise<Stall> {
  const { data, error } = await supabase
    .from('stalls')
    .update({
      status: input.status,
      notes: input.notes,
      maintenance_until: input.maintenanceUntil,
    })
    .eq('id', stallId)
    .select(stallSelect)
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar baia: ${error.message}`)
  }

  return mapStall(data as StallRow)
}

export async function getStallMaintenanceAlerts(): Promise<
  StallMaintenanceAlert[]
> {
  const stalls = await getStalls()

  return stalls
    .map((stall) =>
      createStallMaintenanceAlert(stall),
    )
    .filter(
      (
        alert,
      ): alert is StallMaintenanceAlert =>
        alert !== null,
    )
}