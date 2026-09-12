import type {
  CreateStallInput,
  Stall,
} from '../../domain/stall.ts'

import { supabase } from '../../lib/supabase'

type StallRow = {
  id: string
  name: string
  active: boolean
  created_at: string
}

function mapStall(row: StallRow): Stall {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    createdAt: row.created_at,
  }
}

export async function getStalls(): Promise<Stall[]> {
  const { data, error } = await supabase
    .from('stalls')
    .select('id, name, active, created_at')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar baias: ${error.message}`)
  }

  return (data ?? []).map((stall) =>
    mapStall(stall as StallRow),
  )
}

export async function createStall(
  input: CreateStallInput,
): Promise<Stall> {
  const { data, error } = await supabase
    .from('stalls')
    .insert({
      name: input.name,
    })
    .select('id, name, active, created_at')
    .single()

  if (error) {
    throw new Error(`Erro ao cadastrar baia: ${error.message}`)
  }

  return mapStall(data as StallRow)
}